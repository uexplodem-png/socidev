import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { settingsService } from '../services/settingsService.js';
import logger from '../config/logger.js';

/**
 * Helmet security headers middleware
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
  },
});

/**
 * Authentication rate limiter
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
    });
    res.status(429).json({
      error: 'Too many authentication attempts',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for sensitive operations
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many attempts for this sensitive operation',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Maintenance mode middleware
 * Returns 503 for users when maintenance mode is enabled
 * Allows super_admin, admin, and moderator to bypass
 * Decodes JWT token to check user role before authentication middleware runs
 */
export async function maintenanceMode(req, res, next) {
  try {
    const isMaintenanceEnabled = await settingsService.get('maintenance.enabled', false);
    
    if (!isMaintenanceEnabled) {
      return next();
    }

    // Allow health check and admin routes always
    if (req.path === '/health' || req.path.startsWith('/api/admin/')) {
      return next();
    }

    // Allow login/register/verify endpoints so admins can login
    if (req.path === '/api/auth/login' || 
        req.path === '/api/auth/admin-login' || 
        req.path === '/api/auth/register' || 
        req.path === '/api/auth/verify') {
      return next();
    }

    // Check for JWT token and decode it to get user role
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Decode JWT token (without verification - just to check role)
        // The actual verification happens in auth middleware
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        
        // Allow super_admin, admin, and moderator to bypass maintenance
        if (payload.role === 'super_admin' || 
            payload.role === 'admin' || 
            payload.role === 'moderator') {
          logger.info('Maintenance mode bypassed by privileged user', {
            userId: payload.userId,
            role: payload.role,
            path: req.path
          });
          return next();
        }
      } catch (decodeError) {
        // If token decode fails, continue to block (better safe than sorry)
        logger.warn('Failed to decode token in maintenance mode', {
          error: decodeError.message,
          path: req.path
        });
      }
    }

    // Return 503 Service Unavailable for regular users
    logger.info('Maintenance mode blocked request', {
      ip: req.ip,
      path: req.path,
      hasAuth: !!authHeader
    });

    return res.status(503).json({
      error: 'Service temporarily unavailable for maintenance',
      code: 'MAINTENANCE_MODE',
      message: 'The service is currently undergoing maintenance. Please try again later.',
      maintenance: true,
    });
  } catch (error) {
    logger.error('Maintenance mode check failed:', error);
    // On error, allow request to proceed (fail open for availability)
    return next();
  }
}

/**
 * Feature flag middleware factory
 * Creates middleware to check if a feature module is enabled
 */
export function requireFeature(featureKey) {
  return async (req, res, next) => {
    try {
      const isEnabled = await settingsService.get(featureKey, true);
      
      if (!isEnabled) {
        logger.warn('Feature disabled', {
          feature: featureKey,
          userId: req.user?.id,
          ip: req.ip,
        });

        return res.status(403).json({
          error: 'This feature is currently disabled',
          code: 'FEATURE_DISABLED',
          feature: featureKey,
        });
      }

      next();
    } catch (error) {
      logger.error('Feature check failed:', error);
      // On error, allow request to proceed (fail open)
      next();
    }
  };
}

/**
 * CSRF token validation middleware (for form-based routes)
 */
export function validateCsrfToken(req, res, next) {
  const token = req.headers['x-csrf-token'] || req.body?._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      userId: req.user?.id,
    });

    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'CSRF_VALIDATION_FAILED',
    });
  }

  next();
}

/**
 * Input sanitization middleware
 * Prevents common injection attacks
 */
export function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove null bytes
        obj[key] = obj[key].replace(/\0/g, '');
        
        // Trim whitespace
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
}

export default {
  helmetMiddleware,
  authRateLimiter,
  apiRateLimiter,
  strictRateLimiter,
  maintenanceMode,
  requireFeature,
  validateCsrfToken,
  sanitizeInput,
};
