const { CreditRequest, Organization, User } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

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
  let organization;

  if (req.user.role === 'superadmin') {
    const { organizationId } = req.query;
    if (organizationId) {
      organization = await Organization.findById(organizationId);
    } else {
      // Return summary for all organizations
      const orgs = await Organization.find({ isActive: true });
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
          }
        }
      });
    }
  } else {
    organization = await Organization.findById(req.user.organization);
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

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Only admins can request credits');
  }

  const organization = await Organization.findById(req.user.organization);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  const creditRequest = await CreditRequest.create({
    organization: organization._id,
    requestedBy: req.user._id,
    creditsRequested,
    reason
  });

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
  const { creditsGranted, expiryInDays, notes } = req.body;

  const creditRequest = await CreditRequest.findById(req.params.id)
    .populate('organization');

  if (!creditRequest) {
    throw new ApiError(404, 'Credit request not found');
  }

  if (creditRequest.status !== 'pending') {
    throw new ApiError(400, 'Credit request has already been processed');
  }

  const granted = creditsGranted || creditRequest.creditsRequested;
  const expiryDate = expiryInDays ? new Date(Date.now() + expiryInDays * 24 * 60 * 60 * 1000) : null;

  // Update credit request
  creditRequest.status = 'approved';
  creditRequest.approvedBy = req.user._id;
  creditRequest.approvedAt = new Date();
  creditRequest.creditsGranted = granted;
  creditRequest.expiryDate = expiryDate;
  creditRequest.adminNotes = notes;
  await creditRequest.save();

  // Add credits to organization with batch tracking
  const organization = await Organization.findById(creditRequest.organization._id);
  organization.credits.total += granted;
  
  // Add to credit batches for expiry tracking
  if (expiryDate) {
    organization.credits.batches.push({
      amount: granted,
      purchasedAt: new Date(),
      expiresAt: expiryDate,
      used: 0
    });
  }
  
  await organization.save();

  await creditRequest.populate('approvedBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Credit request approved successfully',
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

  let query = {
    organization: req.user.organization._id
  };

  if (status) {
    query.status = status;
  }

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
  cancelCreditRequest,
  deleteCreditRequest,
  getCreditUsage
};
