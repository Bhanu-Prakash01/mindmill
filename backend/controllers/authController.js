const crypto = require('crypto');
const { User, Assessment, Organization } = require('../models');
const { generateToken } = require('../config/jwt');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { sendPasswordResetEmail, sendEmailVerificationOtp } = require('../services/emailService');

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('[login] Attempt - email:', email, '| password length:', password?.length);
  console.log('[login] Org context from header:', req.organization?.slug || 'NONE');

  let user;

  if (req.organization) {
    // Org-scoped login: find user by email within the organization
    user = await User.findOne({ email, organization: req.organization._id })
      .select('+password')
      .populate('organization');

    console.log('[login] Org-scoped lookup result:', user ? `Found (id: ${user._id})` : 'NOT FOUND');

    if (!user) {
      throw new ApiError(401, 'Invalid email or password for this organization');
    }
  } else {
    // No org context: allow superadmin OR individual account login
    user = await User.findOne({
      email,
      $or: [
        { role: 'superadmin' },
        { accountType: 'individual', organization: null }
      ]
    })
      .select('+password')
      .populate('organization');

    console.log('[login] Non-org lookup result:', user ? `Found (id: ${user._id})` : 'NOT FOUND');

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
        accountType: user.accountType,
        organization: user.organization,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        freeTrialUsed: user.freeTrialUsed,
        personalCredits: user.personalCredits
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
        accountType: user.accountType,
        organization: user.organization,
        avatar: user.avatar,
        phone: user.phone,
        jobTitle: user.jobTitle,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        freeTrialUsed: user.freeTrialUsed,
        freeTrialAssessmentId: user.freeTrialAssessmentId,
        freeTrialAttemptId: user.freeTrialAttemptId,
        personalCredits: user.personalCredits
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
  const { firstName, lastName, phone, jobTitle, avatar, city, isCoordinator, email } = req.body;

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
  if (email !== undefined && req.user.role === 'superadmin') {
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim(),
      _id: { $ne: req.user._id }
    });
    if (existingUser) {
      throw new ApiError(400, 'Email already exists');
    }
    updateData.email = email.toLowerCase().trim();
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

  const organizations = await Organization.find({ isActive: true, slug: { $ne: 'mindmil' } })
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

/**
 * @desc    Get available assessments for free trial selection
 * @route   GET /api/auth/free-trial/assessments
 * @access  Public
 */
const getFreeTrialAssessments = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find({
    isActive: true,
    isPublished: true
    // No organization filter — same catalog available to everyone
  })
    .select('title description category subCategory timeBound bannerImage difficulty totalQuestions isMuted')
    .sort({ category: 1, title: 1 })
    .limit(20);

  res.json({
    success: true,
    data: { assessments }
  });
});

/**
 * @desc    Register a free trial account (organization or individual)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerFreeTrial = asyncHandler(async (req, res) => {
  const {
    accountType,          // 'organization' | 'individual'
    firstName,
    lastName,
    email,
    password,
    selectedAssessmentId, // chosen free-trial assessment
    // Organization fields
    organizationName,
    industry,
    companySize,
    website,
    phone
  } = req.body;

  if (!accountType || !['organization', 'individual'].includes(accountType)) {
    throw new ApiError(400, 'Account type must be "organization" or "individual"');
  }
  if (!firstName || !email || !password) {
    throw new ApiError(400, 'First name, email, and password are required');
  }
  if (!selectedAssessmentId) {
    throw new ApiError(400, 'Please select a free trial assessment');
  }

  // Verify selected assessment exists and is available
  const assessment = await Assessment.findOne({
    _id: selectedAssessmentId,
    isActive: true,
    isPublished: true
  });
  if (!assessment) {
    throw new ApiError(404, 'Selected assessment not found or unavailable');
  }

  let user;
  let org;

  if (accountType === 'organization') {
    // --- ORGANIZATION FLOW ---
    if (!organizationName) {
      throw new ApiError(400, 'Organization name is required');
    }

    // Generate a unique slug from org name
    const baseSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 40);

    let slug = baseSlug;
    let slugAttempt = 0;
    while (await Organization.findOne({ slug })) {
      slugAttempt++;
      slug = `${baseSlug}-${slugAttempt}`;
    }

    // Check email not already taken in this (soon-to-be-created) org context
    // For org admin: email must be globally unique among org admins
    const existingOrgAdmin = await User.findOne({ email: email.toLowerCase(), accountType: 'organization' });
    if (existingOrgAdmin) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    // Create the organization
    org = await Organization.create({
      name: organizationName.trim(),
      slug,
      subdomain: slug,
      description: `${organizationName} — registered via free trial`,
      publicProfile: {
        industry: industry || '',
        companySize: companySize || '',
        website: website || ''
      },
      subscription: {
        plan: 'free',
        status: 'active',
        startDate: new Date()
      },
      isActive: true
    });

    // Create the admin user linked to this org
    user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName?.trim() || '',
      email: email.toLowerCase().trim(),
      password,
      role: 'admin',
      accountType: 'organization',
      organization: org._id,
      phone: phone || null,
      freeTrialUsed: false,
      freeTrialAssessmentId: assessment._id,
      registeredAt: new Date(),
      isActive: true
    });

    // Link admin back to org
    org.admin = user._id;
    await org.save();

    // Populate org for token response
    await user.populate('organization');

  } else {
    // --- INDIVIDUAL FLOW ---
    // Email must be globally unique for individual accounts
    const existing = await User.findOne({ email: email.toLowerCase(), organization: null });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName?.trim() || '',
      email: email.toLowerCase().trim(),
      password,
      role: 'user',
      accountType: 'individual',
      organization: null,
      phone: phone || null,
      freeTrialUsed: false,
      freeTrialAssessmentId: assessment._id,
      personalCredits: { total: 0, used: 0 },
      registeredAt: new Date(),
      isActive: true
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  user.emailVerificationOtp = hashedOtp;
  user.emailVerificationOtpExpire = Date.now() + 10 * 60 * 1000;
  user.isEmailVerified = false;
  await user.save();

  await sendEmailVerificationOtp({
    to: user.email,
    fullName: user.fullName,
    otp
  }).catch(err => {
    console.error('Failed to send verification email:', err.message);
  });

  res.status(201).json({
    success: true,
    message: 'Account created! Please check your email for the verification code.',
    data: {
      email: user.email,
      needsVerification: true,
      freeTrialAssessment: {
        id: assessment._id,
        title: assessment.title,
        category: assessment.category,
        subCategory: assessment.subCategory
      },
      orgSlug: org?.slug || null
    }
  });
});

/**
 * @desc    Verify email with OTP
 * @route   POST /api/auth/verify-email-otp
 * @access  Public
 */
const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, 'Email already verified');
  }

  if (!user.emailVerificationOtp || !user.emailVerificationOtpExpire) {
    throw new ApiError(400, 'No verification code found. Please request a new one.');
  }

  if (Date.now() > user.emailVerificationOtpExpire) {
    throw new ApiError(400, 'Verification code has expired. Please request a new one.');
  }

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashedOtp !== user.emailVerificationOtp) {
    throw new ApiError(400, 'Invalid verification code');
  }

  user.isEmailVerified = true;
  user.emailVerificationOtp = null;
  user.emailVerificationOtpExpire = null;
  await user.save();

  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });

  res.json({
    success: true,
    message: 'Email verified successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        accountType: user.accountType,
        organization: user.organization || null,
        freeTrialUsed: user.freeTrialUsed,
        freeTrialAssessmentId: user.freeTrialAssessmentId,
        avatar: user.avatar || null
      },
      token
    }
  });
});

/**
 * @desc    Resend verification OTP
 * @route   POST /api/auth/resend-verification-otp
 * @access  Public
 */
const resendVerificationOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, 'Email already verified');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  user.emailVerificationOtp = hashedOtp;
  user.emailVerificationOtpExpire = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendEmailVerificationOtp({
    to: user.email,
    fullName: user.fullName,
    otp
  }).catch(err => {
    console.error('Failed to send verification email:', err.message);
  });

  res.json({
    success: true,
    message: 'Verification code resent to your email'
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
  demoLogin,
  registerFreeTrial,
  getFreeTrialAssessments,
  verifyEmailOtp,
  resendVerificationOtp
};
