const express = require('express');
const router = express.Router();
const {
  submitBig5,
  getBig5Results,
  getBig5Analytics,
  getBig5Comparison,
  downloadBig5Report
} = require('../controllers/big5Controller');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { validateBig5Responses } = require('../middleware/big5Validation');

// Public route - Big5 results (works for invite-based attempts too)
router.get('/attempts/:attemptId/big5/results', optionalAuth, getBig5Results);
router.get('/attempts/:attemptId/big5-report/download', optionalAuth, downloadBig5Report);

// All other routes require authentication
router.use(authMiddleware);

// Submit Big5 assessment
router.post(
  '/assessments/:assessmentId/big5/submit',
  validateBig5Responses,
  submitBig5
);

// Get Big5 analytics (admin only)
router.get('/big5/analytics', isAdmin, getBig5Analytics);

// Get Big5 comparison data
router.get('/big5/comparison', getBig5Comparison);

module.exports = router;
