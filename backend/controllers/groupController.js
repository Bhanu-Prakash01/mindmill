const { Group, User, Organization } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get all groups
 * @route   GET /api/groups
 * @access  Private (Admin, SuperAdmin)
 */
const getGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;

  let query = {};

  // Filter by organization based on role
  if (req.user.role !== 'superadmin') {
    query.organization = req.user.organization._id;
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
    .populate('organization', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Group.countDocuments(query);

  res.json({
    success: true,
    data: {
      groups,
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
 * @desc    Get single group
 * @route   GET /api/groups/:id
 * @access  Private (Admin, SuperAdmin)
 */
const getGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('members', 'firstName lastName email role')
    .populate('organization', 'name slug');

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (group.organization._id.toString() !== req.user.organization._id.toString()) {
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
 * @access  Private (Admin, SuperAdmin)
 */
const createGroup = asyncHandler(async (req, res) => {
  const { name, description, memberIds = [] } = req.body;

  const organizationId = req.user.role === 'superadmin' && req.body.organizationId
    ? req.body.organizationId
    : req.user.organization._id;

  const group = await Group.create({
    name,
    description,
    organization: organizationId,
    createdBy: req.user._id,
    members: memberIds
  });

  await group.populate('createdBy', 'firstName lastName');
  await group.populate('members', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Group created successfully',
    data: { group }
  });
});

/**
 * @desc    Update group
 * @route   PUT /api/groups/:id
 * @access  Private (Admin, SuperAdmin)
 */
const updateGroup = asyncHandler(async (req, res) => {
  let group = await Group.findById(req.params.id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (group.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  const { name, description } = req.body;

  if (name) group.name = name;
  if (description !== undefined) group.description = description;

  await group.save();
  await group.populate('createdBy', 'firstName lastName');
  await group.populate('members', 'firstName lastName email');

  res.json({
    success: true,
    message: 'Group updated successfully',
    data: { group }
  });
});

/**
 * @desc    Delete group
 * @route   DELETE /api/groups/:id
 * @access  Private (Admin, SuperAdmin)
 */
const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (group.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  await group.deleteOne();

  res.json({
    success: true,
    message: 'Group deleted successfully'
  });
});

/**
 * @desc    Add members to group
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

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (group.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Verify all users belong to the same organization
  const users = await User.find({
    _id: { $in: userIds },
    organization: group.organization
  });

  if (users.length !== userIds.length) {
    throw new ApiError(400, 'Some users do not belong to this organization');
  }

  // Add unique members
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
 * @desc    Remove members from group
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

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (group.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Remove members
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

module.exports = {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMembers
};
