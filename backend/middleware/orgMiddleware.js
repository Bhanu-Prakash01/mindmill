const { Organization } = require('../models');

/**
 * Middleware to resolve organization from X-Org-Slug header
 * The frontend extracts the org slug from the URL path (/o/:slug/...)
 * and sends it as X-Org-Slug header on API requests.
 */
const resolveOrganization = async (req, res, next) => {
  try {
    const slug = req.headers['x-org-slug'];

    if (slug) {
      const organization = await Organization.findOne({
        slug: slug.toLowerCase().trim(),
        isActive: true
      });

      if (organization) {
        req.organization = organization;
      }
    }

    next();
  } catch (error) {
    // Don't fail the request if org resolution fails — just continue without org context
    next();
  }
};

/**
 * Middleware that requires a valid organization context
 * Must be used AFTER resolveOrganization middleware
 */
const requireOrganization = (req, res, next) => {
  if (!req.organization) {
    return res.status(400).json({
      success: false,
      message: 'Organization context required. Please access via your organization URL.'
    });
  }
  next();
};

module.exports = { resolveOrganization, requireOrganization };
