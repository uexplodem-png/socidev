import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import logger from '../config/logger.js';
import { permissionsService } from '../services/permissionsService.js';
import { hasAdminPermission } from '../services/adminPermissionService.js';

// Verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    logger.info('Token validation attempt', { 
      hasAuthHeader: !!authHeader,
      authHeader: authHeader,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
      userAgent: req.headers['user-agent'],
      url: req.url
    });

    if (!token) {
      logger.warn('Token validation failed: No token provided');
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING',
      });
    }

    // Check if token looks like a valid JWT
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      logger.warn('Token validation failed: Invalid token format', { tokenPreview: token.substring(0, 50) });
      return res.status(401).json({
        error: 'Invalid token format',
        code: 'TOKEN_INVALID_FORMAT',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password', 'refresh_token'] },
    });

    if (!user) {
      logger.warn('Token validation failed: User not found', { userId: decoded.userId });
      return res.status(401).json({
        error: 'Invalid token - user not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.status !== 'active') {
      logger.warn('Token validation failed: Account not active', { userId: user.id, status: user.status });
      return res.status(403).json({
        error: 'Account is not active',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', { 
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'TOKEN_INVALID',
      });
    }

    return res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
};

// Verify admin role
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  // Allow admin, super_admin, and moderator roles
  if (!['admin', 'super_admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  }

  next();
};

// Verify super admin role
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Super admin access required',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  }

  next();
};

// Check specific permissions using RBAC
// DEPRECATED: Legacy permission check - now redirects to requireAdminPermission
// Kept for backward compatibility but uses the new admin permission system
export const requirePermission = (permissionKey) => {
  // Simply redirect to the new admin permission system
  return requireAdminPermission(permissionKey);
};

// Optional authentication (for public endpoints that can benefit from user context)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password', 'refresh_token'] },
      });

      if (user && user.status === 'active') {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    logger.debug('Optional auth failed:', error.message);
  }

  next();
};

/**
 * Middleware to authorize specific roles (Legacy - kept for backward compatibility)
 * @param {...string} allowedRoles - Allowed roles (e.g., 'admin', 'super_admin')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Role authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles
      });
    }

    next();
  };
};

/**
 * NEW: Dynamic middleware to check admin permissions from database
 * @param {string} permissionKey - Permission key to check (e.g., 'users.edit', 'balance.adjust')
 */
export const requireAdminPermission = (permissionKey) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    
    // Check if role is an admin role
    if (!['super_admin', 'admin', 'moderator'].includes(userRole)) {
      logger.warn('Non-admin role attempted admin action', {
        userId: req.user.id,
        userRole,
        requiredPermission: permissionKey
      });
      return res.status(403).json({
        error: 'Admin role required',
        code: 'ADMIN_ROLE_REQUIRED'
      });
    }

    try {
      // Check permission from database
      const hasPermission = await hasAdminPermission(userRole, permissionKey);

      if (!hasPermission) {
        logger.warn('Admin permission check failed', {
          userId: req.user.id,
          userRole,
          permissionKey,
          hasPermission: false
        });
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissionKey,
          role: userRole
        });
      }

      logger.debug('Admin permission check passed', {
        userId: req.user.id,
        userRole,
        permissionKey
      });

      next();
    } catch (error) {
      logger.error('Error checking admin permission', {
        userId: req.user.id,
        userRole,
        permissionKey,
        error: error.message
      });
      return res.status(500).json({
        error: 'Permission check failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

export default {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
  requirePermission,
  optionalAuth,
  authorizeRoles,
  requireAdminPermission,
};