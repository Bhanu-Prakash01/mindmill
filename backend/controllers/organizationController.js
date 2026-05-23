const { Organization, User, Assessment } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { uploadFile, deleteFile } = require('../services/cloudinaryUploadService');

/**
 * @desc    Get all organizations
 * @route   GET /api/organizations
 * @access  Private (SuperAdmin)
 */
const getOrganizations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status } = req.query;

  let query = { slug: { $ne: 'mindmil' } };

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
    .populate('admin', 'firstName lastName email')
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
  const { name, description, settings, slug, credits } = req.body;

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
  
  if (req.user.role === 'superadmin') {
    if (slug) {
      const existingOrg = await Organization.findOne({ slug: slug.toLowerCase().trim(), _id: { $ne: organization._id } });
      if (existingOrg) {
        throw new ApiError(400, 'Organization slug already exists');
      }
      updateData.slug = slug.toLowerCase().trim();
    }
    if (settings) {
      updateData.settings = { ...organization.settings, ...settings };
    }
    if (credits !== undefined) {
      updateData['credits.total'] = parseInt(credits);
    }
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

  const oldPublicId = organization.logoPublicId;
  const result = await uploadFile(req.file.buffer, { folder: 'mindmill/logos/' });

  organization = await Organization.findByIdAndUpdate(
    req.params.id,
    { logo: result.url, logoPublicId: result.publicId },
    { new: true }
  );

  if (oldPublicId) {
    deleteFile(oldPublicId).catch((err) => {
      console.error(`[organizationController] Failed to delete old logo ${oldPublicId}:`, err.message);
    });
  }

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

  const updateFields = {};
  if (req.file) {
    const oldPublicId = organization.bannerPublicId;
    const result = await uploadFile(req.file.buffer, { folder: 'mindmill/banners/' });
    updateFields.banner = result.url;
    updateFields.bannerPublicId = result.publicId;
    if (oldPublicId) {
      deleteFile(oldPublicId).catch((err) => {
        console.error(`[organizationController] Failed to delete old banner ${oldPublicId}:`, err.message);
      });
    }
  } else if (banner) {
    updateFields.banner = banner;
  }

  organization = await Organization.findByIdAndUpdate(
    req.params.id,
    updateFields,
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
  const { headline, about, bestHRPractices, awardsAccolades, website, linkedin, location, industry, companySize, moderatorName } = req.body;

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
      moderatorName: moderatorName || organization.moderatorName,
      publicProfile: {
        headline,
        about,
        bestHRPractices,
        awardsAccolades,
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
        moderatorName: organization.moderatorName,
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
 * @desc    Reassign organization admin
 * @route   PATCH /api/organizations/:id/admin
 * @access  Private (SuperAdmin)
 */
const reassignAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.body;

  const organization = await Organization.findById(req.params.id);
  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  const newAdmin = await User.findById(adminId);
  if (!newAdmin) {
    throw new ApiError(404, 'User not found');
  }

  if (newAdmin.role !== 'admin') {
    throw new ApiError(400, 'Selected user must have admin role');
  }

  organization.admin = newAdmin._id;
  await organization.save();

  const updatedOrg = await Organization.findById(organization._id)
    .populate('admin', 'firstName lastName email');

  res.json({
    success: true,
    message: 'Organization admin reassigned successfully',
    data: { organization: updatedOrg }
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

  let organization = await Organization.findById(req.user.organization);

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

/**
 * @desc    Upload a document to a public profile section
 * @route   POST /api/organizations/:id/profile-document
 * @access  Private (Admin, SuperAdmin)
 */
const uploadProfileDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a file');
  }

  const { section } = req.body;

  if (!section || !['bestHRPractices', 'awardsAccolades'].includes(section)) {
    throw new ApiError(400, 'Invalid section. Must be "bestHRPractices" or "awardsAccolades"');
  }

  let organization = await Organization.findById(req.params.id);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  if (req.user.role !== 'superadmin' &&
      req.user.organization._id.toString() !== organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  // Use image resource type for PDFs and images so Cloudinary serves them inline
  // (raw resource type sets Content-Disposition: attachment, which breaks iframe preview)
  const isInlineType = req.file.mimetype === 'application/pdf' || req.file.mimetype.startsWith('image/');
  const result = await uploadFile(req.file.buffer, {
    folder: 'mindmill/documents/',
    ...(isInlineType ? { extra: { resource_type: 'image' } } : {})
  });

  const docField = section === 'bestHRPractices' ? 'bestHRPracticesDocs' : 'awardsAccoladesDocs';
  const doc = {
    name: req.file.originalname,
    url: result.url,
    publicId: result.publicId,
    type: req.file.mimetype,
    size: req.file.size,
    uploadedAt: new Date()
  };

  organization = await Organization.findByIdAndUpdate(
    req.params.id,
    { $push: { [`publicProfile.${docField}`]: doc } },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Document uploaded successfully',
    data: { document: doc, organization }
  });
});

/**
 * @desc    Delete a document from a public profile section
 * @route   DELETE /api/organizations/:id/profile-document
 * @access  Private (Admin, SuperAdmin)
 */
const deleteProfileDocument = asyncHandler(async (req, res) => {
  const { section, documentId } = req.body;

  if (!section || !['bestHRPractices', 'awardsAccolades'].includes(section)) {
    throw new ApiError(400, 'Invalid section. Must be "bestHRPractices" or "awardsAccolades"');
  }

  if (!documentId) {
    throw new ApiError(400, 'Document ID is required');
  }

  let organization = await Organization.findById(req.params.id);

  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  if (req.user.role !== 'superadmin' &&
      req.user.organization._id.toString() !== organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  // Find the document to get its publicId before removing
  const docField = section === 'bestHRPractices' ? 'bestHRPracticesDocs' : 'awardsAccoladesDocs';
  const docsArray = organization.publicProfile?.[docField] || [];
  const doc = docsArray.find(d => d._id.toString() === documentId);

  const pullKey = `publicProfile.${docField}`;

  organization = await Organization.findByIdAndUpdate(
    req.params.id,
    { $pull: { [pullKey]: { _id: documentId } } },
    { new: true }
  );

  if (doc?.publicId) {
    deleteFile(doc.publicId).catch((err) => {
      console.error(`[organizationController] Failed to delete document ${doc.publicId}:`, err.message);
    });
  }

  res.json({
    success: true,
    message: 'Document deleted successfully',
    data: { organization }
  });
});

/**
 * @desc    Get bank details (returns from default/system organization)
 * @route   GET /api/organizations/bank-details
 * @access  Public
 */
const getBankDetails = asyncHandler(async (req, res) => {
  const org = await Organization.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!org) {
    return res.json({
      success: true,
      data: {
        bankDetails: {
          upiId: '',
          accountHolderName: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          branchName: ''
        }
      }
    });
  }

  res.json({
    success: true,
    data: {
      bankDetails: {
        upiId: org.bankDetails?.upiId || '',
        accountHolderName: org.bankDetails?.accountHolderName || '',
        bankName: org.bankDetails?.bankName || '',
        accountNumber: org.bankDetails?.accountNumber || '',
        ifscCode: org.bankDetails?.ifscCode || '',
        branchName: org.bankDetails?.branchName || ''
      }
    }
  });
});

/**
 * @desc    Update bank details (stores on the first active organization)
 * @route   PUT /api/organizations/bank-details
 * @access  Private (SuperAdmin)
 */
const updateBankDetails = asyncHandler(async (req, res) => {
  const { upiId, accountHolderName, bankName, accountNumber, ifscCode, branchName } = req.body;

  const organization = await Organization.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!organization) {
    throw new ApiError(404, 'No active organization found');
  }

  organization.bankDetails = {
    upiId: upiId ?? organization.bankDetails?.upiId ?? '',
    accountHolderName: accountHolderName ?? organization.bankDetails?.accountHolderName ?? '',
    bankName: bankName ?? organization.bankDetails?.bankName ?? '',
    accountNumber: accountNumber ?? organization.bankDetails?.accountNumber ?? '',
    ifscCode: ifscCode ?? organization.bankDetails?.ifscCode ?? '',
    branchName: branchName ?? organization.bankDetails?.branchName ?? ''
  };

  await organization.save();

  res.json({
    success: true,
    message: 'Bank details updated successfully',
    data: { bankDetails: organization.bankDetails }
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
  deleteOrganization,
  reassignAdmin,
  uploadProfileDocument,
  deleteProfileDocument,
  getBankDetails,
  updateBankDetails
};
