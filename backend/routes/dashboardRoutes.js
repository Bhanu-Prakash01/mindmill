const express = require('express');
const router = express.Router();
const {
  getSuperAdminDashboard,
  getAdminDashboard,
  getUserDashboard
} = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/superadmin', hasRole('superadmin'), getSuperAdminDashboard);
router.get('/admin', hasRole('admin'), getAdminDashboard);
router.get('/user', hasRole('user'), getUserDashboard);

module.exports = router;
