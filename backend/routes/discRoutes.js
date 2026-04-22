const express = require('express');
const router = express.Router();
const {
  submitDisc,
  getDiscResults,
  getDiscAnalytics,
  getDiscComparison,
  downloadDiscReport
} = require('../controllers/discController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// Public route - DISC results (works for invite-based attempts too)
router.get('/attempts/:attemptId/disc/results', optionalAuth, getDiscResults);
router.get('/attempts/:attemptId/disc-report/download', optionalAuth, downloadDiscReport);

// All other routes require authentication
router.use(authMiddleware);

// Submit DISC assessment
router.post(
  '/assessments/:assessmentId/disc/submit',
  submitDisc
);

// Get DISC analytics (admin only)
router.get('/disc/analytics', isAdmin, getDiscAnalytics);

// Get DISC comparison data
router.get('/disc/comparison', getDiscComparison);

module.exports = router;
