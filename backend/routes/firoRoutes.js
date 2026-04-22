const express = require('express');
const router = express.Router();
const {
  getFiroQuestions,
  submitFiro,
  getFiroConfig,
  getFiroResults
} = require('../controllers/firoController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

// Public route - FIRO-B results (works for invite-based attempts too)
router.get('/attempts/:attemptId/firo/results', optionalAuth, getFiroResults);

// Get FIRO-B questions (54 items)
router.get('/firo/questions', getFiroQuestions);

// Get FIRO-B configuration
router.get('/firo/config', getFiroConfig);

router.post('/public/submit', submitFiro);

// Submit route requires auth context to properly calculate test credits
router.use(authMiddleware);

// Submit FIRO-B responses
router.post('/assessments/:assessmentId/firo/submit', submitFiro);

module.exports = router;
