const { CreditRequest, Organization, User } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { sendCreditRequestNotification } = require('../services/emailService');

/**
 * @desc    Delete credit request
 * @route   DELETE /api/credits/requests/:id
 * @access  Private (SuperAdmin)
 */
const deleteCreditRequest = asyncHandler(async (req, res) => {
  const creditRequest = await CreditRequest.findById(req.params.id);

  if (!creditRequest) {
    throw new ApiError(404, 'Credit request not found');
  }

  await CreditRequest.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Credit request deleted',
    data: {}
  });
});

/**
 * @desc    Get credit balance
 * @route   GET /api/credits
 * @access  Private
 */
const getCredits = asyncHandler(async (req, res) => {
  if (req.user.role === 'superadmin') {
    const { organizationId, all } = req.query;
    
    if (organizationId) {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new ApiError(404, 'Organization not found');
      }
      return res.json({
        success: true,
        data: { organization }
      });
    }
    
    const orgs = await Organization.find({ isActive: true })
      .select('name slug credits.primaryColor credits.secondaryColor credits.total credits.used credits.locked createdAt')
      .sort({ createdAt: -1 });
    
    const totalCredits = orgs.reduce((sum, org) => sum + org.credits.total, 0);
    const totalUsed = orgs.reduce((sum, org) => sum + org.credits.used, 0);
    const totalLocked = orgs.reduce((sum, org) => sum + (org.credits.locked || 0), 0);
    
    return res.json({
      success: true,
      data: {
        summary: {
          totalCredits,
          totalUsed,
          totalLocked,
          totalAvailable: totalCredits - totalUsed - totalLocked,
          organizationCount: orgs.length
        },
        organizations: orgs.map(org => ({
          _id: org._id,
          name: org.name,
          slug: org.slug,
          colors: {
            primary: org.credits.primaryColor,
            secondary: org.credits.secondaryColor
          },
          credits: {
            total: org.credits.total,
            used: org.credits.used,
            locked: org.credits.locked || 0,
            available: org.credits.total - org.credits.used - (org.credits.locked || 0)
          },
          createdAt: org.createdAt
        }))
      }
    });
  }

  const organization = await Organization.findById(req.user.organization);

  // Handle individual users (no org)
  if (!organization && req.user.accountType === 'individual') {
    const recentRequests = await CreditRequest.find({ requestedForUser: req.user._id })
      .populate('requestedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      success: true,
      data: {
        credits: {
          total: req.user.personalCredits?.total || 0,
          used: req.user.personalCredits?.used || 0,
          remaining: Math.max(0, (req.user.personalCredits?.total || 0) - (req.user.personalCredits?.used || 0)),
          locked: 0,
          batches: []
        },
        recentRequests
      }
    });
  }

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  // Get credit request history
  const recentRequests = await CreditRequest.find({ organization: organization._id })
    .populate('requestedBy', 'firstName lastName')
    .populate('approvedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      credits: organization.credits,
      recentRequests
    }
  });
});

/**
 * @desc    Request credits
 * @route   POST /api/credits/request
 * @access  Private (Admin)
 */
const requestCredits = asyncHandler(async (req, res) => {
  const { creditsRequested, reason } = req.body;

  const isIndividual = req.user.accountType === 'individual' && !req.user.organization;

  if (!isIndividual && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Only admins or individual users can request credits');
  }

  let creditRequest;

  if (isIndividual) {
    // --- Individual user credit request (no org) ---
    creditRequest = await CreditRequest.create({
      organization: null,
      requestedForUser: req.user._id,
      requestedBy: req.user._id,
      requestType: 'individual',
      creditsRequested,
      reason
    });
  } else {
    // --- Org admin credit request ---
    const organization = await Organization.findById(req.user.organization);
    if (!organization) throw new ApiError(404, 'Organization not found');

    creditRequest = await CreditRequest.create({
      organization: organization._id,
      requestedBy: req.user._id,
      requestType: 'organization',
      creditsRequested,
      reason
    });

    try {
      await sendCreditRequestNotification({
        adminEmail: 'rahulguha@mindmil.com',
        requesterName: `${req.user.firstName} ${req.user.lastName}`,
        organizationName: organization.name,
        creditsRequested,
        reason
      });
    } catch (emailError) {
      console.error('Failed to send credit request notification:', emailError);
    }
  }

  await creditRequest.populate('requestedBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Credit request submitted successfully',
    data: { creditRequest }
  });
});

/**
 * @desc    Get all credit requests
 * @route   GET /api/credits/requests
 * @access  Private (Admin, SuperAdmin)
 */
const getCreditRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, organizationId } = req.query;

  let query = {};

  if (status) {
    query.status = status;
  }

  if (req.user.role === 'superadmin') {
    if (organizationId) {
      query.organization = organizationId;
    }
  } else {
    query.organization = req.user.organization._id;
  }

  const requests = await CreditRequest.find(query)
    .populate('organization', 'name slug')
    .populate('requestedBy', 'firstName lastName email')
    .populate('requestedForUser', 'firstName lastName email accountType')
    .populate('approvedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await CreditRequest.countDocuments(query);

  res.json({
    success: true,
    data: {
      requests,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Approve credit request
 * @route   PUT /api/credits/requests/:id/approve
 * @access  Private (SuperAdmin)
 */
const approveCreditRequest = asyncHandler(async (req, res) => {
  const { creditsGranted, expiryInDays, expiryDate, notes } = req.body;

  const creditRequest = await CreditRequest.findById(req.params.id)
    .populate('organization');

  if (!creditRequest) {
    throw new ApiError(404, 'Credit request not found');
  }

  if (creditRequest.status !== 'pending') {
    throw new ApiError(400, 'Credit request has already been processed');
  }

  const granted = creditsGranted || creditRequest.creditsRequested;
  
  // Support both custom expiryDate (ISO string) and preset expiryInDays
  let finalExpiryDate = null;
  if (expiryDate) {
    // Custom date: parse ISO date string, set to end of day UTC
    finalExpiryDate = new Date(expiryDate);
    finalExpiryDate.setUTCHours(23, 59, 59, 999);
  } else if (expiryInDays) {
    // Preset: calculate from now
    finalExpiryDate = new Date(Date.now() + expiryInDays * 24 * 60 * 60 * 1000);
  }

  const remainder = creditRequest.creditsRequested - granted;

  creditRequest.status = 'approved';
  creditRequest.approvedBy = req.user._id;
  creditRequest.approvedAt = new Date();
  creditRequest.creditsGranted = granted;
  creditRequest.expiryDate = finalExpiryDate;
  creditRequest.adminNotes = notes;
  await creditRequest.save();

  if (remainder > 0) {
    await CreditRequest.create({
      organization: creditRequest.organization?._id || creditRequest.organization,
      requestedForUser: creditRequest.requestedForUser,
      requestType: creditRequest.requestType,
      requestedBy: creditRequest.requestedBy,
      creditsRequested: remainder,
      reason: `${creditRequest.reason} (remaining from partial approval)`,
      status: 'pending'
    });
  }

  if (creditRequest.requestType === 'individual' && creditRequest.requestedForUser) {
    // --- Credit goes to individual User.personalCredits ---
    const individualUser = await User.findById(creditRequest.requestedForUser);
    if (!individualUser) throw new ApiError(404, 'Individual user not found');
    individualUser.personalCredits.total = (individualUser.personalCredits.total || 0) + granted;
    await individualUser.save();
  } else {
    // --- Credit goes to Organization ---
    const organization = await Organization.findById(
      creditRequest.organization?._id || creditRequest.organization
    );
    if (organization) {
      organization.credits.total += granted;
      if (finalExpiryDate) {
        organization.credits.batches.push({
          amount: granted,
          purchasedAt: new Date(),
          expiresAt: finalExpiryDate,
          used: 0
        });
      }
      await organization.save();
    }
  }

  await creditRequest.populate('approvedBy', 'firstName lastName');

  res.json({
    success: true,
    message: remainder > 0
      ? `Approved ${granted} credits. ${remainder} credits remain pending for review.`
      : 'Credit request approved successfully',
    data: { creditRequest }
  });
});

/**
 * @desc    Revoke approved credit request
 * @route   PUT /api/credits/requests/:id/revoke
 * @access  Private (SuperAdmin)
 */
const revokeCreditRequest = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const creditRequest = await CreditRequest.findById(req.params.id)
    .populate('organization');

  if (!creditRequest) {
    throw new ApiError(404, 'Credit request not found');
  }

  if (creditRequest.status !== 'approved') {
    throw new ApiError(400, 'Can only revoke approved requests');
  }

  if (!creditRequest.creditsGranted) {
    throw new ApiError(400, 'No credits were granted for this request');
  }

  if (creditRequest.requestType === 'individual' && creditRequest.requestedForUser) {
    // Revoke from individual User.personalCredits
    const individualUser = await User.findById(creditRequest.requestedForUser);
    if (individualUser) {
      individualUser.personalCredits.total = Math.max(0, (individualUser.personalCredits.total || 0) - creditRequest.creditsGranted);
      await individualUser.save();
    }
  } else {
    const organization = await Organization.findById(
      creditRequest.organization?._id || creditRequest.organization
    );
    if (!organization) throw new ApiError(404, 'Organization not found');

    organization.credits.total = Math.max(0, organization.credits.total - creditRequest.creditsGranted);

    if (creditRequest.expiryDate) {
      const batchIndex = organization.credits.batches.findIndex(
        b => b.amount === creditRequest.creditsGranted &&
             new Date(b.expiresAt).getTime() === new Date(creditRequest.expiryDate).getTime()
      );
      if (batchIndex !== -1) {
        organization.credits.batches.splice(batchIndex, 1);
      }
    }
    await organization.save();
  }

  creditRequest.status = 'revoked';
  creditRequest.adminNotes = notes || creditRequest.adminNotes;
  await creditRequest.save();

  res.json({
    success: true,
    message: `Revoked ${creditRequest.creditsGranted} credits from ${organization.name}`,
    data: { creditRequest }
  });
});

/**
 * @desc    Reject credit request
 * @route   PUT /api/credits/requests/:id/reject
 * @access  Private (SuperAdmin)
 */
const rejectCreditRequest = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const creditRequest = await CreditRequest.findById(req.params.id);

  if (!creditRequest) {
    throw new ApiError(404, 'Credit request not found');
  }

  if (creditRequest.status !== 'pending') {
    throw new ApiError(400, 'Credit request has already been processed');
  }

  creditRequest.status = 'rejected';
  creditRequest.approvedBy = req.user._id;
  creditRequest.approvedAt = new Date();
  creditRequest.adminNotes = notes;
  await creditRequest.save();

  res.json({
    success: true,
    message: 'Credit request rejected',
    data: { creditRequest }
  });
});

/**
 * @desc    Cancel credit request
 * @route   PUT /api/credits/requests/:id/cancel
 * @access  Private (Admin)
 */
const cancelCreditRequest = asyncHandler(async (req, res) => {
  const creditRequest = await CreditRequest.findById(req.params.id);

  if (!creditRequest) {
    throw new ApiError(404, 'Credit request not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (creditRequest.requestedBy.toString() !== req.user._id.toString() &&
        creditRequest.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  if (creditRequest.status !== 'pending') {
    throw new ApiError(400, 'Can only cancel pending requests');
  }

  creditRequest.status = 'cancelled';
  await creditRequest.save();

  res.json({
    success: true,
    message: 'Credit request cancelled',
    data: { creditRequest }
  });
});

/**
 * @desc    Get credit usage history
 * @route   GET /api/credits/usage
 * @access  Private (Admin, SuperAdmin)
 */
const getCreditUsage = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  // Get attempts that used credits
  const Attempt = require('../models/Attempt');
  
  let query = {};
  if (req.user.role !== 'superadmin') {
    query.organization = req.user.organization._id;
  }

  const usage = await Attempt.find(query)
    .populate('user', 'firstName lastName email')
    .populate('assessment', 'title')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Attempt.countDocuments(query);

  res.json({
    success: true,
    data: {
      usage: usage.map(u => ({
        id: u._id,
        user: u.user,
        assessment: u.assessment,
        status: u.status,
        createdAt: u.createdAt,
        creditUsed: 1
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Get my credit requests
 * @route   GET /api/credits/my-requests
 * @access  Private (Admin)
 */
const getMyCreditRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const isIndividual = req.user.accountType === 'individual' && !req.user.organization;

  let query;
  if (isIndividual) {
    query = { requestedForUser: req.user._id };
  } else {
    query = { organization: req.user.organization._id || req.user.organization };
  }

  if (status) query.status = status;

  const requests = await CreditRequest.find(query)
    .populate('requestedBy', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await CreditRequest.countDocuments(query);

  res.json({
    success: true,
    data: {
      requests,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    }
  });
});

module.exports = {
  getCredits,
  requestCredits,
  getCreditRequests,
  getMyCreditRequests,
  approveCreditRequest,
  rejectCreditRequest,
  revokeCreditRequest,
  cancelCreditRequest,
  deleteCreditRequest,
  getCreditUsage
};
