const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicket,
  createTicket,
  addResponse,
  updateStatus,
  assignTicket,
  getStats,
  getCoordinators
} = require('../controllers/supportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { supportTicketValidation, idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');
const { supportTicketLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);

router.get('/tickets', paginationValidation, getTickets);
router.get('/tickets/:id', idParamValidation, getTicket);
router.get('/stats', isAdmin, getStats);
router.get('/coordinators', isAdmin, getCoordinators);

router.post('/tickets', supportTicketLimiter, supportTicketValidation.create, createTicket);
router.post('/tickets/:id/respond', idParamValidation, addResponse);

router.put('/tickets/:id/status', isAdmin, idParamValidation, updateStatus);
router.put('/tickets/:id/assign', isAdmin, idParamValidation, assignTicket);

module.exports = router;
