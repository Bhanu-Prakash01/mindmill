const express = require('express');
const router = express.Router();
const {
  getOrganizations,
  getOrganization,
  getMyOrganization,
  createOrganization,
  updateOrganization,
  updateBranding,
  updateLogo,
  updateBanner,
  updatePublicProfile,
  getPublicProfile,
  addCredits,
  deleteOrganization
} = require('../controllers/organizationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');
const { isAdmin, isSuperAdmin } = require('../middleware/roleMiddleware');
const { organizationValidation, idParamValidation, paginationValidation } = require('../middleware/validationMiddleware');
const { uploadLogo, uploadBanner } = require('../config/multer');

// Public route for viewing organization profile
router.get('/public/:slug', getPublicProfile);

// Protected routes
router.use(authMiddleware);

// Get my organization (for logged in user) - MUST be before /:id route
router.get('/my-organization', getMyOrganization);

// SuperAdmin only routes
router.get('/', isSuperAdmin, paginationValidation, getOrganizations);
router.post('/', isSuperAdmin, organizationValidation.create, createOrganization);
router.post('/:id/credits', isSuperAdmin, idParamValidation, addCredits);
router.delete('/:id', isSuperAdmin, idParamValidation, deleteOrganization);

// Admin and SuperAdmin routes
router.get('/:id', idParamValidation, getOrganization);
router.put('/:id', isAdmin, idParamValidation, organizationValidation.update, updateOrganization);
router.put('/:id/branding', isAdmin, idParamValidation, updateBranding);
router.put('/:id/logo', isAdmin, idParamValidation, uploadLogo.single('logo'), updateLogo);
router.put('/:id/banner', isAdmin, idParamValidation, uploadBanner.single('banner'), updateBanner);
router.put('/:id/public-profile', isAdmin, idParamValidation, updatePublicProfile);

module.exports = router;
