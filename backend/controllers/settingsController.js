const { StandardQuery, ComplaintType } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const DEFAULT_QUERIES = [
  { label: 'Unable to view test in Dashboard', order: 1 },
  { label: 'Unable to start the test', order: 2 },
  { label: 'Unable to complete the test', order: 3 },
  { label: 'Could not complete the test on time', order: 4 },
  { label: 'Test expired need extension', order: 5 },
  { label: 'Test pages not moving to next', order: 6 },
  { label: 'The options are not clickable or saved', order: 7 },
  { label: 'Reschedule test timing', order: 8 },
  { label: 'Could not find the report', order: 9 },
  { label: 'Others', order: 10 }
];

/**
 * @desc    Get all active standard queries (auto-seeds if empty)
 * @route   GET /api/settings/standard-queries
 * @access  Private
 */
const getStandardQueries = asyncHandler(async (req, res) => {
  let queries = await StandardQuery.find({ isActive: true })
    .sort({ order: 1, createdAt: 1 });

  // Auto-seed defaults if none exist
  if (queries.length === 0) {
    for (const item of DEFAULT_QUERIES) {
      await StandardQuery.create({
        ...item,
        createdBy: req.user._id
      });
    }
    queries = await StandardQuery.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 });
  }

  res.json({
    success: true,
    data: { queries }
  });
});

/**
 * @desc    Get all standard queries (including inactive)
 * @route   GET /api/settings/standard-queries/all
 * @access  Private (SuperAdmin)
 */
const getAllStandardQueries = asyncHandler(async (req, res) => {
  const queries = await StandardQuery.find()
    .sort({ order: 1, createdAt: 1 });

  res.json({
    success: true,
    data: { queries }
  });
});

/**
 * @desc    Create standard query
 * @route   POST /api/settings/standard-queries
 * @access  Private (SuperAdmin)
 */
const createStandardQuery = asyncHandler(async (req, res) => {
  const { label, order } = req.body;

  const query = await StandardQuery.create({
    label,
    order: order || 0,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'Standard query created successfully',
    data: { query }
  });
});

/**
 * @desc    Update standard query
 * @route   PUT /api/settings/standard-queries/:id
 * @access  Private (SuperAdmin)
 */
const updateStandardQuery = asyncHandler(async (req, res) => {
  const { label, isActive, order } = req.body;

  const query = await StandardQuery.findById(req.params.id);
  if (!query) {
    throw new ApiError(404, 'Standard query not found');
  }

  if (label !== undefined) query.label = label;
  if (isActive !== undefined) query.isActive = isActive;
  if (order !== undefined) query.order = order;

  await query.save();

  res.json({
    success: true,
    message: 'Standard query updated successfully',
    data: { query }
  });
});

/**
 * @desc    Delete standard query
 * @route   DELETE /api/settings/standard-queries/:id
 * @access  Private (SuperAdmin)
 */
const deleteStandardQuery = asyncHandler(async (req, res) => {
  const query = await StandardQuery.findById(req.params.id);
  if (!query) {
    throw new ApiError(404, 'Standard query not found');
  }

  await query.deleteOne();

  res.json({
    success: true,
    message: 'Standard query deleted successfully'
  });
});

/**
 * @desc    Seed default standard queries
 * @route   POST /api/settings/standard-queries/seed
 * @access  Private (SuperAdmin)
 */
const seedDefaultQueries = asyncHandler(async (req, res) => {
  const created = [];
  for (const item of DEFAULT_QUERIES) {
    const exists = await StandardQuery.findOne({ label: item.label });
    if (!exists) {
      const query = await StandardQuery.create({
        ...item,
        createdBy: req.user._id
      });
      created.push(query);
    }
  }

  res.json({
    success: true,
    message: `${created.length} default queries seeded`,
    data: { created }
  });
});

/**
 * @desc    Get all active complaint types
 * @route   GET /api/settings/complaint-types
 * @access  Private
 */
const getComplaintTypes = asyncHandler(async (req, res) => {
  let types = await ComplaintType.find({ isActive: true })
    .sort({ order: 1, createdAt: 1 });

  // Auto-seed defaults if empty
  if (types.length === 0) {
    const defaults = [
      { label: 'General', value: 'general', order: 1 },
      { label: 'Technical', value: 'technical', order: 2 },
      { label: 'Billing', value: 'billing', order: 3 },
      { label: 'Assessment Issue', value: 'assessment_issue', order: 4 },
      { label: 'Feature Request', value: 'feature_request', order: 5 },
      { label: 'Complaint', value: 'complaint', order: 6 },
    ];
    for (const item of defaults) {
      await ComplaintType.create({ ...item, createdBy: req.user._id });
    }
    types = await ComplaintType.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 });
  }

  res.json({ success: true, data: { types } });
});

/**
 * @desc    Create complaint type
 * @route   POST /api/settings/complaint-types
 * @access  Private (SuperAdmin)
 */
const createComplaintType = asyncHandler(async (req, res) => {
  const { label } = req.body;
  if (!label || !label.trim()) {
    throw new ApiError(400, 'Label is required');
  }
  const value = label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const exists = await ComplaintType.findOne({ value });
  if (exists) {
    throw new ApiError(409, 'A complaint type with this label already exists');
  }

  const last = await ComplaintType.findOne().sort({ order: -1 });
  const type = await ComplaintType.create({
    label: label.trim(),
    value,
    order: (last?.order || 0) + 1,
    createdBy: req.user._id
  });

  res.status(201).json({ success: true, data: { type } });
});

/**
 * @desc    Delete complaint type
 * @route   DELETE /api/settings/complaint-types/:id
 * @access  Private (SuperAdmin)
 */
const deleteComplaintType = asyncHandler(async (req, res) => {
  const type = await ComplaintType.findById(req.params.id);
  if (!type) throw new ApiError(404, 'Complaint type not found');
  await type.deleteOne();
  res.json({ success: true, message: 'Complaint type deleted' });
});

module.exports = {
  getStandardQueries,
  getAllStandardQueries,
  createStandardQuery,
  updateStandardQuery,
  deleteStandardQuery,
  seedDefaultQueries,
  getComplaintTypes,
  createComplaintType,
  deleteComplaintType
};
