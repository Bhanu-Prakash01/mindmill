const { SupportTicket, User, Organization, StandardQuery } = require('../models');
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
    // SuperAdmin sees all tickets (org user, org admin, individual)
  } else if (req.user.role === 'admin') {
    // Admin sees their own tickets + tickets from non-admin org users.
    // Other admin tickets are managed by superadmin only.
    const adminUserIds = await User.find({
      organization: req.user.organization._id,
      role: 'admin'
    }).distinct('_id');
    query.organization = req.user.organization._id;
    query.$or = [
      { user: req.user._id },
      { user: { $nin: adminUserIds } }
    ];
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
    // Admin: must have org, ticket must belong to admin's org,
    // and ticket must be created by a regular user (not admin) — unless it's their own ticket
    if (!ticket.organization) {
      throw new ApiError(403, 'Access denied');
    }
    const orgId = typeof ticket.organization === 'object' && ticket.organization._id
      ? ticket.organization._id.toString()
      : ticket.organization.toString();
    if (orgId !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
    const ticketUserId = typeof ticket.user === 'object' && ticket.user._id
      ? ticket.user._id.toString()
      : ticket.user.toString();
    if (ticketUserId !== req.user._id.toString()) {
      const creator = await User.findById(ticket.user);
      if (!creator || creator.role !== 'user') {
        throw new ApiError(403, 'Access denied');
      }
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
  const { subject, message, category, priority, attachments, selectedIssues } = req.body;

  // Require either message or selectedIssues
  if ((!message || message.trim() === '') && (!selectedIssues || selectedIssues.length === 0)) {
    throw new ApiError(400, 'Please select an issue or describe your problem');
  }

  const ticket = await SupportTicket.create({
    user: req.user._id,
    organization: req.user.organization?._id || null,
    subject,
    message: message || '',
    selectedIssues: selectedIssues || [],
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
    // Admin: must have org, must belong to admin's org, creator must be 'user' (unless self)
    if (!ticket.organization) {
      throw new ApiError(403, 'Access denied');
    }
    if (ticket.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
    if (ticket.user.toString() !== req.user._id.toString()) {
      const creator = await User.findById(ticket.user);
      if (!creator || creator.role !== 'user') {
        throw new ApiError(403, 'Access denied');
      }
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
      if (!ticket.organization) {
        throw new ApiError(403, 'Access denied');
      }
      if (ticket.organization.toString() !== req.user.organization._id.toString()) {
        throw new ApiError(403, 'Access denied');
      }
      // Admin can only update status of user-created tickets
      const creator = await User.findById(ticket.user);
      if (!creator || creator.role !== 'user') {
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
      if (!ticket.organization) {
        throw new ApiError(403, 'Access denied');
      }
      if (ticket.organization.toString() !== req.user.organization._id.toString()) {
        throw new ApiError(403, 'Access denied');
      }
      // Admin can only assign user-created tickets
      const creator = await User.findById(ticket.user);
      if (!creator || creator.role !== 'user') {
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
 * @desc    Get current user's own tickets only (regardless of role)
 * @route   GET /api/support/my-tickets
 * @access  Private
 */
const getMyTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, priority, category } = req.query;

  let query = { user: req.user._id };

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
 * @desc    Get ticket statistics
 * @route   GET /api/support/stats
 * @access  Private (Admin, SuperAdmin)
 */
const getStats = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'admin') {
    query.organization = req.user.organization._id;
    // Admin stats should only count user-created tickets (not admin-created)
    const adminUserIds = await User.find({
      organization: req.user.organization._id,
      role: 'admin'
    }).distinct('_id');
    if (adminUserIds.length > 0) {
      query.user = { $nin: adminUserIds };
    }
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

/**
 * @desc    Get coordinators list
 * @route   GET /api/support/coordinators
 * @access  Private (Admin, SuperAdmin)
 */
const getCoordinators = asyncHandler(async (req, res) => {
  let query = { isCoordinator: true, isActive: true };

  // Admin sees only coordinators from their organization
  if (req.user.role === 'admin') {
    query.organization = req.user.organization._id;
  }

  const coordinators = await User.find(query)
    .select('firstName lastName email')
    .sort({ firstName: 1 });

  res.json({
    success: true,
    data: { coordinators }
  });
});

/**
 * @desc    Escalate a ticket to SuperAdmin
 * @route   PUT /api/support/tickets/:id/escalate
 * @access  Private (Admin)
 */
const escalateTicket = asyncHandler(async (req, res) => {
  const { escalate } = req.body; // true = escalate, false = de-escalate

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  // Admin can escalate tickets in their org
  if (req.user.role !== 'superadmin') {
    if (req.user.role === 'admin') {
      if (!ticket.organization) {
        throw new ApiError(403, 'Access denied');
      }
      if (ticket.organization.toString() !== req.user.organization._id.toString()) {
        throw new ApiError(403, 'Access denied');
      }
    } else {
      throw new ApiError(403, 'Access denied');
    }
  }

  ticket.escalated = escalate !== false;
  ticket.escalatedAt = escalate !== false ? new Date() : null;
  ticket.escalatedBy = escalate !== false ? req.user._id : null;

  await ticket.save();

  await ticket.populate([
    { path: 'user', select: 'firstName lastName email' },
    { path: 'organization', select: 'name slug' },
    { path: 'assignedTo', select: 'firstName lastName' },
    { path: 'escalatedBy', select: 'firstName lastName' },
    { path: 'responses.from', select: 'firstName lastName role' },
  ]);

  res.json({
    success: true,
    message: escalate !== false ? 'Ticket escalated to SuperAdmin' : 'Escalation removed',
    data: { ticket }
  });
});

module.exports = {
  getTickets,
  getMyTickets,
  getTicket,
  createTicket,
  addResponse,
  updateStatus,
  assignTicket,
  escalateTicket,
  getStats,
  getCoordinators
};
