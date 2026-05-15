const express = require('express');
const router = express.Router();
const {
  getStandardQueries,
  getAllStandardQueries,
  createStandardQuery,
  updateStandardQuery,
  deleteStandardQuery,
  seedDefaultQueries,
  getComplaintTypes,
  createComplaintType,
  deleteComplaintType
} = require('../controllers/settingsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isSuperAdmin } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Public to all authenticated users - get active queries
router.get('/standard-queries', getStandardQueries);

// SuperAdmin only routes
router.get('/standard-queries/all', isSuperAdmin, getAllStandardQueries);
router.post('/standard-queries', isSuperAdmin, createStandardQuery);
router.post('/standard-queries/seed', isSuperAdmin, seedDefaultQueries);
router.put('/standard-queries/:id', isSuperAdmin, updateStandardQuery);
router.delete('/standard-queries/:id', isSuperAdmin, deleteStandardQuery);

// Complaint type routes
router.get('/complaint-types', getComplaintTypes);
router.post('/complaint-types', isSuperAdmin, createComplaintType);
router.delete('/complaint-types/:id', isSuperAdmin, deleteComplaintType);

module.exports = router;
