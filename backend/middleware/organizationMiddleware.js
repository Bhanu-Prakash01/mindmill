const { Organization } = require('../models');

/**
 * Middleware to validate and attach organization context
 * Ensures the organization exists and is active
 */
const validateOrganization = async (req, res, next) => {
  try {
    const orgId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
    
    if (!orgId) {
      // If no orgId provided, use user's organization (for non-superadmin)
      if (req.user && req.user.organization) {
        req.organizationId = req.user.organization._id.toString();
        req.organization = req.user.organization;
        return next();
      }
      
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    // SuperAdmin can access any organization
    if (req.user.role === 'superadmin') {
      const organization = await Organization.findById(orgId);
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      req.organizationId = orgId;
      req.organization = organization;
      return next();
    }

    // Admin and User can only access their own organization
    if (req.user.organization && req.user.organization._id.toString() === orgId) {
      req.organizationId = orgId;
      req.organization = req.user.organization;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own organization.'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error validating organization',
      error: error.message
    });
  }
};

/**
 * Middleware to check if organization has available credits
 */
const checkCredits = async (req, res, next) => {
  try {
    const organization = req.organization || req.user.organization;
    
    if (!organization) {
      return res.status(400).json({
        success: false,
        message: 'Organization not found'
      });
    }

    const remainingCredits = organization.credits.total - organization.credits.used;
    
    if (remainingCredits <= 0) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient credits. Please request more credits.',
        credits: {
          total: organization.credits.total,
          used: organization.credits.used,
          remaining: remainingCredits
        }
      });
    }

    // Check if credits have expired
    if (organization.credits.expiryDate && new Date(organization.credits.expiryDate) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Credits have expired. Please request new credits.',
        expiryDate: organization.credits.expiryDate
      });
    }

    req.availableCredits = remainingCredits;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking credits',
      error: error.message
    });
  }
};

/**
 * Middleware to check organization subscription status
 */
const checkSubscription = async (req, res, next) => {
  try {
    const organization = req.organization || req.user.organization;
    
    if (!organization) {
      return res.status(400).json({
        success: false,
        message: 'Organization not found'
      });
    }

    if (organization.subscription.status === 'expired') {
      return res.status(403).json({
        success: false,
        message: 'Subscription has expired. Please renew your subscription.'
      });
    }

    if (organization.subscription.status === 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Subscription has been cancelled.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription',
      error: error.message
    });
  }
};

module.exports = {
  validateOrganization,
  checkCredits,
  checkSubscription
};
