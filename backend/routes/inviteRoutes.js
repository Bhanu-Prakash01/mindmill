const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  createInvite,
  getInvites,
  getInviteStats,
  getMyInviteStats,
  getAssessmentInvites,
  cancelInvite,
  resendInvite
} = require('../controllers/inviteController');
const {
  bulkUploadInvites,
  exportTemplate,
  exportInvites
} = require('../controllers/bulkInviteController');

// All routes require authentication
router.use(authMiddleware);

// Create invite (any authenticated user)
router.post('/', createInvite);

// Bulk upload invites from CSV/XLSX
router.post('/bulk-upload', upload.single('file'), bulkUploadInvites);

// Export template CSV
router.get('/template', exportTemplate);

// Export invites as CSV/XLSX
router.get('/export', exportInvites);

// Get invites list
router.get('/', getInvites);

// Get invite stats (admin only - org-wide)
router.get('/stats', isAdmin, getInviteStats);

// Get my invite stats (user - their own invites only)
router.get('/my-stats', getMyInviteStats);

// Get invites for a specific assessment
router.get('/assessment/:assessmentId', getAssessmentInvites);

// Cancel invite
router.delete('/:id', cancelInvite);

// Resend invite email
router.post('/:id/resend', resendInvite);

module.exports = router;
