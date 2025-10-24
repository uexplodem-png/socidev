import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import logger from '../config/logger.js';

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

  if (!['admin', 'super_admin'].includes(req.user.role)) {
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

// Check specific permissions
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    // Super admin has all permissions
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Define role permissions
    const rolePermissions = {
      admin: [
        'users.view', 'users.edit', 'users.create', 'users.suspend',
        'orders.view', 'orders.edit', 'orders.refund',
        'tasks.view', 'tasks.approve', 'tasks.reject',
        'transactions.view', 'transactions.create', 'transactions.approve', 'transactions.reject',
        'withdrawals.view', 'withdrawals.process',
        'audit.view',
        'settings.view', 'settings.edit',
      ],
      user: ['profile.view', 'profile.edit'],
    };

    const userPermissions = rolePermissions[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: `Permission '${permission}' required`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
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

export default {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
  requirePermission,
  optionalAuth,
};