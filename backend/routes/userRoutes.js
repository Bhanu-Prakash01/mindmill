const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleStatus,
  assignAssessment,
  removeAssessment,
  getUserAssessments,
  bulkCreateUsers
} = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin, isSuperAdmin, isSameOrganization } = require('../middleware/roleMiddleware');
const { userValidation, idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Routes accessible by Admin and SuperAdmin
router.get('/', isAdmin, paginationValidation, getUsers);
router.post('/', isAdmin, userValidation.create, createUser);
router.patch('/:id/toggle-status', isAdmin, idParamValidation, toggleStatus);
router.post('/bulk-upload', isAdmin, bulkCreateUsers);

// Routes accessible by Admin, SuperAdmin, or the user themselves
router.get('/:id', idParamValidation, getUser);
router.put('/:id', idParamValidation, userValidation.update, updateUser);
router.get('/:id/assessments', idParamValidation, getUserAssessments);

// Admin only routes
router.delete('/:id', isAdmin, idParamValidation, deleteUser);
router.post('/:id/assign-assessment', isAdmin, idParamValidation, assignAssessment);
router.delete('/:id/assign-assessment/:assessmentId', isAdmin, idParamValidation, removeAssessment);

module.exports = router;
