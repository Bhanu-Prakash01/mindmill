const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const {
  createInvite,
  getInvites,
  getInviteStats,
  getAssessmentInvites,
  cancelInvite,
  resendInvite
} = require('../controllers/inviteController');

// All routes require authentication
router.use(authMiddleware);

// Create invite (any authenticated user)
router.post('/', createInvite);

// Get invites list
router.get('/', getInvites);

// Get invite stats (admin only)
router.get('/stats', isAdmin, getInviteStats);

// Get invites for a specific assessment
router.get('/assessment/:assessmentId', getAssessmentInvites);

// Cancel invite
router.delete('/:id', cancelInvite);

// Resend invite email
router.post('/:id/resend', resendInvite);

module.exports = router;
