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

  // Check if user is a member (not admin/superadmin) — enforce member allocation
  if (req.user.role === 'user') {
    const memberAlloc = (assessment.memberAllocations || []).find(
      a => a.organization.toString() === orgId && a.member.toString() === req.user._id.toString()
    );

    if (!memberAlloc) {
      throw new ApiError(403, 'You have not been allocated any test slots for this assessment. Contact your admin.');
    }

    if (memberAlloc.testsDistributed >= memberAlloc.testsAllowed) {
      throw new ApiError(403,
        `You have used all your allocated test slots (${memberAlloc.testsAllowed}). Contact your admin for more.`
      );
    }
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

  // Increment member's testsDistributed if they have an allocation
  if (req.user.role === 'user') {
    const memberAllocIndex = (assessment.memberAllocations || []).findIndex(
      a => a.organization.toString() === orgId && a.member.toString() === req.user._id.toString()
    );
    if (memberAllocIndex !== -1) {
      assessment.memberAllocations[memberAllocIndex].testsDistributed += 1;
      await assessment.save();
    }
  }

  // Build test link with category
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const category = assessment.category || 'general';
  const testLink = `${frontendUrl}/take/${category}/${invite.token}`;

  // Send email
  let emailSent = false;
  try {
    await sendTestInvite({
      to: invite.testTakerEmail,
      testTakerName: invite.testTakerName,
      assessmentTitle: assessment.title,
      assessmentCategory: category,
      organizationName: req.user.organization?.name || 'Organization',
      testLink,
      instructions: assessment.instructions,
      timeLimit: assessment.timeBound?.enabled ? assessment.timeBound.durationMinutes : null,
      totalQuestions: assessment.totalQuestions || assessment.questions?.length || 0
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
 * @desc    Get invite statistics (Admin - org-wide)
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
 * @desc    Get invite statistics (User - their own invites only)
 * @route   GET /api/invites/my-stats
 * @access  Private (User)
 */
const getMyInviteStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await TestTakerInvite.aggregate([
    { $match: { invitedBy: userId } },
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

  // Decrement member's testsDistributed if the inviter was a member
  const inviter = await require('../models').User.findById(invite.invitedBy);
  if (inviter && inviter.role === 'user') {
    const assessment = await Assessment.findById(invite.assessment);
    if (assessment) {
      const orgId = invite.organization.toString();
      const memberAllocIndex = (assessment.memberAllocations || []).findIndex(
        a => a.organization.toString() === orgId && a.member.toString() === invite.invitedBy.toString()
      );
      if (memberAllocIndex !== -1) {
        assessment.memberAllocations[memberAllocIndex].testsDistributed =
          Math.max(0, assessment.memberAllocations[memberAllocIndex].testsDistributed - 1);
        await assessment.save();
      }
    }
  }

  res.json({
    success: true,
    message: 'Invite cancelled successfully',
    data: { invite }
  });
});

/**
 * @desc    Resend invite email
 * @route   POST /api/invites/:id/resend
 * @access  Private (Admin, User who created it)
 */
const resendInvite = asyncHandler(async (req, res) => {
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

  // Can only resend if invite is pending or email_sent
  if (!['pending', 'email_sent'].includes(invite.status)) {
    throw new ApiError(400, 'Can only resend invites that are pending or already sent');
  }

  // Get assessment details
  const assessment = await Assessment.findById(invite.assessment);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Build test link with category
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const category = assessment.category || 'general';
  const testLink = `${frontendUrl}/take/${category}/${invite.token}`;

  // Send email
  try {
    await sendTestInvite({
      to: invite.testTakerEmail,
      testTakerName: invite.testTakerName,
      assessmentTitle: assessment.title,
      assessmentCategory: category,
      organizationName: req.user.organization?.name || 'Organization',
      testLink,
      instructions: assessment.instructions,
      timeLimit: assessment.timeBound?.enabled ? assessment.timeBound.durationMinutes : null,
      totalQuestions: assessment.totalQuestions || assessment.questions?.length || 0
    });
    
    // Update invite status
    invite.status = 'email_sent';
    invite.emailSentAt = new Date();
    await invite.save();

    res.json({
      success: true,
      message: 'Invite email resent successfully',
      data: { invite }
    });
  } catch (emailError) {
    console.error('Failed to resend invite email:', emailError.message);
    throw new ApiError(500, 'Failed to send invite email. Please try again later.');
  }
});

module.exports = {
  createInvite,
  getInvites,
  getInviteStats,
  getMyInviteStats,
  getAssessmentInvites,
  cancelInvite,
  resendInvite
};
