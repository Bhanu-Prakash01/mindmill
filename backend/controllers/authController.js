const crypto = require('crypto');
const { User } = require('../models');
const { generateToken } = require('../config/jwt');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { sendPasswordResetEmail } = require('../services/emailService');

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  let user;

  if (req.organization) {
    // Org-scoped login: find user by email within the organization
    user = await User.findOne({ email, organization: req.organization._id })
      .select('+password')
      .populate('organization');

    if (!user) {
      throw new ApiError(401, 'Invalid email or password for this organization');
    }
  } else {
    // No org context: allow superadmin login only
    user = await User.findOne({ email, role: 'superadmin' })
      .select('+password')
      .populate('organization');

    if (!user) {
      throw new ApiError(401, 'Please access via your organization URL to login');
    }
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(401, 'Account is deactivated. Please contact support.');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        organization: user.organization,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      },
      token
    }
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('organization');

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        organization: user.organization,
        avatar: user.avatar,
        phone: user.phone,
        jobTitle: user.jobTitle,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, jobTitle, avatar, city, isCoordinator } = req.body;

  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (city !== undefined) updateData.city = city;
  if (isCoordinator !== undefined && ['admin', 'superadmin'].includes(req.user.role)) {
    updateData.isCoordinator = isCoordinator;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).populate('organization');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        organization: user.organization,
        avatar: user.avatar,
        phone: user.phone,
        jobTitle: user.jobTitle,
        city: user.city,
        isCoordinator: user.isCoordinator
      }
    }
  });
});

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from storage
  // Here we can optionally add token to a blacklist if needed

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * @desc    Refresh token
 * @route   POST /api/auth/refresh
 * @access  Private
 */
const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }

  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  res.json({
    success: true,
    data: { token }
  });
});

/**
 * @desc    Get all organizations for demo login
 * @route   GET /api/auth/demo/organizations
 * @access  Public
 */
const getDemoOrganizations = asyncHandler(async (req, res) => {
  const { Organization } = require('../models');

  const organizations = await Organization.find({ isActive: true })
    .select('name slug description primaryColor secondaryColor logo')
    .sort({ name: 1 });

  // Get user count per org
  const orgsWithData = await Promise.all(
    organizations.map(async (org) => {
      const userCount = await User.countDocuments({
        organization: org._id,
        isActive: true
      });
      return {
        id: org._id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        primaryColor: org.primaryColor,
        secondaryColor: org.secondaryColor,
        logo: org.logo,
        userCount
      };
    })
  );

  res.json({
    success: true,
    data: {
      organizations: orgsWithData
    }
  });
});

/**
 * @desc    Get demo users for an organization
 * @route   GET /api/auth/demo/organizations/:slug/users
 * @access  Public
 */
const getDemoUsers = asyncHandler(async (req, res) => {
  const { Organization } = require('../models');
  const { slug } = req.params;

  const organization = await Organization.findOne({
    slug: slug.toLowerCase().trim(),
    isActive: true
  });

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  const users = await User.find({
    organization: organization._id,
    isActive: true
  }).select('email firstName lastName role jobTitle');

  res.json({
    success: true,
    data: {
      organization: {
        name: organization.name,
        slug: organization.slug,
        primaryColor: organization.primaryColor
      },
      users: users.map(u => ({
        id: u._id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName,
        role: u.role,
        jobTitle: u.jobTitle
      }))
    }
  });
});

/**
 * @desc    Request password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).populate('organization');

  if (!user) {
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
  const orgName = user.organization ? user.organization.name : 'Mindmill';

  await sendPasswordResetEmail({
    to: user.email,
    fullName: user.fullName,
    organizationName: orgName,
    resetLink
  });

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.'
  });
});

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

/**
 * @desc    Demo login without password
 * @route   POST /api/auth/demo/login
 * @access  Public
 */
const demoLogin = asyncHandler(async (req, res) => {
  const { Organization } = require('../models');
  const { email, orgSlug } = req.body;

  if (!email || !orgSlug) {
    throw new ApiError(400, 'Email and organization slug are required');
  }

  const organization = await Organization.findOne({
    slug: orgSlug.toLowerCase().trim(),
    isActive: true
  });

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    organization: organization._id,
    isActive: true
  }).populate('organization');

  if (!user) {
    throw new ApiError(404, 'User not found in this organization');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  res.json({
    success: true,
    message: 'Demo login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        organization: user.organization,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      },
      token
    }
  });
});

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  refreshToken,
  getDemoOrganizations,
  getDemoUsers,
  forgotPassword,
  resetPassword,
  demoLogin
};
