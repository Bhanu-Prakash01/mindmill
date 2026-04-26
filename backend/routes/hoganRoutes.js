const express = require('express');
const router = express.Router();
const { 
  submitHogan, 
  getHoganResults, 
  startHogan, 
  saveHoganProgress,
  getHoganAnalytics,
  submitHoganPublic,
  downloadHoganPdf
} = require('../controllers/hoganController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// Public routes (with token)
router.get('/attempts/:attemptId/hogan/results', optionalAuth, getHoganResults);
router.post('/assessments/invite/:token/hogan/submit', submitHoganPublic);

// Protected routes
router.use(authMiddleware);

router.post('/assessments/:assessmentId/hogan/start', startHogan);

router.post('/assessments/:assessmentId/hogan/submit', submitHogan);

router.put('/attempts/:attemptId/hogan/progress', saveHoganProgress);

router.get('/hogan/analytics', isAdmin, getHoganAnalytics);

router.get('/attempts/:attemptId/hogan-report/download', downloadHoganPdf);

module.exports = router;