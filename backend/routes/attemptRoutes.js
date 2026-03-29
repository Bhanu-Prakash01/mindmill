const express = require('express');
const router = express.Router();
const {
  getAttempts,
  getAttempt,
  getPublicAttempt,
  startAttempt,
  startPublicAttempt,
  startInviteAttempt,
  saveAnswer,
  submitAttempt,
  autoSave,
  verifyPasscode,
  logProctoringEvent,
  requestReportAccess,
  abandonAttempt
} = require('../controllers/attemptController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');

// Public routes (no auth required)
router.post('/public/:assessmentId/start', startPublicAttempt);
router.post('/invite/:token/start', startInviteAttempt);
router.get('/public/attempt/:id', getPublicAttempt);

// Protected routes
router.use(authMiddleware);

router.get('/', paginationValidation, getAttempts);
router.get('/:id', idParamValidation, getAttempt);

router.post('/assessments/:assessmentId/start', startAttempt);
router.post('/assessments/:assessmentId/verify-passcode', verifyPasscode);
router.post('/:id/answer', idParamValidation, saveAnswer);
router.post('/:id/submit', idParamValidation, submitAttempt);
router.post('/:id/abandon', idParamValidation, abandonAttempt);
router.post('/:id/auto-save', idParamValidation, autoSave);
router.post('/:id/proctoring-log', idParamValidation, logProctoringEvent);
router.post('/:id/request-report', idParamValidation, requestReportAccess);

module.exports = router;
