const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  getResources,
  getAllResources,
  createResource,
  updateResource,
  deleteResource
} = require('../controllers/resourceController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isSuperAdmin } = require('../middleware/roleMiddleware');

const uploadResource = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.use(authMiddleware);

router.get('/', getResources);
router.get('/all', isSuperAdmin, getAllResources);
router.post('/', isSuperAdmin, uploadResource.single('resourceFile'), createResource);
router.put('/:id', isSuperAdmin, uploadResource.single('resourceFile'), updateResource);
router.delete('/:id', isSuperAdmin, deleteResource);

module.exports = router;
