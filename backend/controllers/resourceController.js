const { Resource } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { uploadFile, deleteFile } = require('../services/cloudinaryUploadService');

/**
 * Build a tag filter for MongoDB queries.
 * If a tag query param is provided, returns a case-insensitive regex filter
 * against the `tags` array. Otherwise returns an empty filter.
 *
 * @param {string} queryTag - Raw tag value from query string
 * @returns {Object} MongoDB filter object
 */
const getTagFilter = (queryTag) => {
  if (!queryTag) return {};
  return { tags: { $regex: queryTag.trim(), $options: 'i' } };
};

/**
 * @desc    Get active resources
 * @route   GET /api/resources
 * @access  Private (all authenticated users)
 */
const getResources = asyncHandler(async (req, res) => {
  const filter = { isActive: true, ...getTagFilter(req.query.tag) };

  const resources = await Resource.find(filter)
    .sort({ order: 1, createdAt: -1 });

  res.json({
    success: true,
    data: { resources }
  });
});

/**
 * @desc    Get all resources (including inactive)
 * @route   GET /api/resources/all
 * @access  Private (SuperAdmin only)
 */
const getAllResources = asyncHandler(async (req, res) => {
  const filter = getTagFilter(req.query.tag);

  const resources = await Resource.find(filter)
    .sort({ order: 1, createdAt: -1 });

  res.json({
    success: true,
    data: { resources }
  });
});

/**
 * @desc    Create a resource
 * @route   POST /api/resources
 * @access  Private (SuperAdmin only)
 */
const createResource = asyncHandler(async (req, res) => {
  let { title, description, type, videoUrl, linkUrl, tags, order } = req.body;

  // Convert comma-separated tags string to array
  if (typeof tags === 'string') {
    tags = tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  const resourceData = {
    title,
    description,
    type,
    videoUrl,
    linkUrl,
    tags,
    order,
    createdBy: req.user._id
  };

  // If a file was uploaded (fieldname: resourceFile), upload to Cloudinary
  if (req.file) {
    const result = await uploadFile(req.file.buffer, { folder: 'mindmill/resources/' });
    resourceData.fileUrl = result.url;
    resourceData.publicId = result.publicId;
  }

  const resource = await Resource.create(resourceData);

  res.status(201).json({
    success: true,
    message: 'Resource created successfully',
    data: { resource }
  });
});

/**
 * @desc    Update a resource
 * @route   PUT /api/resources/:id
 * @access  Private (SuperAdmin only)
 */
const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  let { title, description, type, videoUrl, linkUrl, tags, isActive, order, thumbnail } = req.body;

  if (typeof tags === 'string') {
    tags = tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  if (title !== undefined) resource.title = title;
  if (description !== undefined) resource.description = description;
  if (type !== undefined) resource.type = type;
  if (videoUrl !== undefined) resource.videoUrl = videoUrl;
  if (linkUrl !== undefined) resource.linkUrl = linkUrl;
  if (tags !== undefined) resource.tags = tags;
  if (isActive !== undefined) resource.isActive = isActive;
  if (order !== undefined) resource.order = order;
  if (thumbnail !== undefined) resource.thumbnail = thumbnail;

  // Handle file replacement: upload new, then fire-and-forget delete old
  if (req.file) {
    const oldPublicId = resource.publicId;

    const result = await uploadFile(req.file.buffer, { folder: 'mindmill/resources/' });
    resource.fileUrl = result.url;
    resource.publicId = result.publicId;

    if (oldPublicId) {
      deleteFile(oldPublicId).catch((err) => {
        console.error(
          `[resourceController] Failed to delete old resource file ${oldPublicId}:`,
          err.message
        );
      });
    }
  }

  await resource.save();

  res.json({
    success: true,
    message: 'Resource updated successfully',
    data: { resource }
  });
});

/**
 * @desc    Delete a resource
 * @route   DELETE /api/resources/:id
 * @access  Private (SuperAdmin only)
 */
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  // Clean up Cloudinary file if it exists (fire-and-forget, log errors)
  if (resource.publicId) {
    deleteFile(resource.publicId).catch((err) => {
      console.error(
        `[resourceController] Failed to delete resource file ${resource.publicId}:`,
        err.message
      );
    });
  }

  await resource.deleteOne();

  res.json({
    success: true,
    message: 'Resource deleted successfully'
  });
});

module.exports = {
  getResources,
  getAllResources,
  createResource,
  updateResource,
  deleteResource
};
