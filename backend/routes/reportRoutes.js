const express = require('express');
const router = express.Router();
const {
  getReports,
  getReport,
  shareReport,
  getSharedReport,
  toggleVisibility,
  addAdminNotes,
  downloadReport,
  previewDiscReport,
  previewBig5Report
} = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');

// Public route for shared reports
router.get('/shared/:token', getSharedReport);

// Protected routes
router.use(authMiddleware);

router.get('/', paginationValidation, getReports);
router.get('/:id', idParamValidation, getReport);
router.get('/:id/download', idParamValidation, downloadReport);
router.post('/:id/share', idParamValidation, shareReport);

// Admin only routes
router.put('/:id/visibility', isAdmin, idParamValidation, toggleVisibility);
router.put('/:id/notes', isAdmin, idParamValidation, addAdminNotes);

// Preview routes (Admin only)
router.get('/preview/disc', authMiddleware, isAdmin, previewDiscReport);
router.get('/preview/big5', authMiddleware, isAdmin, previewBig5Report);

module.exports = router;
