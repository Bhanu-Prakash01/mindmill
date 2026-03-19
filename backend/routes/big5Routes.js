const express = require('express');
const router = express.Router();
const {
  submitBig5,
  getBig5Results,
  getBig5Analytics,
  getBig5Comparison
} = require('../controllers/big5Controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateBig5Responses } = require('../middleware/big5Validation');

// All routes require authentication
router.use(authMiddleware);

// Submit Big5 assessment
router.post(
  '/assessments/:assessmentId/big5/submit',
  validateBig5Responses,
  submitBig5
);

// Get Big5 results for an attempt
router.get('/attempts/:attemptId/big5/results', getBig5Results);

// Get Big5 analytics (admin only)
router.get('/big5/analytics', isAdmin, getBig5Analytics);

// Get Big5 comparison data
router.get('/big5/comparison', getBig5Comparison);

module.exports = router;
