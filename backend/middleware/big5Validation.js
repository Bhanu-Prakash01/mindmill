/**
 * Big Five Personality Test (BFPT) Validation Middleware
 * Validates Big5 test submissions according to official requirements
 */

const { ApiError } = require('./errorHandler');

/**
 * Validate Big5 responses
 * - All 50 questions must be answered
 * - Values must be integers 1-5
 * - No partial submissions allowed
 */
const validateBig5Responses = (req, res, next) => {
  const { responses } = req.body;

  // Check if responses exist
  if (!responses || typeof responses !== 'object') {
    throw new ApiError(400, 'Big5 responses are required');
  }

  // Check all 50 questions are answered
  const missingQuestions = [];
  for (let i = 1; i <= 50; i++) {
    if (responses[i] === undefined || responses[i] === null) {
      missingQuestions.push(i);
    }
  }

  if (missingQuestions.length > 0) {
    throw new ApiError(400, `Missing answers for questions: ${missingQuestions.join(', ')}`);
  }

  // Validate each response is integer 1-5
  const invalidResponses = [];
  for (let i = 1; i <= 50; i++) {
    const value = responses[i];
    
    // Check if it's an integer
    if (!Number.isInteger(value)) {
      invalidResponses.push({ question: i, value, reason: 'Not an integer' });
      continue;
    }

    // Check range 1-5
    if (value < 1 || value > 5) {
      invalidResponses.push({ question: i, value, reason: 'Must be between 1 and 5' });
    }
  }

  if (invalidResponses.length > 0) {
    throw new ApiError(400, 'Invalid Big5 responses', { invalidResponses });
  }

  // Attach validated responses to request
  req.validatedBig5Responses = responses;
  next();
};

/**
 * Validate Big5 assessment creation/update
 * - Big5 assessments have locked structure
 * - Cannot modify question count
 * - Cannot change trait mappings
 */
const validateBig5Assessment = (req, res, next) => {
  const { category, isLockedStructure, isEditable } = req.body;

  if (category === 'big5') {
    // Force locked structure for Big5
    req.body.isLockedStructure = true;
    req.body.isEditable = false;
    req.body.totalQuestions = 50;
    
    // Big5 uses rating scale type questions
    req.body.questionType = 'rating';
    
    // Disable randomization for Big5 (order matters for scoring)
    req.body.randomizeQuestions = false;
    req.body.randomizeOptions = false;
  }

  next();
};

/**
 * Prevent modification of locked Big5 assessments
 */
const preventBig5Modification = async (req, res, next) => {
  const { Assessment } = require('../models');
  
  try {
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    // Check if this is a locked Big5 assessment
    if (assessment.category === 'big5' && assessment.isLockedStructure) {
      // Only allow certain fields to be updated
      const allowedFields = ['title', 'description', 'isPublished', 'isActive', 'passcode', 'requirePasscode', 'assignedUsers', 'assignedGroups'];
      const attemptedFields = Object.keys(req.body);
      
      const disallowedFields = attemptedFields.filter(field => !allowedFields.includes(field));
      
      if (disallowedFields.length > 0) {
        throw new ApiError(403, `Cannot modify locked Big5 assessment. Disallowed fields: ${disallowedFields.join(', ')}`);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate Big5 question operations
 * - Cannot add/remove questions from Big5
 * - Cannot modify Big5 question content
 */
const validateBig5QuestionOperation = async (req, res, next) => {
  const { Assessment } = require('../models');
  
  try {
    const assessment = await Assessment.findById(req.params.assessmentId || req.params.id);
    
    if (!assessment) {
      throw new ApiError(404, 'Assessment not found');
    }

    if (assessment.category === 'big5' && assessment.isLockedStructure) {
      throw new ApiError(403, 'Cannot modify questions of a locked Big5 assessment');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateBig5Responses,
  validateBig5Assessment,
  preventBig5Modification,
  validateBig5QuestionOperation
};
