const { TestTakerInvite, Assessment, Organization, Attempt } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { sendTestInvite } = require('../services/emailService');

/**
 * @desc    Create an invite for a test taker
 * @route   POST /api/invites
 * @access  Private (Admin, User)
 */
const createInvite = asyncHandler(async (req, res) => {
  const { assessmentId, testTakerName, testTakerEmail, testTakerPhone } = req.body;

  if (!assessmentId || !testTakerName || !testTakerEmail || !testTakerPhone) {
    throw new ApiError(400, 'All fields are required: assessmentId, testTakerName, testTakerEmail, testTakerPhone');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(testTakerEmail)) {
    throw new ApiError(400, 'Invalid email format');
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (!assessment.isActive || !assessment.isPublished || assessment.isMuted) {
    throw new ApiError(400, 'Assessment is not available');
  }

  // Check user has access to this assessment via their org
  const orgId = req.user.organization?._id?.toString();
  if (!orgId) {
    throw new ApiError(403, 'You must belong to an organization');
  }

  // Check if assessment is unlocked for this org
  const unlockEntry = assessment.unlockedBy?.find(
    u => u.organization.toString() === orgId
  );

  if (!unlockEntry) {
    throw new ApiError(403, 'Assessment is not unlocked for your organization. Admin must unlock it first.');
  }

  // Count existing invites for this assessment+org to check slot availability
  const existingInviteCount = await TestTakerInvite.countDocuments({
    assessment: assessmentId,
    organization: orgId,
    status: { $in: ['pending', 'email_sent', 'started'] }
  });

  const slotsAvailable = unlockEntry.testsAllowed - unlockEntry.testsUsed;
  if (existingInviteCount >= slotsAvailable) {
    throw new ApiError(403, `No test slots remaining. ${slotsAvailable} slots available, ${existingInviteCount} active invites.`);
  }

  // Check for duplicate invite (same email for same assessment)
  const existingInvite = await TestTakerInvite.findOne({
    assessment: assessmentId,
    organization: orgId,
    testTakerEmail: testTakerEmail.toLowerCase(),
    status: { $in: ['pending', 'email_sent', 'started'] }
  });

  if (existingInvite) {
    throw new ApiError(409, 'An active invite already exists for this email and assessment');
  }

  // Create the invite
  const invite = await TestTakerInvite.create({
    assessment: assessmentId,
    organization: orgId,
    invitedBy: req.user._id,
    testTakerName: testTakerName.trim(),
    testTakerEmail: testTakerEmail.toLowerCase().trim(),
    testTakerPhone: testTakerPhone.trim()
  });

  // Build test link
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const testLink = `${frontendUrl}/take/${invite.token}`;

  // Send email
  let emailSent = false;
  try {
    await sendTestInvite({
      to: invite.testTakerEmail,
      testTakerName: invite.testTakerName,
      assessmentTitle: assessment.title,
      organizationName: req.user.organization?.name || 'Organization',
      testLink,
      instructions: assessment.instructions
    });
    emailSent = true;
    invite.status = 'email_sent';
    invite.emailSentAt = new Date();
    await invite.save();
  } catch (emailError) {
    console.error('Failed to send invite email:', emailError.message);
    // Invite is still created, just with 'pending' status
  }

  await invite.populate('assessment', 'title category timeBound');
  await invite.populate('invitedBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: emailSent ? 'Invite created and email sent successfully' : 'Invite created but email delivery failed. You can resend later.',
    data: { invite, testLink, emailSent }
  });
});

/**
 * @desc    Get invites (filtered by user/org)
 * @route   GET /api/invites
 * @access  Private (Admin, User)
 */
const getInvites = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, assessmentId, search } = req.query;

  let query = {};

  // Admin sees all org invites, User sees only their own
  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    query.organization = req.user.organization?._id;
  } else {
    query.invitedBy = req.user._id;
  }

  if (status) {
    query.status = status;
  }

  if (assessmentId) {
    query.assessment = assessmentId;
  }

  if (search) {
    query.$or = [
      { testTakerName: { $regex: search, $options: 'i' } },
      { testTakerEmail: { $regex: search, $options: 'i' } }
    ];
  }

  const invites = await TestTakerInvite.find(query)
    .populate('assessment', 'title category timeBound')
    .populate('invitedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await TestTakerInvite.countDocuments(query);

  res.json({
    success: true,
    data: {
      invites,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Get invite statistics
 * @route   GET /api/invites/stats
 * @access  Private (Admin)
 */
const getInviteStats = asyncHandler(async (req, res) => {
  const orgId = req.user.organization?._id;
  if (!orgId) {
    throw new ApiError(400, 'Organization not found');
  }

  const stats = await TestTakerInvite.aggregate([
    { $match: { organization: orgId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const statusCounts = {
    pending: 0,
    email_sent: 0,
    started: 0,
    completed: 0,
    expired: 0
  };

  stats.forEach(s => {
    statusCounts[s._id] = s.count;
  });

  const totalInvites = Object.values(statusCounts).reduce((sum, c) => sum + c, 0);

  res.json({
    success: true,
    data: {
      totalInvites,
      ...statusCounts,
      completionRate: totalInvites > 0 ? Math.round((statusCounts.completed / totalInvites) * 100) : 0
    }
  });
});

/**
 * @desc    Get invites for a specific assessment
 * @route   GET /api/invites/assessment/:assessmentId
 * @access  Private (Admin, User)
 */
const getAssessmentInvites = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { page = 1, limit = 20, status } = req.query;

  let query = { assessment: assessmentId };

  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    query.organization = req.user.organization?._id;
  } else {
    query.invitedBy = req.user._id;
  }

  if (status) {
    query.status = status;
  }

  const invites = await TestTakerInvite.find(query)
    .populate('invitedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await TestTakerInvite.countDocuments(query);

  res.json({
    success: true,
    data: {
      invites,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Cancel/revoke an invite
 * @route   DELETE /api/invites/:id
 * @access  Private (Admin, User who created it)
 */
const cancelInvite = asyncHandler(async (req, res) => {
  const invite = await TestTakerInvite.findById(req.params.id);

  if (!invite) {
    throw new ApiError(404, 'Invite not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    if (invite.invitedBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  if (req.user.role === 'admin') {
    if (invite.organization.toString() !== req.user.organization?._id?.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  if (!['pending', 'email_sent'].includes(invite.status)) {
    throw new ApiError(400, 'Can only cancel invites that have not been started');
  }

  // Check if any attempt exists for this invite
  if (invite.attempt) {
    const attempt = await Attempt.findById(invite.attempt);
    if (attempt && attempt.status === 'in-progress') {
      throw new ApiError(400, 'Cannot cancel invite while test is in progress');
    }
  }

  invite.status = 'expired';
  await invite.save();

  res.json({
    success: true,
    message: 'Invite cancelled successfully',
    data: { invite }
  });
});

/**
 * @desc    Resend invitation email
 * @route   POST /api/invites/:id/resend
 * @access  Private (Admin, User who created it)
 */
const resendInvite = asyncHandler(async (req, res) => {
  const invite = await TestTakerInvite.findById(req.params.id)
    .populate('assessment', 'title category instructions');

  if (!invite) {
    throw new ApiError(404, 'Invite not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    if (invite.invitedBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  if (!['pending', 'email_sent', 'expired'].includes(invite.status)) {
    throw new ApiError(400, 'Cannot resend invite with status: ' + invite.status);
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const testLink = `${frontendUrl}/take/${invite.token}`;

  await sendTestInvite({
    to: invite.testTakerEmail,
    testTakerName: invite.testTakerName,
    assessmentTitle: invite.assessment.title,
    organizationName: req.user.organization?.name || 'Organization',
    testLink,
    instructions: invite.assessment.instructions
  });

  invite.status = 'email_sent';
  invite.emailSentAt = new Date();
  await invite.save();

  res.json({
    success: true,
    message: 'Invitation email resent successfully',
    data: { invite }
  });
});

module.exports = {
  createInvite,
  getInvites,
  getInviteStats,
  getAssessmentInvites,
  cancelInvite,
  resendInvite
};
