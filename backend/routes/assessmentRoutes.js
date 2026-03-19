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
  generatePublicLink,
  revokePublicLink
} = require('../controllers/assessmentController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin, isSuperAdmin } = require('../middleware/roleMiddleware');
const { assessmentValidation, idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');

// Public route - no auth required
router.get('/public/:token', getPublicAssessment);

// Protected routes
router.use(authMiddleware);

router.get('/', paginationValidation, getAssessments);
router.get('/my-assignments', paginationValidation, getMyAssignments);
router.get('/:id', idParamValidation, getAssessment);
router.get('/:id/stats', isAdmin, idParamValidation, getAssessmentStats);

// SuperAdmin only routes for test creation
router.post('/', isSuperAdmin, assessmentValidation.create, createAssessment);
router.post('/:id/duplicate', isSuperAdmin, idParamValidation, duplicateAssessment);
router.put('/:id', isSuperAdmin, idParamValidation, assessmentValidation.update, updateAssessment);
router.delete('/:id', isSuperAdmin, idParamValidation, deleteAssessment);

// Admin can manage (publish, assign, mute, public links)
router.patch('/:id/toggle-publish', isAdmin, idParamValidation, togglePublish);
router.patch('/:id/toggle-mute', isAdmin, idParamValidation, toggleMute);
router.post('/:id/assign', isAdmin, idParamValidation, assignAssessment);
router.post('/:id/unassign', isAdmin, idParamValidation, unassignAssessment);
router.post('/:id/generate-link', isAdmin, idParamValidation, generatePublicLink);
router.delete('/:id/revoke-link', isAdmin, idParamValidation, revokePublicLink);

module.exports = router;
