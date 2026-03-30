const express = require('express');
const router = express.Router();
const {
  getAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  duplicateAssessment,
  getAssessmentStats,
  togglePublish,
  assignAssessment,
  unassignAssessment,
  getMyAssignments,
  toggleMute,
  getPublicAssessment,
  getAssessmentByInviteToken,
  generatePublicLink,
  revokePublicLink,
  unlockAssessment,
  refundUnattempted,
  getAssessmentPurchases,
  allocateToMembers,
  getAllocations,
  removeAllocation,
  getMyAllocation
} = require('../controllers/assessmentController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin, isSuperAdmin } = require('../middleware/roleMiddleware');
const { assessmentValidation, idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');

// Public route - no auth required
router.get('/public/:token', getPublicAssessment);
router.get('/invite/:token', getAssessmentByInviteToken);

// Protected routes
router.use(authMiddleware);

router.get('/', paginationValidation, getAssessments);
router.get('/my-assignments', paginationValidation, getMyAssignments);
router.get('/:id', idParamValidation, getAssessment);
router.get('/:id/stats', isAdmin, idParamValidation, getAssessmentStats);

// SuperAdmin only routes for test creation and purchases view
router.get('/:id/purchases', isSuperAdmin, idParamValidation, getAssessmentPurchases);
router.post('/', isSuperAdmin, assessmentValidation.create, createAssessment);
router.post('/:id/duplicate', isSuperAdmin, idParamValidation, duplicateAssessment);
router.put('/:id', isSuperAdmin, idParamValidation, assessmentValidation.update, updateAssessment);
router.delete('/:id', isSuperAdmin, idParamValidation, deleteAssessment);

// Admin can manage (publish, assign, mute, public links)
router.patch('/:id/toggle-publish', isAdmin, idParamValidation, togglePublish);
router.patch('/:id/toggle-mute', isAdmin, idParamValidation, toggleMute);
router.post('/:id/unlock', isAdmin, idParamValidation, unlockAssessment);
router.post('/:id/refund-unattempted', isAdmin, idParamValidation, refundUnattempted);
router.post('/:id/assign', isAdmin, idParamValidation, assignAssessment);
router.post('/:id/unassign', isAdmin, idParamValidation, unassignAssessment);
router.post('/:id/generate-link', isAdmin, idParamValidation, generatePublicLink);
router.delete('/:id/revoke-link', isAdmin, idParamValidation, revokePublicLink);

// Member allocation routes (Admin)
router.post('/:id/allocate', isAdmin, idParamValidation, allocateToMembers);
router.get('/:id/allocations', isAdmin, idParamValidation, getAllocations);
router.delete('/:id/allocations/:allocId', isAdmin, idParamValidation, removeAllocation);

// Member's own allocation view (any authenticated user)
router.get('/:id/my-allocation', idParamValidation, getMyAllocation);

module.exports = router;
