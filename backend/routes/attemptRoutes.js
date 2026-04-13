const express = require('express');
const router = express.Router();
const {
  getAttempts,
  getAttempt,
  getPublicAttempt,
  startAttempt,
  startInviteAttempt,
  saveAnswer,
  submitAttempt,
  autoSave,
  verifyPasscode,
  logProctoringEvent,
  requestReportAccess,
  abandonAttempt
} = require('../controllers/attemptController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');

// ============================================================
// PUBLIC ROUTES - Invite-based access only (no auth required)
// ============================================================

router.post('/invite/:token/start', optionalAuth, startInviteAttempt);
router.get('/public/attempt/:id', optionalAuth, getPublicAttempt);

// ============================================================
// PROTECTED ROUTES - Authentication required
// ============================================================

router.get('/', authMiddleware, paginationValidation, getAttempts);
router.get('/:id', authMiddleware, idParamValidation, getAttempt);
router.post('/assessments/:assessmentId/start', authMiddleware, startAttempt);
router.post('/assessments/:assessmentId/verify-passcode', authMiddleware, verifyPasscode);
router.post('/:id/answer', optionalAuth, idParamValidation, saveAnswer);
router.post('/:id/submit', optionalAuth, idParamValidation, submitAttempt);
router.post('/:id/abandon', authMiddleware, idParamValidation, abandonAttempt);
router.post('/:id/auto-save', optionalAuth, idParamValidation, autoSave);
router.post('/:id/proctoring-log', optionalAuth, idParamValidation, logProctoringEvent);
router.post('/:id/request-report', authMiddleware, idParamValidation, requestReportAccess);

module.exports = router;
