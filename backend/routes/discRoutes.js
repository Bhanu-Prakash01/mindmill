const express = require('express');
const router = express.Router();
const {
  submitDisc,
  getDiscResults,
  getDiscAnalytics,
  getDiscComparison
} = require('../controllers/discController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Submit DISC assessment
router.post(
  '/assessments/:assessmentId/disc/submit',
  submitDisc
);

// Get DISC results for an attempt
router.get('/attempts/:attemptId/disc/results', getDiscResults);

// Get DISC analytics (admin only)
router.get('/disc/analytics', isAdmin, getDiscAnalytics);

// Get DISC comparison data
router.get('/disc/comparison', getDiscComparison);

module.exports = router;
