const { SupportTicket, User, Organization } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get all support tickets
 * @route   GET /api/support/tickets
 * @access  Private
 */
const getTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, priority, category } = req.query;

  let query = {};

  // Filter based on role
  if (req.user.role === 'superadmin') {
    // SuperAdmin sees all tickets
  } else if (req.user.role === 'admin') {
    // Admin sees tickets from their organization
    query.organization = req.user.organization._id;
  } else {
    // User sees only their own tickets
    query.user = req.user._id;
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;

  const tickets = await SupportTicket.find(query)
    .populate('user', 'firstName lastName email')
    .populate('organization', 'name slug')
    .populate('assignedTo', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await SupportTicket.countDocuments(query);

  res.json({
    success: true,
    data: {
      tickets,
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
 * @desc    Get single ticket
 * @route   GET /api/support/tickets/:id
 * @access  Private
 */
const getTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('organization', 'name slug')
    .populate('assignedTo', 'firstName lastName')
    .populate('responses.from', 'firstName lastName role');

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  // Check permissions
  if (req.user.role === 'user') {
    if (ticket.user._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  } else if (req.user.role === 'admin') {
    if (ticket.organization._id.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  res.json({
    success: true,
    data: { ticket }
  });
});

/**
 * @desc    Create support ticket
 * @route   POST /api/support/tickets
 * @access  Private
 */
const createTicket = asyncHandler(async (req, res) => {
  const { subject, message, category, priority, attachments } = req.body;

  const ticket = await SupportTicket.create({
    user: req.user._id,
    organization: req.user.organization?._id || null,
    subject,
    message,
    category: category || 'general',
    priority: priority || 'medium',
    attachments: attachments || [],
    metadata: {
      browser: req.headers['user-agent'],
      userAgent: req.headers['user-agent'],
      pageUrl: req.headers.referer
    }
  });

  await ticket.populate('user', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Support ticket created successfully',
    data: { ticket }
  });
});

/**
 * @desc    Add response to ticket
 * @route   POST /api/support/tickets/:id/respond
 * @access  Private
 */
const addResponse = asyncHandler(async (req, res) => {
  const { message, isInternal } = req.body;

  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  // Check permissions
  if (req.user.role === 'user') {
    if (ticket.user.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
    // Users cannot add internal responses
    if (isInternal) {
      throw new ApiError(403, 'Cannot add internal note');
    }
  } else if (req.user.role === 'admin') {
    if (ticket.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  ticket.responses.push({
    from: req.user._id,
    message,
    isInternal: isInternal || false
  });

  // Update status if needed
  if (ticket.status === 'open') {
    ticket.status = 'in-progress';
  }

  await ticket.save();

  await ticket.populate('responses.from', 'firstName lastName role');

  res.json({
    success: true,
    message: 'Response added successfully',
    data: { ticket }
  });
});

/**
 * @desc    Update ticket status
 * @route   PUT /api/support/tickets/:id/status
 * @access  Private (Admin, SuperAdmin)
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { status, resolution } = req.body;

  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (req.user.role === 'admin') {
      if (ticket.organization.toString() !== req.user.organization._id.toString()) {
        throw new ApiError(403, 'Access denied');
      }
    } else {
      throw new ApiError(403, 'Access denied');
    }
  }

  ticket.status = status;

  if (status === 'resolved') {
    ticket.resolvedAt = new Date();
    if (resolution) {
      ticket.resolution = resolution;
    }
  } else if (status === 'closed') {
    ticket.closedAt = new Date();
  }

  await ticket.save();

  res.json({
    success: true,
    message: 'Ticket status updated successfully',
    data: { ticket }
  });
});

/**
 * @desc    Assign ticket to user
 * @route   PUT /api/support/tickets/:id/assign
 * @access  Private (Admin, SuperAdmin)
 */
const assignTicket = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const ticket = await SupportTicket.findById(req.params.id);

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (req.user.role === 'admin') {
      if (ticket.organization.toString() !== req.user.organization._id.toString()) {
        throw new ApiError(403, 'Access denied');
      }
    } else {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Verify user exists
  const assignee = await User.findById(userId);
  if (!assignee) {
    throw new ApiError(404, 'Assignee not found');
  }

  ticket.assignedTo = userId;
  if (ticket.status === 'open') {
    ticket.status = 'in-progress';
  }

  await ticket.save();

  await ticket.populate('assignedTo', 'firstName lastName');

  res.json({
    success: true,
    message: 'Ticket assigned successfully',
    data: { ticket }
  });
});

/**
 * @desc    Get ticket statistics
 * @route   GET /api/support/stats
 * @access  Private (Admin, SuperAdmin)
 */
const getStats = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'admin') {
    query.organization = req.user.organization._id;
  }

  const stats = await SupportTicket.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      stats: stats[0] || {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        highPriority: 0,
        urgent: 0
      }
    }
  });
});

module.exports = {
  getTickets,
  getTicket,
  createTicket,
  addResponse,
  updateStatus,
  assignTicket,
  getStats
};
