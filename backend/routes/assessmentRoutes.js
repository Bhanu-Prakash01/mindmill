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
  getAssessmentByInviteToken,
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
const { uploadBanner } = require('../config/multer');

// Public route - invite-based access (no auth required)
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

router.post('/:id/upload-banner', isSuperAdmin, idParamValidation, uploadBanner.single('banner'), async (req, res) => {
  const { Assessment } = require('../models');
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) {
    return res.status(404).json({ success: false, message: 'Assessment not found' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  assessment.bannerImage = req.file.path;
  await assessment.save();
  res.json({ success: true, data: { bannerUrl: '/' + assessment.bannerImage } });
});

router.delete('/:id/banner', isSuperAdmin, idParamValidation, async (req, res) => {
  const fs = require('fs');
  const { Assessment } = require('../models');
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) {
    return res.status(404).json({ success: false, message: 'Assessment not found' });
  }
  if (assessment.bannerImage) {
    fs.unlink(assessment.bannerImage, () => {});
    assessment.bannerImage = null;
    await assessment.save();
  }
  res.json({ success: true, message: 'Banner removed' });
});

// Admin can manage (publish, assign, mute)
router.patch('/:id/toggle-publish', isAdmin, idParamValidation, togglePublish);
router.patch('/:id/toggle-mute', isAdmin, idParamValidation, toggleMute);
router.post('/:id/unlock', isAdmin, idParamValidation, unlockAssessment);
router.post('/:id/refund-unattempted', isAdmin, idParamValidation, refundUnattempted);
router.post('/:id/assign', isAdmin, idParamValidation, assignAssessment);
router.post('/:id/unassign', isAdmin, idParamValidation, unassignAssessment);

// Member allocation routes (Admin)
router.post('/:id/allocate', isAdmin, idParamValidation, allocateToMembers);
router.get('/:id/allocations', isAdmin, idParamValidation, getAllocations);
router.delete('/:id/allocations/:allocId', isAdmin, idParamValidation, removeAllocation);

// Member's own allocation view (any authenticated user)
router.get('/:id/my-allocation', idParamValidation, getMyAllocation);

module.exports = router;
