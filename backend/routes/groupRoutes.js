const express = require('express');
const router = express.Router();
const {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMembers,
  addContacts,
  removeContact,
  updateContact
} = require('../controllers/groupController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Group CRUD — all authenticated users
router.get('/', paginationValidation, getGroups);
router.get('/:id', idParamValidation, getGroup);
router.post('/', createGroup);
router.put('/:id', idParamValidation, updateGroup);
router.delete('/:id', idParamValidation, deleteGroup);

// Team members (admin-only)
router.post('/:id/members', isAdmin, idParamValidation, addMembers);
router.delete('/:id/members', isAdmin, idParamValidation, removeMembers);

// Contacts (owner or admin)
router.post('/:id/contacts', idParamValidation, addContacts);
router.put('/:id/contacts/:contactId', idParamValidation, updateContact);
router.delete('/:id/contacts/:contactId', idParamValidation, removeContact);

module.exports = router;
