const { User, Assessment, Organization } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Admin, SuperAdmin)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', role, isActive, organization } = req.query;
  
  // Build query based on user role
  let query = {};
  
  if (req.user.role !== 'superadmin') {
    // Admin can only see users in their organization
    query.organization = req.user.organization._id;
  } else if (organization) {
    query.organization = organization;
  }
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) {
    query.role = role;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const users = await User.find(query)
    .populate('organization', 'name slug')
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
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
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private (Admin, SuperAdmin, Owner)
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('organization', 'name slug')
    .populate('assignedAssessments', 'title category')
    .select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin' && 
      req.user.role !== 'admin' && 
      req.user._id.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  // Admin can only view users in their organization
  if (req.user.role === 'admin' && 
      user.organization && 
      user.organization._id.toString() !== req.user.organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({
    success: true,
    data: { user }
  });
});

/**
 * @desc    Create new user
 * @route   POST /api/users
 * @access  Private (Admin, SuperAdmin)
 */
const createUser = asyncHandler(async (req, res) => {
  const { 
    email, password, firstName, lastName, role, organizationId, phone, phoneCountryCode, 
    salutation, jobTitle, city, company, isEmailVerified, deactivationDate, deactivationReason,
    organizationName, organizationSlug, organizationDescription, organizationCredits
  } = req.body;

  if (req.user.role === 'admin' && role === 'admin') {
    throw new ApiError(403, 'Admins cannot create other admins');
  }

  let userOrganization = req.user.organization;

  if (req.user.role === 'superadmin') {
    if (organizationId) {
      userOrganization = await Organization.findById(organizationId);
      if (!userOrganization) {
        throw new ApiError(404, 'Organization not found');
      }
    } else if (role === 'admin' && organizationName) {
      const slug = organizationSlug?.toLowerCase().trim() || organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').trim();
      const existingOrg = await Organization.findOne({ slug });
      if (existingOrg) {
        throw new ApiError(400, 'Organization slug already exists');
      }
      
      userOrganization = await Organization.create({
        name: organizationName,
        slug,
        description: organizationDescription || '',
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        credits: { total: organizationCredits || 50, used: 0 }
      });
    }
  }

  // Check if email already exists in this organization
  const orgId = userOrganization ? userOrganization._id : null;
  const existingUser = await User.findOne({ email, organization: orgId });
  if (existingUser) {
    throw new ApiError(400, 'Email already registered in this organization');
  }

  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: role || 'user',
    organization: userOrganization ? userOrganization._id : null,
    phone,
    phoneCountryCode,
    salutation,
    jobTitle,
    city,
    company,
    isEmailVerified,
    deactivationDate,
    deactivationReason
  });

  await user.populate('organization');

  res.status(201).json({
    success: true,
    message: userOrganization && organizationName ? 'Admin and organization created successfully' : 'User created successfully',
    data: { user, organization: userOrganization }
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (Admin, SuperAdmin, Owner)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { 
    firstName, lastName, phone, phoneCountryCode, salutation, jobTitle, isActive, role, city, company, 
    isEmailVerified, deactivationDate, deactivationReason,
    organizationName, organizationSlug, organizationDescription, organizationCredits
  } = req.body;

  let user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    if (req.user._id.toString() !== user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
    // Regular users can only update certain fields
    const updateData = { firstName, lastName, phone, phoneCountryCode, salutation, jobTitle, city, company };
    user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
  } else {
    // Admin/SuperAdmin can update more fields
    const updateData = { 
      firstName, lastName, phone, phoneCountryCode, salutation, jobTitle, 
      isActive, city, company, isEmailVerified, deactivationDate, deactivationReason 
    };
    
    // Only SuperAdmin can change roles
    if (role && req.user.role === 'superadmin') {
      updateData.role = role;
    }

    if (req.user.role === 'superadmin' && user.organization) {
      const orgUpdate = {};
      if (organizationName) orgUpdate.name = organizationName;
      if (organizationSlug) orgUpdate.slug = organizationSlug;
      if (organizationDescription !== undefined) orgUpdate.description = organizationDescription;
      if (organizationCredits !== undefined) {
        orgUpdate['credits.total'] = organizationCredits;
      }
      
      if (Object.keys(orgUpdate).length > 0) {
        await Organization.findByIdAndUpdate(user.organization, orgUpdate);
      }
    }

    user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('organization');
  }

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user }
  });
});

/**
 * @desc    Delete user permanently
 * @route   DELETE /api/users/:id
 * @access  Private (Admin, SuperAdmin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent deleting yourself
  if (req.user._id.toString() === user._id.toString()) {
    throw new ApiError(400, 'Cannot delete your own account');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (user.role === 'superadmin') {
      throw new ApiError(403, 'Cannot delete superadmin');
    }
    if (user.organization?.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * @desc    Assign assessment to user
 * @route   POST /api/users/:id/assign-assessment
 * @access  Private (Admin, SuperAdmin)
 */
const assignAssessment = asyncHandler(async (req, res) => {
  const { assessmentId } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Check if user belongs to admin's organization
  if (req.user.role !== 'superadmin' && 
      user.organization?.toString() !== req.user.organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  // Assessments are global — no org check needed
  // Add assessment to user's assigned assessments if not already present
  if (!user.assignedAssessments.includes(assessmentId)) {
    user.assignedAssessments.push(assessmentId);
    await user.save();
  }

  // Add user to assessment's assigned users if not already present
  if (!assessment.assignedUsers.includes(user._id)) {
    assessment.assignedUsers.push(user._id);
    await assessment.save();
  }

  res.json({
    success: true,
    message: 'Assessment assigned successfully',
    data: { user }
  });
});

/**
 * @desc    Remove assessment from user
 * @route   DELETE /api/users/:id/assign-assessment/:assessmentId
 * @access  Private (Admin, SuperAdmin)
 */
const removeAssessment = asyncHandler(async (req, res) => {
  const { id, assessmentId } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin' && 
      user.organization?.toString() !== req.user.organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  // Remove assessment from user's assigned assessments
  user.assignedAssessments = user.assignedAssessments.filter(
    a => a.toString() !== assessmentId
  );
  await user.save();

  // Remove user from assessment's assigned users
  const assessment = await Assessment.findById(assessmentId);
  if (assessment) {
    assessment.assignedUsers = assessment.assignedUsers.filter(
      u => u.toString() !== id
    );
    await assessment.save();
  }

  res.json({
    success: true,
    message: 'Assessment removed from user successfully'
  });
});

/**
 * @desc    Get user's assigned assessments
 * @route   GET /api/users/:id/assessments
 * @access  Private
 */
const getUserAssessments = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate({
      path: 'assignedAssessments',
      populate: {
        path: 'createdBy',
        select: 'firstName lastName'
      }
    });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin' && 
      req.user.role !== 'admin' && 
      req.user._id.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({
    success: true,
    data: { assessments: user.assignedAssessments }
  });
});

/**
 * @desc    Toggle user status (Active/Inactive)
 * @route   PATCH /api/users/:id/toggle-status
 * @access  Private (Admin, SuperAdmin)
 */
const toggleStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent toggling your own status
  if (req.user._id.toString() === user._id.toString()) {
    throw new ApiError(400, 'Cannot toggle your own status');
  }

  // Check permissions (Admin can only toggle users in their organization)
  if (req.user.role !== 'superadmin') {
    if (user.role === 'superadmin') {
      throw new ApiError(403, 'Cannot deactivate superadmin');
    }
    if (user.organization?.toString() !== req.user.organization?._id?.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Toggle status
  user.isActive = !user.isActive;
  
  // Update deactivation details
  if (!user.isActive) {
    user.deactivationDate = req.body.deactivationDate || new Date();
    if (req.body.deactivationReason) {
      user.deactivationReason = req.body.deactivationReason;
    }
  } else {
    user.deactivationDate = null;
    user.deactivationReason = null;
  }

  await user.save();

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { 
      user: {
        _id: user._id,
        isActive: user.isActive,
        deactivationDate: user.deactivationDate,
        deactivationReason: user.deactivationReason
      }
    }
  });
});

/**
 * @desc    Bulk create users from CSV
 * @route   POST /api/users/bulk-upload
 * @access  Private (Admin)
 */
const bulkCreateUsers = asyncHandler(async (req, res) => {
  const { users, groupId, sendInvites } = req.body;

  if (!users || !Array.isArray(users) || users.length === 0) {
    throw new ApiError(400, 'No users provided');
  }

  if (users.length > 500) {
    throw new ApiError(400, 'Maximum 500 users can be uploaded at once');
  }

  const organizationId = req.user.role === 'superadmin' && req.body.organizationId
    ? req.body.organizationId
    : req.user.organization._id;

  const results = {
    created: [],
    skipped: [],
    errors: []
  };

  for (let i = 0; i < users.length; i++) {
    const userData = users[i];
    const rowNumber = i + 2; // +2 because first row is header and array is 0-indexed

    try {
      // Validate required fields
      if (!userData.email) {
        results.errors.push({ row: rowNumber, email: userData.email || 'unknown', error: 'Email is required' });
        continue;
      }

      if (!userData.firstName) {
        results.errors.push({ row: rowNumber, email: userData.email, error: 'First name is required' });
        continue;
      }

      if (!userData.password) {
        results.errors.push({ row: rowNumber, email: userData.email, error: 'Password is required' });
        continue;
      }

      if (userData.password.length < 6) {
        results.errors.push({ row: rowNumber, email: userData.email, error: 'Password must be at least 6 characters' });
        continue;
      }

      // Check if user already exists in this organization
      const existingUser = await User.findOne({ email: userData.email.toLowerCase().trim(), organization: organizationId });
      if (existingUser) {
        results.skipped.push({
          row: rowNumber,
          email: userData.email,
          reason: 'User already exists'
        });
        continue;
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await User.create({
        email: userData.email.toLowerCase().trim(),
        firstName: userData.firstName.trim(),
        lastName: userData.lastName?.trim() || '',
        password: hashedPassword,
        phone: userData.phone?.trim() || '',
        phoneCountryCode: userData.phoneCountryCode?.trim() || '+91',
        jobTitle: userData.jobTitle?.trim() || '',
        organization: organizationId,
        role: 'user',
        isActive: true
      });

      results.created.push({
        row: rowNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });

      // Note: Password will be set by admin or sent via invite email
    } catch (error) {
      results.errors.push({
        row: rowNumber,
        email: userData.email || 'unknown',
        error: error.message
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Bulk upload completed: ${results.created.length} created, ${results.skipped.length} skipped, ${results.errors.length} errors`,
    data: {
      summary: {
        total: users.length,
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      created: results.created,
      skipped: results.skipped,
      errors: results.errors
    }
  });
});

/**
 * @desc    Reset user password (Admin only)
 * @route   POST /api/users/:id/reset-password
 * @access  Private (Admin, SuperAdmin)
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const user = await User.findById(req.params.id).select('+password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Admin can only reset password for users in their organization
  if (req.user.role !== 'superadmin') {
    if (user.organization?.toString() !== req.user.organization?._id?.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Hash new password
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleStatus,
  assignAssessment,
  removeAssessment,
  getUserAssessments,
  bulkCreateUsers,
  resetPassword
};
