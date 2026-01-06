import { hasPermission, hasRole, canPerformAction } from '../services/rbacService.js';
import logger from '../config/logger.js';

/**
 * RBAC Middleware - Authorization middleware for routes
 */

/**
 * Require specific permission
 * Usage: requirePermission('post.delete.any')
 */
export const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - User not authenticated'
        });
      }

      const hasPermissionFlag = await hasPermission(userId, permissionName);

      if (!hasPermissionFlag) {
        logger.warn({
          message: 'Permission denied',
          userId,
          permission: permissionName,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          message: 'Forbidden - Insufficient permissions',
          required: permissionName
        });
      }

      next();
    } catch (error) {
      logger.error({
        message: 'Error in requirePermission middleware',
        error: error.message,
        permission: permissionName
      });
      next(error);
    }
  };
};

/**
 * Require specific role
 * Usage: requireRole('admin')
 */
export const requireRole = (roleName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - User not authenticated'
        });
      }

      const hasRoleFlag = await hasRole(userId, roleName);

      if (!hasRoleFlag) {
        logger.warn({
          message: 'Role check failed',
          userId,
          role: roleName,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          message: 'Forbidden - Insufficient role',
          required: roleName
        });
      }

      next();
    } catch (error) {
      logger.error({
        message: 'Error in requireRole middleware',
        error: error.message,
        role: roleName
      });
      next(error);
    }
  };
};

/**
 * Require one of multiple roles
 * Usage: requireAnyRole(['admin', 'moderator'])
 */
export const requireAnyRole = (roleNames) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - User not authenticated'
        });
      }

      // Check each role
      for (const roleName of roleNames) {
        const hasRoleFlag = await hasRole(userId, roleName);
        if (hasRoleFlag) {
          return next();
        }
      }

      logger.warn({
        message: 'Role check failed - none of required roles',
        userId,
        roles: roleNames,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient role',
        requiredAny: roleNames
      });
    } catch (error) {
      logger.error({
        message: 'Error in requireAnyRole middleware',
        error: error.message,
        roles: roleNames
      });
      next(error);
    }
  };
};

/**
 * Check action on resource with ownership
 * Usage: checkResourceAction('post', 'delete')
 * - Checks for permission like post.delete.any (moderator)
 * - Falls back to post.delete.own + ownership check
 */
export const checkResourceAction = (resource, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - User not authenticated'
        });
      }

      // Get resource ID from params or body
      const resourceId = req.params.id || req.params.postId || req.params.commentId || req.body.id;

      const canPerform = await canPerformAction(userId, action, resource, resourceId);

      if (!canPerform) {
        logger.warn({
          message: 'Resource action denied',
          userId,
          resource,
          action,
          resourceId,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          message: `Forbidden - Cannot ${action} ${resource}`,
          required: `${resource}.${action}`
        });
      }

      next();
    } catch (error) {
      logger.error({
        message: 'Error in checkResourceAction middleware',
        error: error.message,
        resource,
        action
      });
      next(error);
    }
  };
};

/**
 * Check if user's account is active
 */
export const requireActiveAccount = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not authenticated'
      });
    }

    // Note: account_status will be attached to req.user by authMiddleware
    if (user.account_status !== 'active') {
      logger.warn({
        message: 'Inactive account access attempt',
        userId: user.id,
        status: user.account_status
      });

      return res.status(403).json({
        success: false,
        message: 'Account is not active',
        status: user.account_status,
        reason: user.suspension_reason || undefined
      });
    }

    next();
  } catch (error) {
    logger.error({
      message: 'Error in requireActiveAccount middleware',
      error: error.message
    });
    next(error);
  }
};

/**
 * Admin-only routes
 */
export const adminOnly = requireRole('admin');

/**
 * Moderator or Admin routes
 */
export const moderatorOrAdmin = requireAnyRole(['moderator', 'admin']);

/**
 * Support staff routes
 */
export const supportStaff = requireAnyRole(['support', 'admin']);

export default {
  requirePermission,
  requireRole,
  requireAnyRole,
  checkResourceAction,
  requireActiveAccount,
  adminOnly,
  moderatorOrAdmin,
  supportStaff
};
