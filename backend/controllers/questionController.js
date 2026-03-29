const { Question, Assessment } = require('../models');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * @desc    Get all questions for an assessment
 * @route   GET /api/assessments/:assessmentId/questions
 * @access  Private
 */
const getQuestions = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;

  const assessment = await Assessment.findById(assessmentId);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization && req.user.organization &&
      assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  const questions = await Question.find({ assessment: assessmentId })
    .sort({ order: 1 });

  res.json({
    success: true,
    data: { questions }
  });
});

/**
 * @desc    Get single question
 * @route   GET /api/questions/:id
 * @access  Private
 */
const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('assessment', 'title organization');

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (question.assessment.organization && req.user.organization &&
      question.assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  res.json({
    success: true,
    data: { question }
  });
});

/**
 * @desc    Create new question
 * @route   POST /api/assessments/:assessmentId/questions
 * @access  Private (Admin, SuperAdmin)
 */
const createQuestion = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const {
    type,
    questionText,
    questionImage,
    options,
    statements,
    difficulty,
    category,
    subCategory,
    dimension,
    trait,
    order,
    marks,
    negativeMarks,
    timeLimit,
    isRequired,
    explanation,
    tags
  } = req.body;

  const assessment = await Assessment.findById(assessmentId);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization && req.user.organization &&
      assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // If order not specified, add to end
  let questionOrder = order;
  if (!questionOrder) {
    const lastQuestion = await Question.findOne({ assessment: assessmentId })
      .sort({ order: -1 });
    questionOrder = lastQuestion ? lastQuestion.order + 1 : 1;
  }

  const question = await Question.create({
    assessment: assessmentId,
    type,
    questionText,
    questionImage,
    options,
    statements,
    difficulty,
    category,
    subCategory,
    dimension,
    trait,
    order: questionOrder,
    marks: marks || 1,
    negativeMarks: negativeMarks || 0,
    timeLimit,
    isRequired: isRequired !== undefined ? isRequired : true,
    explanation,
    tags
  });

  // Add question to assessment
  assessment.questions.push(question._id);
  assessment.totalQuestions = assessment.questions.length;
  await assessment.save();

  res.status(201).json({
    success: true,
    message: 'Question created successfully',
    data: { question }
  });
});

/**
 * @desc    Update question
 * @route   PUT /api/questions/:id
 * @access  Private (Admin, SuperAdmin)
 */
const updateQuestion = asyncHandler(async (req, res) => {
  let question = await Question.findById(req.params.id)
    .populate('assessment', 'organization');

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (question.assessment.organization && req.user.organization &&
      question.assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  const updateFields = [
    'type', 'questionText', 'questionImage', 'options', 'statements', 'difficulty',
    'category', 'subCategory', 'dimension', 'trait', 'order', 'marks',
    'negativeMarks', 'timeLimit', 'isRequired', 'explanation', 'tags'
  ];

  const updateData = {};
  updateFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  question = await Question.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Question updated successfully',
    data: { question }
  });
});

/**
 * @desc    Delete question
 * @route   DELETE /api/questions/:id
 * @access  Private (Admin, SuperAdmin)
 */
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('assessment', 'organization questions');

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (question.assessment.organization && req.user.organization &&
      question.assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Remove question from assessment
  const assessment = await Assessment.findById(question.assessment._id);
  assessment.questions = assessment.questions.filter(
    q => q.toString() !== question._id.toString()
  );
  assessment.totalQuestions = assessment.questions.length;
  await assessment.save();

  await question.deleteOne();

  res.json({
    success: true,
    message: 'Question deleted successfully'
  });
});

/**
 * @desc    Reorder questions
 * @route   PUT /api/assessments/:assessmentId/questions/reorder
 * @access  Private (Admin, SuperAdmin)
 */
const reorderQuestions = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { questionOrders } = req.body; // Array of { questionId, order }

  const assessment = await Assessment.findById(assessmentId);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization && req.user.organization &&
      assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Update order for each question
  await Promise.all(
    questionOrders.map(async ({ questionId, order }) => {
      await Question.findByIdAndUpdate(questionId, { order });
    })
  );

  const questions = await Question.find({ assessment: assessmentId })
    .sort({ order: 1 });

  res.json({
    success: true,
    message: 'Questions reordered successfully',
    data: { questions }
  });
});

/**
 * @desc    Bulk create questions
 * @route   POST /api/assessments/:assessmentId/questions/bulk
 * @access  Private (Admin, SuperAdmin)
 */
const bulkCreateQuestions = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { questions } = req.body;

  const assessment = await Assessment.findById(assessmentId);

  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Check permissions
  if (req.user.role !== 'superadmin') {
    if (assessment.organization && req.user.organization &&
      assessment.organization.toString() !== req.user.organization._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }
  }

  // Get starting order
  const lastQuestion = await Question.findOne({ assessment: assessmentId })
    .sort({ order: -1 });
  let startOrder = lastQuestion ? lastQuestion.order + 1 : 1;

  // Create questions
  const createdQuestions = await Promise.all(
    questions.map(async (q, index) => {
      const question = await Question.create({
        assessment: assessmentId,
        ...q,
        order: startOrder + index
      });
      return question;
    })
  );

  // Add questions to assessment
  assessment.questions.push(...createdQuestions.map(q => q._id));
  assessment.totalQuestions = assessment.questions.length;
  await assessment.save();

  res.status(201).json({
    success: true,
    message: `${createdQuestions.length} questions created successfully`,
    data: { questions: createdQuestions }
  });
});

module.exports = {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  bulkCreateQuestions
};
