const express = require('express');
const router = express.Router();
const {
  getQuestionBanks,
  getQuestionSets,
  createQuestionSet,
  getQuestionsBySet,
  bulkImportQuestions,
  deleteQuestionSet,
  exportQuestionSet,
  importQuestionSet
} = require('../controllers/questionBankController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isSuperAdmin } = require('../middleware/roleMiddleware');

// All question bank routes require super admin access
router.use(authMiddleware);
router.use(isSuperAdmin);

// Get all question banks (across all assessments)
router.get('/banks', getQuestionBanks);

// Assessment-specific question bank operations
router.get('/assessments/:assessmentId/sets', getQuestionSets);
router.post('/assessments/:assessmentId/sets', createQuestionSet);
router.get('/assessments/:assessmentId/sets/:dimension', getQuestionsBySet);
router.post('/assessments/:assessmentId/sets/:dimension/import', bulkImportQuestions);
router.delete('/assessments/:assessmentId/sets/:dimension', deleteQuestionSet);
router.get('/assessments/:assessmentId/sets/:dimension/export', exportQuestionSet);
router.post('/assessments/:assessmentId/import-set', importQuestionSet);

module.exports = router;
