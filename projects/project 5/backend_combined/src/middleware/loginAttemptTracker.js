import { User } from '../models/index.js';
import { settingsService } from '../services/settingsService.js';
import { logAudit } from '../utils/logging.js';
import logger from '../config/logger.js';

/**
 * Track login attempts and enforce account lockouts
 */
export class LoginAttemptTracker {
  constructor() {
    this.attempts = new Map(); // In-memory store for login attempts
    this.lockouts = new Map(); // In-memory store for lockouts
  }

  /**
   * Get attempt key (email + IP for better security)
   */
  getAttemptKey(email, ip) {
    return `${email}:${ip}`;
  }

  /**
   * Check if account/IP is locked out
   */
  async isLockedOut(email, ip) {
    const key = this.getAttemptKey(email, ip);
    const lockout = this.lockouts.get(key);

    if (!lockout) return false;

    const lockoutDuration = await settingsService.get('security.accountProtection.lockoutDurationMinutes', 30);
    const lockoutExpiry = new Date(lockout.lockedAt.getTime() + lockoutDuration * 60 * 1000);

    if (new Date() > lockoutExpiry) {
      // Lockout expired
      this.lockouts.delete(key);
      this.attempts.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Record failed login attempt
   */
  async recordFailedAttempt(req, email) {
    const ip = req.ip || req.connection.remoteAddress;
    const key = this.getAttemptKey(email, ip);
    
    const maxAttempts = await settingsService.get('security.accountProtection.maxLoginAttempts', 5);
    
    const currentAttempts = this.attempts.get(key) || { count: 0, firstAttempt: new Date() };
    currentAttempts.count++;
    currentAttempts.lastAttempt = new Date();
    
    this.attempts.set(key, currentAttempts);

    // Log the failed attempt
    await logAudit(req, {
      action: 'LOGIN_FAILED',
      resource: 'auth',
      resourceId: email,
      description: `Failed login attempt ${currentAttempts.count}/${maxAttempts}`,
      metadata: { email, attemptCount: currentAttempts.count },
    });

    // Check if should lock out
    if (currentAttempts.count >= maxAttempts) {
      await this.lockAccount(req, email, ip);
      return { locked: true, attempts: currentAttempts.count };
    }

    return { locked: false, attempts: currentAttempts.count, remaining: maxAttempts - currentAttempts.count };
  }

  /**
   * Lock account after too many failed attempts
   */
  async lockAccount(req, email, ip) {
    const key = this.getAttemptKey(email, ip);
    const lockoutDuration = await settingsService.get('security.accountProtection.lockoutDurationMinutes', 30);
    
    this.lockouts.set(key, {
      email,
      ip,
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + lockoutDuration * 60 * 1000),
    });

    // Find user and update lock status in DB
    try {
      const user = await User.findOne({
        where: { email },
        attributes: ['id', 'email', 'username'],
      });

      if (user) {
        await user.update({
          locked_until: new Date(Date.now() + lockoutDuration * 60 * 1000),
        });

        await logAudit(req, {
          action: 'ACCOUNT_LOCKED',
          resource: 'user',
          resourceId: user.id,
          targetUserId: user.id,
          targetUserName: user.username || user.email,
          description: `Account locked for ${lockoutDuration} minutes due to too many failed login attempts`,
          metadata: { email, lockoutDuration, ip },
        });
      }
    } catch (error) {
      logger.error('Failed to update user lock status:', error);
    }

    logger.warn('Account locked', { email, ip, lockoutDuration });
  }

  /**
   * Clear attempts after successful login
   */
  clearAttempts(email, ip) {
    const key = this.getAttemptKey(email, ip);
    this.attempts.delete(key);
    this.lockouts.delete(key);
  }

  /**
   * Get lockout info
   */
  getLockoutInfo(email, ip) {
    const key = this.getAttemptKey(email, ip);
    return this.lockouts.get(key);
  }
}

// Singleton instance
export const loginAttemptTracker = new LoginAttemptTracker();

/**
 * Middleware to check if user is locked out
 */
export async function checkAccountLockout(req, res, next) {
  const email = req.body.email;
  const ip = req.ip || req.connection.remoteAddress;

  if (!email) {
    return next();
  }

  try {
    const isLocked = await loginAttemptTracker.isLockedOut(email, ip);
    
    if (isLocked) {
      const lockoutInfo = loginAttemptTracker.getLockoutInfo(email, ip);
      const lockoutDuration = await settingsService.get('security.accountProtection.lockoutDurationMinutes', 30);
      
      logger.warn('Locked account login attempt', { email, ip });

      return res.status(423).json({
        error: 'Account temporarily locked',
        code: 'ACCOUNT_LOCKED',
        message: `Too many failed login attempts. Account is locked for ${lockoutDuration} minutes.`,
        lockedUntil: lockoutInfo?.expiresAt,
      });
    }

    next();
  } catch (error) {
    logger.error('Lockout check failed:', error);
    // On error, allow request to proceed
    next();
  }
}

export default {
  LoginAttemptTracker,
  loginAttemptTracker,
  checkAccountLockout,
};
