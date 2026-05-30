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

// Image upload for questions
const { uploadQuestionImage } = require('../config/multer');
const { uploadFile } = require('../services/cloudinaryUploadService');
router.post('/upload-image', isAdmin, uploadQuestionImage.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  try {
    const result = await uploadFile(req.file.buffer, { folder: 'mindmill/question-images/' });
    res.json({ success: true, data: { imageUrl: result.url, publicId: result.publicId } });
  } catch (error) {
    console.error('Question image upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});

module.exports = router;
