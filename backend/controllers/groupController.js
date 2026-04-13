const { Group, User, Organization } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get all groups (admin sees all org groups, user sees own groups)
 * @route   GET /api/groups
 * @access  Private (All authenticated users)
 */
const getGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', groupType, organization } = req.query;

  let query = {};

  if (req.user.role === 'superadmin') {
    // Superadmin sees all
    if (organization) {
      query.organization = organization;
    }
  } else if (req.user.role === 'admin') {
    // Admin sees all org groups
    query.organization = req.user.organization._id;
  } else {
    // User sees only their own groups
    query.organization = req.user.organization._id;
    query.createdBy = req.user._id;
  }

  if (groupType) {
    query.groupType = groupType;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const groups = await Group.find(query)
    .populate('createdBy', 'firstName lastName')
    .populate('members', 'firstName lastName email')
    .populate('moderator', 'firstName lastName email')
    .populate('organization', 'name slug')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const count = await Group.countDocuments(query);

  res.json({
    success: true,
    data: {
      groups,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit)),
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Get single group
 * @route   GET /api/groups/:id
 * @access  Private (Owner or Admin)
 */
const getGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('members', 'firstName lastName email role')
    .populate('moderator', 'firstName lastName email')
    .populate('organization', 'name slug');

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  // Check permissions
  if (req.user.role === 'superadmin') {
    // Superadmin can access all
  } else if (req.user.role === 'admin') {
    if (group.organization._id?.toString() !== req.user.organization._id?.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  } else {
    // User can only access own groups
    if (group.createdBy._id?.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  res.json({
    success: true,
    data: { group }
  });
});

/**
 * @desc    Create new group
 * @route   POST /api/groups
 * @access  Private (All authenticated users)
 */
const createGroup = asyncHandler(async (req, res) => {
  const { name, description, icon, moderator, memberIds = [], contacts = [], groupType } = req.body;

  const organizationId = req.user.role === 'superadmin' && req.body.organizationId
    ? req.body.organizationId
    : req.user.organization._id;

  // Determine group type: default to 'contacts' for regular users, 'team' for admins
  const resolvedGroupType = groupType || (req.user.role === 'user' ? 'contacts' : 'team');

  const group = await Group.create({
    name,
    description,
    icon,
    groupType: resolvedGroupType,
    moderator: moderator || null,
    organization: organizationId,
    createdBy: req.user._id,
    members: resolvedGroupType === 'team' ? memberIds : [],
    contacts: resolvedGroupType === 'contacts' ? contacts : []
  });

  await group.populate('createdBy', 'firstName lastName');
  await group.populate('members', 'firstName lastName email');
  await group.populate('moderator', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Group created successfully',
    data: { group }
  });
});

/**
 * @desc    Update group
 * @route   PUT /api/groups/:id
 * @access  Private (Owner or Admin)
 */
const updateGroup = asyncHandler(async (req, res) => {
  let group = await Group.findById(req.params.id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  // Check permissions
  if (req.user.role === 'superadmin') {
    // Superadmin can edit all
  } else if (req.user.role === 'admin') {
    if (group.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  } else {
    if (group.createdBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  const { name, description, icon, moderator } = req.body;

  if (name) group.name = name;
  if (description !== undefined) group.description = description;
  if (icon !== undefined) group.icon = icon;
  if (moderator !== undefined) group.moderator = moderator || null;

  await group.save();
  await group.populate('createdBy', 'firstName lastName');
  await group.populate('members', 'firstName lastName email');
  await group.populate('moderator', 'firstName lastName email');

  res.json({
    success: true,
    message: 'Group updated successfully',
    data: { group }
  });
});

/**
 * @desc    Delete group
 * @route   DELETE /api/groups/:id
 * @access  Private (Owner or Admin)
 */
const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  // Check permissions
  if (req.user.role === 'superadmin') {
    // Superadmin can delete all
  } else if (req.user.role === 'admin') {
    if (group.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  } else {
    if (group.createdBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  await group.deleteOne();

  res.json({
    success: true,
    message: 'Group deleted successfully'
  });
});

// ============================================================
// TEAM GROUP ENDPOINTS (Admin — org members)
// ============================================================

/**
 * @desc    Add members to team group
 * @route   POST /api/groups/:id/members
 * @access  Private (Admin, SuperAdmin)
 */
const addMembers = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, 'Please provide userIds array');
  }

  const group = await Group.findById(req.params.id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  // Only admins can add org members
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can manage team members');
  }

  if (req.user.role === 'admin') {
    if (group.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  const users = await User.find({
    _id: { $in: userIds },
    organization: group.organization
  });

  if (users.length !== userIds.length) {
    throw new ApiError(400, 'Some users do not belong to this organization');
  }

  const uniqueMembers = [...new Set([...group.members.map(m => m.toString()), ...userIds])];
  group.members = uniqueMembers;
  await group.save();

  await group.populate('members', 'firstName lastName email');

  res.json({
    success: true,
    message: 'Members added successfully',
    data: { group }
  });
});

/**
 * @desc    Remove members from team group
 * @route   DELETE /api/groups/:id/members
 * @access  Private (Admin, SuperAdmin)
 */
const removeMembers = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, 'Please provide userIds array');
  }

  const group = await Group.findById(req.params.id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can manage team members');
  }

  if (req.user.role === 'admin') {
    if (group.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  group.members = group.members.filter(
    m => !userIds.includes(m.toString())
  );
  await group.save();

  await group.populate('members', 'firstName lastName email');

  res.json({
    success: true,
    message: 'Members removed successfully',
    data: { group }
  });
});

// ============================================================
// CONTACT GROUP ENDPOINTS (Members — test taker contacts)
// ============================================================

/**
 * @desc    Add contacts to group
 * @route   POST /api/groups/:id/contacts
 * @access  Private (Owner or Admin)
 */
const addContacts = asyncHandler(async (req, res) => {
  const { contacts } = req.body;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    throw new ApiError(400, 'Please provide contacts array with { name, email, phone }');
  }

  const group = await Group.findById(req.params.id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  // Check permissions
  if (req.user.role === 'superadmin') {
    // pass
  } else if (req.user.role === 'admin') {
    if (group.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  } else {
    if (group.createdBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Validate contacts
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const c of contacts) {
    if (!c.name || !c.email) {
      throw new ApiError(400, 'Each contact must have name and email');
    }
    if (!emailRegex.test(c.email)) {
      throw new ApiError(400, `Invalid email: ${c.email}`);
    }
  }

  // Deduplicate by email
  const existingEmails = new Set(group.contacts.map(c => c.email.toLowerCase()));
  const newContacts = contacts.filter(c => !existingEmails.has(c.email.toLowerCase()));

  group.contacts.push(...newContacts);
  await group.save();

  res.json({
    success: true,
    message: `${newContacts.length} contact(s) added (${contacts.length - newContacts.length} duplicate(s) skipped)`,
    data: { contacts: group.contacts }
  });
});

/**
 * @desc    Remove contact from group
 * @route   DELETE /api/groups/:id/contacts/:contactId
 * @access  Private (Owner or Admin)
 */
const removeContact = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  // Check permissions
  if (req.user.role === 'superadmin') {
    // pass
  } else if (req.user.role === 'admin') {
    if (group.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  } else {
    if (group.createdBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  group.contacts = group.contacts.filter(c => c._id.toString() !== req.params.contactId);
  await group.save();

  res.json({
    success: true,
    message: 'Contact removed',
    data: { contacts: group.contacts }
  });
});

/**
 * @desc    Update a contact in group
 * @route   PUT /api/groups/:id/contacts/:contactId
 * @access  Private (Owner or Admin)
 */
const updateContact = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  const group = await Group.findById(req.params.id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  // Check permissions
  if (req.user.role === 'superadmin') {
    // pass
  } else if (req.user.role === 'admin') {
    if (group.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  } else {
    if (group.createdBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  const contact = group.contacts.id(req.params.contactId);
  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  if (name) contact.name = name;
  if (email) contact.email = email.toLowerCase().trim();
  if (phone !== undefined) contact.phone = phone;

  await group.save();

  res.json({
    success: true,
    message: 'Contact updated',
    data: { contacts: group.contacts }
  });
});

module.exports = {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMembers,
  addContacts,
  removeContact,
  updateContact
};
