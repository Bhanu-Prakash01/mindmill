const { Organization, User, Assessment } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get all organizations
 * @route   GET /api/organizations
 * @access  Private (SuperAdmin)
 */
const getOrganizations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status } = req.query;

  let query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query['subscription.status'] = status;
  }

  const organizations = await Organization.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Organization.countDocuments(query);

  // Get user counts for each organization
  const orgsWithCounts = await Promise.all(
    organizations.map(async (org) => {
      const userCount = await User.countDocuments({ organization: org._id });
      const assessmentCount = await Assessment.countDocuments({ organization: org._id });
      return {
        ...org.toObject(),
        userCount,
        assessmentCount
      };
    })
  );

  res.json({
    success: true,
    data: {
      organizations: orgsWithCounts,
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
 * @desc    Get single organization
 * @route   GET /api/organizations/:id
 * @access  Private (Admin, SuperAdmin, Member)
 */
const getOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (!req.user.organization || 
        req.user.organization._id.toString() !== organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Get additional stats
  const userCount = await User.countDocuments({ organization: organization._id });
  const assessmentCount = await Assessment.countDocuments({ organization: organization._id });
  const activeAssessmentCount = await Assessment.countDocuments({ 
    organization: organization._id,
    isActive: true,
    isPublished: true
  });

  res.json({
    success: true,
    data: {
      organization: {
        ...organization.toObject(),
        userCount,
        assessmentCount,
        activeAssessmentCount
      }
    }
  });
});

/**
 * @desc    Create new organization
 * @route   POST /api/organizations
 * @access  Private (SuperAdmin)
 */
const createOrganization = asyncHandler(async (req, res) => {
  const { name, slug, description, primaryColor, secondaryColor } = req.body;

  // Check if slug already exists
  const existingOrg = await Organization.findOne({ slug: slug?.toLowerCase().trim() });
  if (existingOrg) {
    throw new ApiError(400, 'Organization slug already exists');
  }

  const organization = await Organization.create({
    name,
    slug,
    description,
    primaryColor,
    secondaryColor
  });

  res.status(201).json({
    success: true,
    message: 'Organization created successfully',
    data: { organization }
  });
});

/**
 * @desc    Update organization
 * @route   PUT /api/organizations/:id
 * @access  Private (Admin, SuperAdmin)
 */
const updateOrganization = asyncHandler(async (req, res) => {
  const { name, description, settings } = req.body;

  let organization = await Organization.findById(req.params.id);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin' && 
      req.user.organization._id.toString() !== organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  const updateData = { name, description };
  
  // Only SuperAdmin can update settings
  if (settings && req.user.role === 'superadmin') {
    updateData.settings = { ...organization.settings, ...settings };
  }

  organization = await Organization.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Organization updated successfully',
    data: { organization }
  });
});

/**
 * @desc    Update organization branding
 * @route   PUT /api/organizations/:id/branding
 * @access  Private (Admin, SuperAdmin)
 */
const updateBranding = asyncHandler(async (req, res) => {
  const { primaryColor, secondaryColor, brandingEnabled, publicProfileEnabled } = req.body;

  let organization = await Organization.findById(req.params.id);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin' && 
      req.user.organization._id.toString() !== organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  organization = await Organization.findByIdAndUpdate(
    req.params.id,
    {
      primaryColor,
      secondaryColor,
      brandingEnabled,
      publicProfileEnabled
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Branding updated successfully',
    data: { organization }
  });
});

/**
 * @desc    Update organization logo
 * @route   PUT /api/organizations/:id/logo
 * @access  Private (Admin, SuperAdmin)
 */
const updateLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a logo file');
  }

  let organization = await Organization.findById(req.params.id);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin' && 
      req.user.organization._id.toString() !== organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  const logoUrl = `/uploads/logos/${req.file.filename}`;

  organization = await Organization.findByIdAndUpdate(
    req.params.id,
    { logo: logoUrl },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Logo updated successfully',
    data: { organization }
  });
});

/**
 * @desc    Update organization banner
 * @route   PUT /api/organizations/:id/banner
 * @access  Private (Admin, SuperAdmin)
 */
const updateBanner = asyncHandler(async (req, res) => {
  const { banner } = req.body;

  let organization = await Organization.findById(req.params.id);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin' && 
      req.user.organization._id.toString() !== organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  // If a file is uploaded, use file path; otherwise use the preset value from body
  const bannerValue = req.file ? `/uploads/banners/${req.file.filename}` : banner;

  organization = await Organization.findByIdAndUpdate(
    req.params.id,
    { banner: bannerValue },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Banner updated successfully',
    data: { organization }
  });
});

/**
 * @desc    Update public profile
 * @route   PUT /api/organizations/:id/public-profile
 * @access  Private (Admin, SuperAdmin)
 */
const updatePublicProfile = asyncHandler(async (req, res) => {
  const { headline, about, website, linkedin, location, industry, companySize } = req.body;

  let organization = await Organization.findById(req.params.id);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin' && 
      req.user.organization._id.toString() !== organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  organization = await Organization.findByIdAndUpdate(
    req.params.id,
    {
      publicProfile: {
        headline,
        about,
        website,
        linkedin,
        location,
        industry,
        companySize
      }
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Public profile updated successfully',
    data: { organization }
  });
});

/**
 * @desc    Get public profile
 * @route   GET /api/organizations/:slug/public
 * @access  Public
 */
const getPublicProfile = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const organization = await Organization.findOne({ 
    slug,
    publicProfileEnabled: true,
    isActive: true
  });

  if (!organization) {
    throw new ApiError(404, 'Organization not found or profile not public');
  }

  // Get public stats
  const publishedAssessments = await Assessment.countDocuments({
    organization: organization._id,
    isPublished: true,
    isActive: true
  });

  res.json({
    success: true,
    data: {
      organization: {
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        banner: organization.banner,
        primaryColor: organization.primaryColor,
        publicProfile: organization.publicProfile,
        publishedAssessments
      }
    }
  });
});

/**
 * @desc    Add credits to organization
 * @route   POST /api/organizations/:id/credits
 * @access  Private (SuperAdmin)
 */
const addCredits = asyncHandler(async (req, res) => {
  const { credits, expiryDate } = req.body;

  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  organization.credits.total += parseInt(credits);
  if (expiryDate) {
    organization.credits.expiryDate = new Date(expiryDate);
  }

  await organization.save();

  res.json({
    success: true,
    message: 'Credits added successfully',
    data: {
      credits: organization.credits
    }
  });
});

/**
 * @desc    Delete organization
 * @route   DELETE /api/organizations/:id
 * @access  Private (SuperAdmin)
 */
const deleteOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  // Soft delete by deactivating
  organization.isActive = false;
  await organization.save();

  // Deactivate all users in the organization
  await User.updateMany(
    { organization: organization._id },
    { isActive: false }
  );

  res.json({
    success: true,
    message: 'Organization deactivated successfully'
  });
});

/**
 * @desc    Get my organization
 * @route   GET /api/organizations/my-organization
 * @access  Private
 */
const getMyOrganization = asyncHandler(async (req, res) => {
  if (!req.user.organization) {
    throw new ApiError(400, 'User is not associated with any organization');
  }

  const organization = await Organization.findById(req.user.organization);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  // Get additional stats
  const userCount = await User.countDocuments({ organization: organization._id });
  const assessmentCount = await Assessment.countDocuments({ organization: organization._id });
  const activeAssessmentCount = await Assessment.countDocuments({
    organization: organization._id,
    isActive: true,
    isPublished: true
  });

  res.json({
    success: true,
    data: {
      organization: {
        ...organization.toObject(),
        userCount,
        assessmentCount,
        activeAssessmentCount
      }
    }
  });
});

module.exports = {
  getOrganizations,
  getOrganization,
  getMyOrganization,
  createOrganization,
  updateOrganization,
  updateBranding,
  updateLogo,
  updateBanner,
  updatePublicProfile,
  getPublicProfile,
  addCredits,
  deleteOrganization
};
