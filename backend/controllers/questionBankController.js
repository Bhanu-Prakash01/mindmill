const Question = require('../models/Question');
const Assessment = require('../models/Assessment');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

/**
 * Get all question banks (grouped by assessment/category)
 */
const getQuestionBanks = asyncHandler(async (req, res) => {
  const { category, dimension, search } = req.query;
  
  // Build query
  const query = {};
  if (category) query.category = category;
  if (dimension) query.dimension = dimension;
  if (search) {
    query.questionText = { $regex: search, $options: 'i' };
  }

  // Get unique assessments with questions
  const questionBanks = await Question.aggregate([
    { $match: query },
    {
      $lookup: {
        from: 'assessments',
        localField: 'assessment',
        foreignField: '_id',
        as: 'assessment'
      }
    },
    { $unwind: '$assessment' },
    {
      $group: {
        _id: '$assessment._id',
        title: { $first: '$assessment.title' },
        category: { $first: '$assessment.category' },
        dimension: { $first: '$dimension' },
        trait: { $first: '$trait' },
        questionCount: { $sum: 1 },
        minOrder: { $min: '$order' },
        maxOrder: { $max: '$order' },
        types: { $addToSet: '$type' },
        difficulties: { $addToSet: '$difficulty' }
      }
    },
    { $sort: { title: 1 } }
  ]);

  res.json({
    success: true,
    data: { questionBanks }
  });
});

/**
 * Get question sets (predefined groups of questions)
 */
const getQuestionSets = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  
  const questionSets = await Question.aggregate([
    { $match: { assessment: new require('mongoose').Types.ObjectId(assessmentId) } },
    {
      $group: {
        _id: '$dimension',
        name: { $first: '$dimension' },
        questionCount: { $sum: 1 },
        orders: { $push: '$order' },
        traits: { $addToSet: '$trait' }
      }
    },
    { $sort: { name: 1 } }
  ]);

  res.json({
    success: true,
    data: { questionSets }
  });
});

/**
 * Create a new question set (dimension/category group)
 */
const createQuestionSet = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { name, description, questions } = req.body;

  // Verify assessment exists
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    throw new ApiError(404, 'Assessment not found');
  }

  // Get max order for this dimension
  const maxOrderDoc = await Question.findOne(
    { assessment: assessmentId, dimension: name },
    { order: 1 },
    { sort: { order: -1 } }
  );
  const startOrder = maxOrderDoc ? maxOrderDoc.order + 1 : 1;

  // Create questions with the dimension
  const createdQuestions = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const question = await Question.create({
      assessment: assessmentId,
      type: q.type || 'mcq',
      questionText: q.questionText,
      options: q.options || [],
      statements: q.statements || [],
      dimension: name,
      trait: q.trait || '',
      category: q.category || '',
      order: startOrder + i,
      marks: q.marks || 1,
      difficulty: q.difficulty || 'moderate',
      isRequired: q.isRequired !== false,
      explanation: q.explanation || '',
      tags: q.tags || []
    });
    createdQuestions.push(question);
  }

  res.status(201).json({
    success: true,
    message: `Question set "${name}" created with ${createdQuestions.length} questions`,
    data: {
      questions: createdQuestions
    }
  });
});

/**
 * Get questions by set/dimension
 */
const getQuestionsBySet = asyncHandler(async (req, res) => {
  const { assessmentId, dimension } = req.params;
  
  const questions = await Question.find({
    assessment: assessmentId,
    dimension: dimension
  }).sort({ order: 1 });

  res.json({
    success: true,
    data: { questions }
  });
});

/**
 * Bulk import questions to a set
 */
const bulkImportQuestions = asyncHandler(async (req, res) => {
  const { assessmentId, dimension } = req.params;
  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError(400, 'Questions array is required');
  }

  // Get max order
  const maxOrderDoc = await Question.findOne(
    { assessment: assessmentId, dimension },
    { order: 1 },
    { sort: { order: -1 } }
  );
  const startOrder = maxOrderDoc ? maxOrderDoc.order + 1 : 1;

  // Add order and dimension to each question
  const questionsToCreate = questions.map((q, index) => ({
    ...q,
    assessment: assessmentId,
    dimension: dimension,
    order: startOrder + index
  }));

  const createdQuestions = await Question.insertMany(questionsToCreate);

  res.status(201).json({
    success: true,
    message: `Imported ${createdQuestions.length} questions to "${dimension}" set`,
    data: {
      questions: createdQuestions
    }
  });
});

/**
 * Delete a question set (all questions with specific dimension)
 */
const deleteQuestionSet = asyncHandler(async (req, res) => {
  const { assessmentId, dimension } = req.params;
  
  const result = await Question.deleteMany({
    assessment: assessmentId,
    dimension: dimension
  });

  res.json({
    success: true,
    message: `Deleted ${result.deletedCount} questions from set "${dimension}"`,
    data: {
      deletedCount: result.deletedCount
    }
  });
});

/**
 * Export question set (for sharing/reuse)
 */
const exportQuestionSet = asyncHandler(async (req, res) => {
  const { assessmentId, dimension } = req.params;
  
  const questions = await Question.find({
    assessment: assessmentId,
    dimension: dimension
  }).sort({ order: 1 });

  // Remove assessment-specific fields
  const exportedQuestions = questions.map(q => {
    const obj = q.toObject();
    delete obj._id;
    delete obj.assessment;
    delete obj.createdAt;
    delete obj.updatedAt;
    return obj;
  });

  res.json({
    success: true,
    data: {
      dimension,
      questionCount: exportedQuestions.length,
      questions: exportedQuestions
    }
  });
});

/**
 * Import question set from JSON
 */
const importQuestionSet = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const { dimension, questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError(400, 'Questions array is required');
  }

  // Get max order for this dimension in target assessment
  const maxOrderDoc = await Question.findOne(
    { assessment: assessmentId, dimension },
    { order: 1 },
    { sort: { order: -1 } }
  );
  const startOrder = maxOrderDoc ? maxOrderDoc.order + 1 : 1;

  // Prepare questions for insertion
  const questionsToInsert = questions.map((q, index) => ({
    ...q,
    assessment: assessmentId,
    dimension: dimension,
    order: startOrder + index
  }));

  const insertedQuestions = await Question.insertMany(questionsToInsert);

  res.status(201).json({
    success: true,
    message: `Imported ${insertedQuestions.length} questions to "${dimension}" set`,
    data: {
      questions: insertedQuestions
    }
  });
});

module.exports = {
  getQuestionBanks,
  getQuestionSets,
  createQuestionSet,
  getQuestionsBySet,
  bulkImportQuestions,
  deleteQuestionSet,
  exportQuestionSet,
  importQuestionSet
};
