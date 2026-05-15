const express = require('express');
const router = express.Router();
const {
  getCredits,
  requestCredits,
  getCreditRequests,
  getMyCreditRequests,
  approveCreditRequest,
  rejectCreditRequest,
  revokeCreditRequest,
  cancelCreditRequest,
  deleteCreditRequest,
  getCreditUsage
} = require('../controllers/creditController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin, isSuperAdmin, isAdminOrIndividual } = require('../middleware/roleMiddleware');
const { creditRequestValidation, idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');
const { creditRequestLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);

router.get('/', getCredits);
router.get('/usage', isAdmin, paginationValidation, getCreditUsage);
router.get('/requests', isAdmin, paginationValidation, getCreditRequests);

// Individual users AND admins can submit/view their own credit requests
router.get('/my-requests', isAdminOrIndividual, paginationValidation, getMyCreditRequests);
router.post('/request', isAdminOrIndividual, creditRequestLimiter, creditRequestValidation.create, requestCredits);

router.put('/requests/:id/approve', isSuperAdmin, idParamValidation, approveCreditRequest);
router.put('/requests/:id/reject', isSuperAdmin, idParamValidation, rejectCreditRequest);
router.put('/requests/:id/revoke', isSuperAdmin, idParamValidation, revokeCreditRequest);
router.put('/requests/:id/cancel', isAdminOrIndividual, idParamValidation, cancelCreditRequest);
router.delete('/requests/:id', isSuperAdmin, idParamValidation, deleteCreditRequest);

module.exports = router;
