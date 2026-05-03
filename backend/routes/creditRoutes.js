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
const { isAdmin, isSuperAdmin } = require('../middleware/roleMiddleware');
const { creditRequestValidation, idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');
const { creditRequestLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);

router.get('/', getCredits);
router.get('/usage', isAdmin, paginationValidation, getCreditUsage);
router.get('/requests', isAdmin, paginationValidation, getCreditRequests);
router.get('/my-requests', isAdmin, paginationValidation, getMyCreditRequests);

router.post('/request', isAdmin, creditRequestLimiter, creditRequestValidation.create, requestCredits);

router.put('/requests/:id/approve', isSuperAdmin, idParamValidation, approveCreditRequest);
router.put('/requests/:id/reject', isSuperAdmin, idParamValidation, rejectCreditRequest);
router.put('/requests/:id/revoke', isSuperAdmin, idParamValidation, revokeCreditRequest);
router.put('/requests/:id/cancel', isAdmin, idParamValidation, cancelCreditRequest);
router.delete('/requests/:id', isSuperAdmin, idParamValidation, deleteCreditRequest);

module.exports = router;
