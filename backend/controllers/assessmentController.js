const { Assessment, Question, User, Organization, Group } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const crypto = require('crypto');

/**
 * @desc    Get all assessments
 * @route   GET /api/assessments
 * @access  Private
 */
const getAssessments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', category, difficulty, status } = req.query;

  let query = {};

  // Filter by organization based on role
  if (req.user.role !== 'superadmin') {
    query.organization = req.user.organization._id;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (category) {
    query.category = category;
  }

  if (difficulty) {
    query.difficulty = difficulty;
  }

  if (status === 'active') {
    query.isActive = true;
    query.isPublished = true;
  } else if (status === 'draft') {
    query.isPublished = false;
  }

  const assessments = await Assessment.find(query)
    .populate('createdBy', 'firstName lastName')
    .populate('organization', 'name slug')
    .populate('assignedUsers', 'firstName lastName email')
    .populate('assignedGroups', 'name description')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Assessment.countDocuments(query);

  res.json({
    success: true,
    data: {
      assessments,
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
 * @desc    Get single assessment
 * @route   GET /api/assessments/:id
 * @access  Private
 */
const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('organization', 'name slug')
    .populate({
      path: 'questions',
      options: { sort: { order: 1 } }
    })
    .populate('assignedUsers', 'firstName lastName email');

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization._id.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  res.json({
    success: true,
    data: { assessment }
  });
});

/**
 * @desc    Create new assessment
 * @route   POST /api/assessments
 * @access  Private (Admin, SuperAdmin)
 */
const createAssessment = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    subCategory,
    difficulty,
    timeBound,
    purpose,
    audience,
    instructions,
    passingScore,
    reportConfig,
    tags
  } = req.body;

  const organizationId = req.user.role === 'superadmin' && req.body.organizationId
    ? req.body.organizationId
    : req.user.organization._id;

  const assessment = await Assessment.create({
    title,
    description,
    category,
    subCategory,
    organization: organizationId,
    createdBy: req.user._id,
    difficulty,
    timeBound,
    purpose,
    audience,
    instructions,
    passingScore,
    passingPercentage: passingScore,
    reportConfig,
    tags
  });

  await assessment.populate('createdBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Assessment created successfully',
    data: { assessment }
  });
});

/**
 * @desc    Update assessment
 * @route   PUT /api/assessments/:id
 * @access  Private (Admin, SuperAdmin)
 */
const updateAssessment = asyncHandler(async (req, res) => {
  let assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  const updateFields = [
    'title', 'description', 'category', 'subCategory', 'difficulty',
    'timeBound', 'purpose', 'audience', 'instructions', 'passingScore',
    'reportConfig', 'tags', 'isActive', 'isPublished', 'allowMultipleAttempts',
    'maxAttempts', 'showResultsImmediately', 'randomizeQuestions', 'randomizeOptions'
  ];

  const updateData = {};
  updateFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  if (updateData.passingScore) {
    updateData.passingPercentage = updateData.passingScore;
  }

  assessment = await Assessment.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('createdBy', 'firstName lastName');

  res.json({
    success: true,
    message: 'Assessment updated successfully',
    data: { assessment }
  });
});

/**
 * @desc    Delete assessment
 * @route   DELETE /api/assessments/:id
 * @access  Private (Admin, SuperAdmin)
 */
const deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Delete all associated questions
  await Question.deleteMany({ assessment: assessment._id });

  // Remove assessment from users' assigned assessments
  await User.updateMany(
    { assignedAssessments: assessment._id },
    { $pull: { assignedAssessments: assessment._id } }
  );

  await assessment.deleteOne();

  res.json({
    success: true,
    message: 'Assessment deleted successfully'
  });
});

/**
 * @desc    Duplicate assessment
 * @route   POST /api/assessments/:id/duplicate
 * @access  Private (Admin, SuperAdmin)
 */
const duplicateAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id)
    .populate('questions');

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Create new assessment with copied data
  const newAssessment = await Assessment.create({
    title: `${assessment.title} (Copy)`,
    description: assessment.description,
    category: assessment.category,
    subCategory: assessment.subCategory,
    organization: assessment.organization,
    createdBy: req.user._id,
    difficulty: assessment.difficulty,
    timeBound: assessment.timeBound,
    purpose: assessment.purpose,
    audience: assessment.audience,
    instructions: assessment.instructions,
    passingScore: assessment.passingScore,
    passingPercentage: assessment.passingPercentage,
    reportConfig: assessment.reportConfig,
    tags: assessment.tags,
    isPublished: false,
    questions: []
  });

  // Duplicate questions
  if (assessment.questions && assessment.questions.length > 0) {
    const newQuestions = await Promise.all(
      assessment.questions.map(async (q, index) => {
        const newQuestion = await Question.create({
          assessment: newAssessment._id,
          type: q.type,
          questionText: q.questionText,
          questionImage: q.questionImage,
          options: q.options,
          difficulty: q.difficulty,
          category: q.category,
          subCategory: q.subCategory,
          dimension: q.dimension,
          trait: q.trait,
          order: index + 1,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          timeLimit: q.timeLimit,
          isRequired: q.isRequired,
          explanation: q.explanation,
          tags: q.tags
        });
        return newQuestion._id;
      })
    );

    newAssessment.questions = newQuestions;
    newAssessment.totalQuestions = newQuestions.length;
    await newAssessment.save();
  }

  await newAssessment.populate('createdBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    message: 'Assessment duplicated successfully',
    data: { assessment: newAssessment }
  });
});

/**
 * @desc    Get assessment statistics
 * @route   GET /api/assessments/:id/stats
 * @access  Private (Admin, SuperAdmin)
 */
const getAssessmentStats = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  const Attempt = require('../models/Attempt');

  const stats = await Attempt.aggregate([
    { $match: { assessment: assessment._id } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        completedAttempts: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageScore: { $avg: '$percentage' },
        highestScore: { $max: '$percentage' },
        lowestScore: { $min: '$percentage' },
        averageTimeSpent: { $avg: '$timeSpent' }
      }
    }
  ]);

  const assignedUsersCount = assessment.assignedUsers.length;

  res.json({
    success: true,
    data: {
      stats: stats[0] || {
        totalAttempts: 0,
        completedAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        averageTimeSpent: 0
      },
      assignedUsersCount,
      totalQuestions: assessment.totalQuestions
    }
  });
});

/**
 * @desc    Toggle assessment publish status
 * @route   PATCH /api/assessments/:id/toggle-publish
 * @access  Private (Admin, SuperAdmin)
 */
const togglePublish = asyncHandler(async (req, res) => {
  let assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  assessment.isPublished = !assessment.isPublished;
  await assessment.save();

  res.json({
    success: true,
    message: `Assessment ${assessment.isPublished ? 'published' : 'unpublished'} successfully`,
    data: { assessment }
  });
});

/**
 * @desc    Assign assessment to users or groups
 * @route   POST /api/assessments/:id/assign
 * @access  Private (Admin, SuperAdmin)
 */
const assignAssessment = asyncHandler(async (req, res) => {
  const { userIds = [], groupIds = [] } = req.body;
  
  const assessment = await Assessment.findById(req.params.id);
  
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }
  
  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }
  
  // Add users to assignment
  if (userIds.length > 0) {
    const uniqueUsers = [...new Set([...assessment.assignedUsers.map(u => u.toString()), ...userIds])];
    assessment.assignedUsers = uniqueUsers;
    
    // Also update users' assignedAssessments
    await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { assignedAssessments: assessment._id } }
    );
  }
  
  // Add groups to assignment
  if (groupIds.length > 0) {
    const uniqueGroups = [...new Set([...assessment.assignedGroups.map(g => g.toString()), ...groupIds])];
    assessment.assignedGroups = uniqueGroups;
    
    // Get all members from these groups and assign to them too
    const groups = await Group.find({ _id: { $in: groupIds } });
    const memberIds = groups.flatMap(g => g.members.map(m => m.toString()));
    
    if (memberIds.length > 0) {
      const uniqueMembers = [...new Set([...assessment.assignedUsers.map(u => u.toString()), ...memberIds])];
      assessment.assignedUsers = uniqueMembers;
      
      await User.updateMany(
        { _id: { $in: memberIds } },
        { $addToSet: { assignedAssessments: assessment._id } }
      );
    }
  }
  
  await assessment.save();
  
  res.json({
    success: true,
    message: 'Assessment assigned successfully',
    data: { assessment }
  });
});

/**
 * @desc    Remove assignment from users or groups
 * @route   POST /api/assessments/:id/unassign
 * @access  Private (Admin, SuperAdmin)
 */
const unassignAssessment = asyncHandler(async (req, res) => {
  const { userIds = [], groupIds = [] } = req.body;
  
  const assessment = await Assessment.findById(req.params.id);
  
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }
  
  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }
  
  // Remove users from assignment
  if (userIds.length > 0) {
    assessment.assignedUsers = assessment.assignedUsers.filter(
      u => !userIds.includes(u.toString())
    );
    
    await User.updateMany(
      { _id: { $in: userIds } },
      { $pull: { assignedAssessments: assessment._id } }
    );
  }
  
  // Remove groups from assignment
  if (groupIds.length > 0) {
    assessment.assignedGroups = assessment.assignedGroups.filter(
      g => !groupIds.includes(g.toString())
    );
  }
  
  await assessment.save();
  
  res.json({
    success: true,
    message: 'Assignment removed successfully',
    data: { assessment }
  });
});

/**
 * @desc    Get my assigned assessments (for regular users)
 * @route   GET /api/assessments/my-assignments
 * @access  Private
 */
const getMyAssignments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  let query = {
    _id: { $in: req.user.assignedAssessments || [] },
    isPublished: true,
    isActive: true
  };
  
  if (status === 'completed') {
    const Attempt = require('../models/Attempt');
    const completedAttempts = await Attempt.find({
      user: req.user._id,
      status: 'completed'
    }).distinct('assessment');
    query._id = { $in: completedAttempts };
  } else if (status === 'pending') {
    const Attempt = require('../models/Attempt');
    const completedAttempts = await Attempt.find({
      user: req.user._id,
      status: 'completed'
    }).distinct('assessment');
    query._id = { 
      $in: req.user.assignedAssessments || [],
      $nin: completedAttempts
    };
  }
  
  const assessments = await Assessment.find(query)
    .populate('createdBy', 'firstName lastName')
    .populate('organization', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const count = await Assessment.countDocuments(query);
  
  // Get attempt status for each assessment
  const Attempt = require('../models/Attempt');
  const attempts = await Attempt.find({
    user: req.user._id,
    assessment: { $in: assessments.map(a => a._id) }
  });
  
  const assessmentsWithStatus = assessments.map(assessment => {
    const attempt = attempts.find(a => a.assessment.toString() === assessment._id.toString());
    return {
      ...assessment.toObject(),
      attemptStatus: attempt ? attempt.status : null,
      attemptId: attempt ? attempt._id : null
    };
  });
  
  res.json({
    success: true,
    data: {
      assessments: assessmentsWithStatus,
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
 * @desc    Toggle assessment mute status (pause availability)
 * @route   PATCH /api/assessments/:id/toggle-mute
 * @access  Private (Admin, SuperAdmin)
 */
const toggleMute = asyncHandler(async (req, res) => {
  let assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (req.user.role !== 'superadmin') {
    if (assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  assessment.isMuted = !assessment.isMuted;
  await assessment.save();

  res.json({
    success: true,
    message: `Assessment ${assessment.isMuted ? 'muted' : 'unmuted'} successfully`,
    data: { assessment }
  });
});

/**
 * @desc    Get public assessment via token (for test takers)
 * @route   GET /api/assessments/public/:token
 * @access  Public
 */
const getPublicAssessment = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const assessment = await Assessment.findOne({
    publicAccessToken: token,
    isPublished: true,
    isActive: true,
    isMuted: false
  }).populate('organization', 'name logo primaryColor secondaryColor');

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found or not available');
  }

  // Check if token has expired
  if (assessment.publicExpiresAt && new Date() > assessment.publicExpiresAt) {
    throw new ApiError(410, 'Assessment link has expired');
  }

  res.json({
    success: true,
    data: {
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        category: assessment.category,
        organization: assessment.organization,
        requirePasscode: assessment.requirePasscode,
        timeBound: assessment.timeBound,
        instructions: assessment.instructions,
        creditsRequired: assessment.creditsRequired
      }
    }
  });
});

/**
 * @desc    Generate public access link for assessment
 * @route   POST /api/assessments/:id/generate-link
 * @access  Private (Admin, SuperAdmin)
 */
const generatePublicLink = asyncHandler(async (req, res) => {
  const { expiresInDays = 30 } = req.body;

  let assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (req.user.role !== 'superadmin') {
    if (assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  assessment.publicAccessToken = token;
  assessment.publicExpiresAt = expiresAt;
  await assessment.save();

  const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/take/${token}`;

  res.json({
    success: true,
    message: 'Public link generated successfully',
    data: {
      publicUrl,
      token,
      expiresAt
    }
  });
});

/**
 * @desc    Revoke public access link
 * @route   DELETE /api/assessments/:id/revoke-link
 * @access  Private (Admin, SuperAdmin)
 */
const revokePublicLink = asyncHandler(async (req, res) => {
  let assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  if (req.user.role !== 'superadmin') {
    if (assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  assessment.publicAccessToken = null;
  assessment.publicExpiresAt = null;
  await assessment.save();

  res.json({
    success: true,
    message: 'Public link revoked successfully'
  });
});

module.exports = {
  getAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  duplicateAssessment,
  getAssessmentStats,
  togglePublish,
  assignAssessment,
  unassignAssessment,
  getMyAssignments,
  toggleMute,
  getPublicAssessment,
  generatePublicLink,
  revokePublicLink
};
