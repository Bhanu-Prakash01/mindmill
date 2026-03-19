const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * Auth validation rules
 */
const authValidation = {
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
    handleValidationErrors
  ]
};

/**
 * User validation rules
 */
const userValidation = {
  create: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required'),
    body('lastName')
      .optional()
      .trim(),
    body('role')
      .optional()
      .isIn(['admin', 'user'])
      .withMessage('Role must be admin or user'),
    handleValidationErrors
  ],
  
  update: [
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('firstName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('First name cannot be empty'),
    body('lastName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Last name cannot be empty'),
    handleValidationErrors
  ]
};

/**
 * Organization validation rules
 */
const organizationValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Organization name is required'),
    body('slug')
      .trim()
      .notEmpty()
      .matches(/^[a-z0-9-]+$/)
      .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
    handleValidationErrors
  ],
  
  update: [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Organization name cannot be empty'),
    handleValidationErrors
  ]
};

/**
 * Assessment validation rules
 */
const assessmentValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Assessment title is required'),
    body('category')
      .isIn(['psychometric', 'cognitive', 'situational', 'professional', 'big5', 'disc'])
      .withMessage('Invalid category'),
    body('difficulty')
      .optional()
      .isIn(['basic', 'moderate', 'tough'])
      .withMessage('Invalid difficulty level'),
    handleValidationErrors
  ],
  
  update: [
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Title cannot be empty'),
    handleValidationErrors
  ]
};

/**
 * Question validation rules
 */
const questionValidation = {
  create: [
    body('questionText')
      .trim()
      .notEmpty()
      .withMessage('Question text is required'),
    body('type')
      .isIn(['mcq', 'text', 'image', 'graphic', 'rating', 'matrix', 'disc-ranking'])
      .withMessage('Invalid question type'),
    body('options')
      .optional()
      .isArray()
      .withMessage('Options must be an array'),
    handleValidationErrors
  ]
};

/**
 * Credit request validation rules
 */
const creditRequestValidation = {
  create: [
    body('creditsRequested')
      .isInt({ min: 1 })
      .withMessage('Credits requested must be at least 1'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Reason is required'),
    handleValidationErrors
  ]
};

/**
 * Support ticket validation rules
 */
const supportTicketValidation = {
  create: [
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required'),
    body('category')
      .optional()
      .isIn(['technical', 'billing', 'general', 'complaint', 'feature_request', 'assessment_issue'])
      .withMessage('Invalid category'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    handleValidationErrors
  ]
};

/**
 * ID parameter validation
 */
const idParamValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

/**
 * Pagination validation
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  authValidation,
  userValidation,
  organizationValidation,
  assessmentValidation,
  questionValidation,
  creditRequestValidation,
  supportTicketValidation,
  idParamValidation,
  paginationValidation
};
