const express = require('express');
const router = express.Router();
const {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMembers
} = require('../controllers/groupController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');

router.use(authMiddleware);
router.use(isAdmin);

router.get('/', paginationValidation, getGroups);
router.get('/:id', idParamValidation, getGroup);
router.post('/', createGroup);
router.put('/:id', idParamValidation, updateGroup);
router.delete('/:id', idParamValidation, deleteGroup);
router.post('/:id/members', idParamValidation, addMembers);
router.delete('/:id/members', idParamValidation, removeMembers);

module.exports = router;
