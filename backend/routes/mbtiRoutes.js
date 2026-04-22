const express = require('express');
const router = express.Router();
const {
  submitMbti,
  getMbtiResults,
  getMbtiAnalytics,
  downloadMbtiReport
} = require('../controllers/mbtiController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.get('/attempts/:attemptId/mbti/results', optionalAuth, getMbtiResults);
router.get('/attempts/:attemptId/mbti-report/download', optionalAuth, downloadMbtiReport);

router.use(authMiddleware);

router.post(
  '/assessments/:assessmentId/mbti/submit',
  submitMbti
);

router.get('/mbti/analytics', isAdmin, getMbtiAnalytics);

module.exports = router;
