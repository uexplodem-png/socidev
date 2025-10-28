/**
 * Settings Enforcement Middleware
 * 
 * Provides middleware and helpers to enforce system settings across the application.
 * Checks feature flags, limits, policies, and mode requirements.
 */

import { settingsService } from '../services/settingsService.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';

/**
 * Enforce a feature flag from settings
 * @param {string} featureKey - The settings key for the feature (e.g., 'features.transactions.moduleEnabled')
 * @param {string} errorMessage - Custom error message if disabled
 * @returns {Function} Express middleware
 */
export function enforceFeatureFlag(featureKey, errorMessage = 'This feature is currently disabled') {
  return async (req, res, next) => {
    try {
      const isEnabled = await settingsService.get(featureKey, true);
      
      if (!isEnabled) {
        logger.warn(`Feature flag check failed: ${featureKey}`, {
          userId: req.user?.id,
          path: req.path,
          method: req.method
        });
        
        return res.status(403).json({
          success: false,
          code: 'FEATURE_DISABLED',
          message: errorMessage,
          feature: featureKey
        });
      }
      
      next();
    } catch (error) {
      logger.error(`Error checking feature flag ${featureKey}:`, error);
      next(error);
    }
  };
}

/**
 * Enforce a numeric limit from settings
 * @param {string} limitKey - The settings key for the limit (e.g., 'limits.maxTasksPerUser')
 * @param {Function} getCurrentValue - Function to get current value (e.g., count of tasks)
 * @param {string} errorMessage - Custom error message if limit exceeded
 * @returns {Function} Express middleware
 */
export function enforceLimit(limitKey, getCurrentValue, errorMessage = 'Limit exceeded') {
  return async (req, res, next) => {
    try {
      const limit = await settingsService.get(limitKey, Number.MAX_SAFE_INTEGER);
      const currentValue = await getCurrentValue(req);
      
      if (currentValue >= limit) {
        logger.warn(`Limit exceeded: ${limitKey}`, {
          userId: req.user?.id,
          limit,
          currentValue,
          path: req.path
        });
        
        return res.status(429).json({
          success: false,
          code: 'LIMIT_EXCEEDED',
          message: errorMessage,
          limit,
          current: currentValue
        });
      }
      
      next();
    } catch (error) {
      logger.error(`Error checking limit ${limitKey}:`, error);
      next(error);
    }
  };
}

/**
 * Enforce password policy from settings
 * @param {string} password - Password to validate
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
export async function enforcePasswordPolicy(password) {
  const policy = await settingsService.get('security.passwordPolicy', {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true
  });
  
  const errors = [];
  
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (policy.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    policy
  };
}

/**
 * Middleware to validate password against policy
 * Expects password in req.body.password
 */
export function validatePasswordPolicy(req, res, next) {
  return async (req, res, next) => {
    try {
      const password = req.body.password || req.body.newPassword;
      
      if (!password) {
        return next();
      }
      
      const result = await enforcePasswordPolicy(password);
      
      if (!result.valid) {
        logger.warn('Password policy validation failed', {
          userId: req.user?.id,
          errors: result.errors
        });
        
        return res.status(400).json({
          success: false,
          code: 'PASSWORD_POLICY_VIOLATION',
          message: 'Password does not meet security requirements',
          errors: result.errors,
          policy: result.policy
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error validating password policy:', error);
      next(error);
    }
  };
}

/**
 * Enforce email verification requirement from settings
 * Checks if user's email is verified when setting requires it
 */
export function enforceEmailVerification(req, res, next) {
  return async (req, res, next) => {
    try {
      const requireVerification = await settingsService.get('security.authentication.emailVerificationRequired', false);
      
      if (!requireVerification) {
        return next();
      }
      
      const user = req.user;
      
      if (!user) {
        return next(new ApiError(401, 'Authentication required'));
      }
      
      if (!user.emailVerified) {
        logger.warn('Email verification required', {
          userId: user.id,
          email: user.email,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          code: 'EMAIL_VERIFICATION_REQUIRED',
          message: 'Please verify your email address to access this feature'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error checking email verification:', error);
      next(error);
    }
  };
}

/**
 * Enforce 2FA requirement from settings
 * Checks if user has 2FA enabled when setting requires it
 */
export function enforce2FA(req, res, next) {
  return async (req, res, next) => {
    try {
      const require2FA = await settingsService.get('security.authentication.twoFactorRequired', false);
      
      if (!require2FA) {
        return next();
      }
      
      const user = req.user;
      
      if (!user) {
        return next(new ApiError(401, 'Authentication required'));
      }
      
      if (!user.twoFactorEnabled) {
        logger.warn('2FA required but not enabled', {
          userId: user.id,
          email: user.email,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          code: 'TWO_FACTOR_REQUIRED',
          message: 'Two-factor authentication is required to access this feature'
        });
      }
      
      // Check if 2FA was verified in this session
      if (!req.session?.twoFactorVerified) {
        logger.warn('2FA not verified in session', {
          userId: user.id,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          code: 'TWO_FACTOR_VERIFICATION_REQUIRED',
          message: 'Please verify your two-factor authentication code'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error checking 2FA requirement:', error);
      next(error);
    }
  };
}

/**
 * Enforce mode-specific requirements
 * @param {string} mode - The mode to check ('task_giver' or 'task_completer')
 * @returns {Function} Express middleware
 */
export function enforceModeRequirements(mode) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return next(new ApiError(401, 'Authentication required'));
      }
      
      if (mode === 'task_giver') {
        // Check if task givers require verification
        const requireVerification = await settingsService.get('modes.taskGiver.requireVerification', false);
        
        if (requireVerification && !user.verified) {
          logger.warn('Task giver verification required', {
            userId: user.id,
            verified: user.verified
          });
          
          return res.status(403).json({
            success: false,
            code: 'VERIFICATION_REQUIRED',
            message: 'Account verification is required to create tasks'
          });
        }
        
        // Check minimum balance for task givers
        const minBalance = await settingsService.get('modes.taskGiver.minBalance', 0);
        
        if (user.balance < minBalance) {
          logger.warn('Insufficient balance for task giver', {
            userId: user.id,
            balance: user.balance,
            required: minBalance
          });
          
          return res.status(403).json({
            success: false,
            code: 'INSUFFICIENT_BALANCE',
            message: `Minimum balance of ${minBalance} required to create tasks`,
            required: minBalance,
            current: user.balance
          });
        }
      }
      
      if (mode === 'task_completer') {
        // Check if task completers require email verification
        const requireEmailVerification = await settingsService.get('modes.taskCompleter.requireEmailVerification', false);
        
        if (requireEmailVerification && !user.emailVerified) {
          logger.warn('Email verification required for task completer', {
            userId: user.id,
            emailVerified: user.emailVerified
          });
          
          return res.status(403).json({
            success: false,
            code: 'EMAIL_VERIFICATION_REQUIRED',
            message: 'Email verification is required to complete tasks'
          });
        }
      }
      
      next();
    } catch (error) {
      logger.error(`Error checking mode requirements for ${mode}:`, error);
      next(error);
    }
  };
}

/**
 * Check if registration is allowed
 */
export async function isRegistrationAllowed() {
  return await settingsService.get('general.allowRegistration', true);
}

/**
 * Check if login is allowed
 */
export async function isLoginAllowed() {
  // Check maintenance mode (admins can always login)
  const maintenanceMode = await settingsService.get('maintenance.enabled', false);
  return !maintenanceMode;
}

/**
 * Get notification settings for a specific type
 * @param {string} type - Notification type (e.g., 'orderCreated', 'taskCompleted')
 * @returns {Promise<{email: boolean, push: boolean, sms: boolean}>}
 */
export async function getNotificationSettings(type) {
  const settings = await settingsService.get('notifications', {});
  return settings[type] || { email: true, push: true, sms: false };
}

/**
 * Get financial settings
 * @returns {Promise<Object>}
 */
export async function getFinancialSettings() {
  return {
    withdrawalFeePercentage: await settingsService.get('financial.withdrawalFeePercentage', 0),
    minWithdrawalAmount: await settingsService.get('financial.minWithdrawalAmount', 10),
    maxWithdrawalAmount: await settingsService.get('financial.maxWithdrawalAmount', 10000),
    commissionRate: await settingsService.get('financial.commissionRate', 0)
  };
}

export default {
  enforceFeatureFlag,
  enforceLimit,
  enforcePasswordPolicy,
  validatePasswordPolicy,
  enforceEmailVerification,
  enforce2FA,
  enforceModeRequirements,
  isRegistrationAllowed,
  isLoginAllowed,
  getNotificationSettings,
  getFinancialSettings
};
