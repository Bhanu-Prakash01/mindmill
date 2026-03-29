const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  refreshToken,
  getDemoOrganizations,
  getDemoUsers,
  demoLogin
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authValidation } = require('../middleware/validationMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Public demo routes
router.get('/demo/organizations', getDemoOrganizations);
router.get('/demo/organizations/:slug/users', getDemoUsers);
router.post('/demo/login', authLimiter, demoLogin);

// Public routes
router.post('/login', authLimiter, authValidation.login, login);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.post('/change-password', authMiddleware, authValidation.changePassword, changePassword);
router.post('/logout', authMiddleware, logout);
router.post('/refresh', authMiddleware, refreshToken);

module.exports = router;
