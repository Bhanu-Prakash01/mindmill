const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  bulkCreateQuestions
} = require('../controllers/questionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { questionValidation, idParamValidation } = require('../middleware/validationMiddleware');

router.use(authMiddleware);

// Assessment-specific routes
router.get('/assessments/:assessmentId/questions', getQuestions);
router.post('/assessments/:assessmentId/questions', isAdmin, questionValidation.create, createQuestion);
router.post('/assessments/:assessmentId/questions/bulk', isAdmin, bulkCreateQuestions);
router.put('/assessments/:assessmentId/questions/reorder', isAdmin, reorderQuestions);

// Individual question routes
router.get('/questions/:id', idParamValidation, getQuestion);
router.put('/questions/:id', isAdmin, idParamValidation, updateQuestion);
router.delete('/questions/:id', isAdmin, idParamValidation, deleteQuestion);

module.exports = router;
