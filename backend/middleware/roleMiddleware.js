/**
 * Role-based access control middleware
 * Usage: roleMiddleware('admin', 'superadmin') - allows multiple roles
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

/**
 * Check if user has specific role
 */
const hasRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${role} role required.`
      });
    }

    next();
  };
};

/**
 * Check if user is superadmin
 */
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. SuperAdmin only.'
    });
  }

  next();
};

/**
 * Check if user is admin or superadmin
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

/**
 * Check if user belongs to the same organization
 * For admin: checks if resource belongs to their org
 * For superadmin: allows all
 */
const isSameOrganization = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // SuperAdmin can access all
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Admin and User must belong to an organization
  if (!req.user.organization) {
    return res.status(403).json({
      success: false,
      message: 'No organization assigned'
    });
  }

  // Store organization ID for use in controllers
  req.organizationId = req.user.organization._id.toString();
  
  next();
};

/**
 * Check if user owns the resource or is admin
 */
const isOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // SuperAdmin and Admin can access all
    if (['superadmin', 'admin'].includes(req.user.role)) {
      return next();
    }

    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (req.user._id.toString() !== resourceUserId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership',
        error: error.message
      });
    }
  };
};

module.exports = {
  roleMiddleware,
  hasRole,
  isSuperAdmin,
  isAdmin,
  isSameOrganization,
  isOwnerOrAdmin
};
