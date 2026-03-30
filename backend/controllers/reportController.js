const { Report, Attempt, Assessment } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const crypto = require('crypto');

/**
 * @desc    Get all reports
 * @route   GET /api/reports
 * @access  Private
 */
const getReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, userId, assessmentId } = req.query;

  let query = {};

  // Filter based on role
  if (req.user.role === 'user') {
    query.user = req.user._id;
    query.visibleToUser = true;
  } else if (req.user.role === 'admin') {
    query.organization = req.user.organization._id;
    if (userId) {
      query.user = userId;
    }
  }
  // SuperAdmin can see all

  if (assessmentId) {
    query.assessment = assessmentId;
  }

  // First, get all report IDs that have valid assessments
  const allReports = await Report.find(query)
    .populate('assessment', '_id')
    .select('_id');
  
  const validReportIds = allReports
    .filter(report => report.assessment !== null)
    .map(report => report._id);

  // Fetch full data only for valid reports with pagination
  let reports = await Report.find({ ...query, _id: { $in: validReportIds } })
    .populate('user', 'firstName lastName email')
    .populate('conductedBy', 'firstName lastName email')
    .populate('assessment', 'title category')
    .populate('attempt', 'status percentage completedAt timeSpent testTakerName testTakerEmail testTakerPhone')
    .sort({ generatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = validReportIds.length;

  res.json({
    success: true,
    data: {
      reports,
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
 * @desc    Get single report
 * @route   GET /api/reports/:id
 * @access  Private
 */
const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('assessment', 'title category description')
    .populate('attempt')
    .populate({
      path: 'questionAnalysis.question',
      model: 'Question',
      select: 'questionText options correctAnswer explanation'
    });

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check permissions
  if (req.user.role === 'user') {
    if (report.user._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
    if (!report.visibleToUser) {
      throw new ApiError(403, 'Report is not visible to you');
    }
  } else if (req.user.role === 'admin') {
    if (report.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  res.json({
    success: true,
    data: { report }
  });
});

/**
 * @desc    Share report via email
 * @route   POST /api/reports/:id/share
 * @access  Private
 */
const shareReport = asyncHandler(async (req, res) => {
  const { email: recipientEmail, expiresInDays = 30 } = req.body;

  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check permissions
  if (req.user.role === 'user' && report.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  if (req.user.role === 'admin' && 
      report.organization.toString() !== req.user.organization._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  // Generate access token
  const accessToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));

  report.sharedWith.push({
    email: recipientEmail,
    accessToken,
    expiresAt
  });

  await report.save();

  // TODO: Send email with share link
  // For now, just return the share URL
  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reports/shared/${accessToken}`;

  res.json({
    success: true,
    message: 'Report shared successfully',
    data: {
      shareUrl,
      expiresAt
    }
  });
});

/**
 * @desc    Get shared report
 * @route   GET /api/reports/shared/:token
 * @access  Public
 */
const getSharedReport = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const report = await Report.findOne({
    'sharedWith.accessToken': token
  })
    .populate('user', 'firstName lastName')
    .populate('assessment', 'title category')
    .populate('attempt', 'percentage completedAt');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check if share has expired
  const shareRecord = report.sharedWith.find(s => s.accessToken === token);
  if (shareRecord.expiresAt && new Date() > shareRecord.expiresAt) {
    throw new ApiError(410, 'Share link has expired');
  }

  // Update view timestamp
  shareRecord.viewedAt = new Date();
  await report.save();

  // Return limited data for shared reports
  res.json({
    success: true,
    data: {
      report: {
        assessment: report.assessment,
        scores: report.scores,
        dimensions: report.dimensions,
        analysis: report.analysis,
        generatedAt: report.generatedAt
      }
    }
  });
});

/**
 * @desc    Toggle report visibility
 * @route   PUT /api/reports/:id/visibility
 * @access  Private (Admin, SuperAdmin)
 */
const toggleVisibility = asyncHandler(async (req, res) => {
  const { visibleToUser } = req.body;

  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (report.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  report.visibleToUser = visibleToUser;
  await report.save();

  res.json({
    success: true,
    message: `Report is now ${visibleToUser ? 'visible' : 'hidden'} to user`,
    data: { report }
  });
});

/**
 * @desc    Add admin notes to report
 * @route   PUT /api/reports/:id/notes
 * @access  Private (Admin, SuperAdmin)
 */
const addAdminNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (report.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  report.adminNotes = notes;
  await report.save();

  res.json({
    success: true,
    message: 'Admin notes added successfully',
    data: { report }
  });
});

/**
 * @desc    Download report as PDF
 * @route   GET /api/reports/:id/download
 * @access  Private
 */
const downloadReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('assessment', 'title category')
    .populate('attempt');

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check permissions
  if (req.user.role === 'user') {
    if (report.user._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
    if (!report.visibleToUser) {
      throw new ApiError(403, 'Report is not available for download');
    }
  }

  // For now, return JSON data. In production, generate PDF
  res.json({
    success: true,
    message: 'PDF download not yet implemented. Returning JSON data.',
    data: { report }
  });
});

module.exports = {
  getReports,
  getReport,
  shareReport,
  getSharedReport,
  toggleVisibility,
  addAdminNotes,
  downloadReport
};
