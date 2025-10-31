import { User } from '../models/index.js';
import { AuthService } from '../services/auth.service.js';
import { validateRegistration, validateLogin } from '../validators/auth.validator.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize'; // Import Sequelize operators
import { ActivityService } from '../services/activity.service.js';
import { loginAttemptTracker } from '../middleware/loginAttemptTracker.js';
import { twoFactorService } from '../services/twoFactorService.js';
import { emailVerificationService } from '../services/emailVerificationService.js';
import { logAudit } from '../utils/logging.js';
import { settingsService } from '../services/settingsService.js';
import { getDefaultPermissions } from '../utils/permissions.js';

const authService = new AuthService();
const activityService = new ActivityService();

export class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, username, phone, userType } = req.body;
      
      logger.info('Registration attempt', { email, username });

      // Check if registration is enabled
      const registrationEnabled = await settingsService.get('registration.enabled', true);
      if (!registrationEnabled) {
        logger.warn('Registration blocked: Registration is disabled', { email, username });
        throw new ApiError(403, 'Registration is currently disabled. Please contact support.');
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: email },
            { username: username }
          ]
        }
      });

      if (existingUser) {
        logger.warn('Registration failed: User already exists', { email, username });
        // Log failed registration attempt
        try {
          await activityService.logActivity(
            null, // No user ID yet
            'auth',
            'registration_failed',
            { 
              reason: 'User already exists',
              email: email,
              username: username
            },
            req
          );
        } catch (activityError) {
          logger.error('Failed to log activity for registration failure', { error: activityError.message });
        }
        throw new ApiError(400, 'User with this email or username already exists');
      }

      // Check if email verification is required
      const requireEmailVerification = await settingsService.get('registration.requireEmailVerification', true);

      // Create user with selected role (token will be generated after user creation)
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        username,
        phone,
        role: userType || 'task_doer', // Use selected userType or default to task_doer
        accountType: userType || 'task_doer', // Also set accountType field
        emailVerified: !requireEmailVerification, // If verification not required, mark as verified
        emailVerificationToken: null, // Will be updated after generation
        emailVerificationExpires: null, // Will be updated after generation
        status: requireEmailVerification ? 'pending' : 'active' // Set status based on verification requirement
      });
      
      // Generate email verification token AFTER user creation (so we have userId)
      let verificationToken = null;
      if (requireEmailVerification) {
        verificationToken = emailVerificationService.generateVerificationToken(user.id, email);
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Update user with verification token and expiry
        await user.update({
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires
        });
      }
      
      logger.info('User registered successfully', { 
        userId: user.id, 
        email, 
        username, 
        requireEmailVerification,
        emailVerified: user.emailVerified,
        status: user.status
      });

      // Assign selected role to user in user_roles table
      try {
        const { Role, UserRole } = await import('../models/index.js');
        
        // Get the role ID based on selected userType
        const roleRecord = await Role.findOne({ 
          where: { key: userType || 'task_doer' } 
        });
        
        if (roleRecord) {
          await UserRole.create({
            user_id: user.id,
            role_id: roleRecord.id
          });
          logger.info('User role assigned successfully', { 
            userId: user.id, 
            userType: userType,
            role: user.role,
            roleId: roleRecord.id 
          });
        } else {
          logger.warn('Role not found in database, skipping user_roles assignment', { 
            userId: user.id, 
            userType: userType,
            role: user.role 
          });
        }
      } catch (roleError) {
        logger.error('Failed to assign user role', { 
          userId: user.id, 
          error: roleError.message 
        });
        // Don't throw error, user is already created
      }
      
      // Send verification email if required, otherwise send welcome email
      if (requireEmailVerification) {
        try {
          const { emailService } = await import('../services/email.service.js');
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
          const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
          
          await emailService.sendVerificationEmail(user, verificationUrl).catch(err => {
            logger.error('Failed to send verification email', { userId: user.id, error: err.message });
          });
          
          logger.info('Verification email sent', { userId: user.id, email });
        } catch (emailError) {
          logger.error('Failed to send verification email', { error: emailError.message });
        }
      } else {
        // Send welcome email (async, don't wait for it)
        try {
          const { emailService } = await import('../services/email.service.js');
          emailService.sendWelcomeEmail(user).catch(err => {
            logger.error('Failed to send welcome email', { userId: user.id, error: err.message });
          });
        } catch (emailError) {
          logger.error('Failed to load email service', { error: emailError.message });
        }
      }
      
      // Log successful registration
      try {
        await activityService.logActivity(
          user.id,
          'auth',
          'registration_success',
          { 
            email: email,
            username: username,
            userType: userType,
            role: user.role
          },
          req
        );
      } catch (activityError) {
        logger.error('Failed to log activity for successful registration', { error: activityError.message });
      }

      // Generate tokens only if email verification is not required
      const token = !requireEmailVerification ? await authService.generateToken(user.id) : null;

      res.status(201).json({
        success: true,
        message: requireEmailVerification 
          ? 'Registration successful! Please check your email to verify your account.' 
          : 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            phone: user.phone,
            role: user.role,
            emailVerified: user.emailVerified,
            status: user.status
          },
          token,
          requireEmailVerification
        }
      });
    } catch (error) {
      logger.error('Registration error', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      logger.info('Login attempt', { email, passwordLength: password?.length });

      // Log the entire request body for debugging
      logger.debug('Login request body', { body: req.body });

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        logger.warn('Login failed: User not found', { email });
        // Record failed attempt
        await loginAttemptTracker.recordFailedAttempt(req, email);
        // Log failed login attempt
        try {
          await activityService.logActivity(
            null, // No user ID since user doesn't exist
            'auth',
            'login_failed',
            { 
              reason: 'User not found',
              email: email
            },
            req
          );
        } catch (activityError) {
          logger.error('Failed to log activity for login failure', { error: activityError.message });
        }
        throw new ApiError(401, 'Invalid credentials');
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      logger.debug('Password validation result', { isValidPassword, userId: user.id });
      
      if (!isValidPassword) {
        logger.warn('Login failed: Invalid password', { email, userId: user.id });
        // Record failed attempt
        await loginAttemptTracker.recordFailedAttempt(req, email);
        // Log failed login attempt
        try {
          await activityService.logActivity(
            user.id,
            'auth',
            'login_failed',
            { 
              reason: 'Invalid password',
              email: email
            },
            req
          );
        } catch (activityError) {
          logger.error('Failed to log activity for login failure', { error: activityError.message });
        }
        throw new ApiError(401, 'Invalid credentials');
      }

      // Check if email verification is required
      const requireEmailVerification = await settingsService.get('registration.requireEmailVerification', true);
      if (requireEmailVerification && !user.emailVerified) {
        logger.warn('Login failed: Email not verified', { email, userId: user.id });
        // Log failed login attempt
        try {
          await activityService.logActivity(
            user.id,
            'auth',
            'login_failed',
            { 
              reason: 'Email not verified',
              email: email
            },
            req
          );
        } catch (activityError) {
          logger.error('Failed to log activity for login failure', { error: activityError.message });
        }
        throw new ApiError(403, 'Please verify your email address before logging in. Check your inbox for the verification link.');
      }

      // Check if account is pending activation
      if (user.status === 'pending') {
        logger.warn('Login failed: Account pending activation', { email, userId: user.id });
        throw new ApiError(403, 'Your account is pending activation. Please verify your email address.');
      }

      // Check maintenance mode - only allow privileged users to login
      const isMaintenanceEnabled = await settingsService.get('maintenance.enabled', false);
      if (isMaintenanceEnabled) {
        const privilegedRoles = ['super_admin', 'admin', 'moderator'];
        if (!privilegedRoles.includes(user.role)) {
          logger.warn('Login blocked: Maintenance mode active for regular users', { 
            email, 
            userId: user.id, 
            role: user.role 
          });
          throw new ApiError(503, 'The service is currently under maintenance. Please try again later.');
        }
        logger.info('Maintenance mode: Privileged user login allowed', { 
          email, 
          userId: user.id, 
          role: user.role 
        });
      }

      // Clear login attempts on successful login
      await loginAttemptTracker.clearAttempts(email, req.ip || req.connection?.remoteAddress);

      // Update last login timestamp
      await user.update({
        lastLogin: new Date()
      });
      
      logger.info('Last login timestamp updated', { userId: user.id, email });

      // Generate tokens
      const token = await authService.generateToken(user.id);
      
      logger.info('Login successful', { userId: user.id, email });
      
      // Log successful login
      try {
        await activityService.logActivity(
          user.id,
          'auth',
          'login_success',
          { 
            email: email,
            lastLogin: user.lastLogin
          },
          req
        );
      } catch (activityError) {
        logger.error('Failed to log activity for successful login', { error: activityError.message });
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            phone: user.phone,
            role: user.role,
            lastLogin: user.lastLogin
          },
          token
        }
      });
    } catch (error) {
      logger.error('Login error', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async adminLogin(req, res, next) {
    try {
      const { email, password } = req.body;
      
      logger.info('Admin login attempt', { email, passwordLength: password?.length });

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        logger.warn('Admin login failed: User not found', { email });
        // Record failed attempt
        await loginAttemptTracker.recordFailedAttempt(req, email);
        // Log failed login attempt
        try {
          await activityService.logActivity(
            null,
            'auth',
            'admin_login_failed',
            { 
              reason: 'User not found',
              email: email
            },
            req
          );
        } catch (activityError) {
          logger.error('Failed to log activity for admin login failure', { error: activityError.message });
        }
        throw new ApiError(401, 'Invalid credentials');
      }

      // Check if user has admin role
      const adminRoles = ['super_admin', 'admin', 'moderator'];
      if (!adminRoles.includes(user.role)) {
        logger.warn('Admin login failed: User is not an admin', { email, userId: user.id, role: user.role });
        // Record failed attempt
        await loginAttemptTracker.recordFailedAttempt(req, email);
        // Log failed admin login attempt
        try {
          await activityService.logActivity(
            user.id,
            'auth',
            'admin_login_failed',
            { 
              reason: 'Insufficient permissions - not an admin role',
              email: email,
              role: user.role
            },
            req
          );
          
          // Log audit trail
          await logAudit({
            actorId: user.id,
            actorName: `${user.firstName} ${user.lastName}`,
            actorEmail: user.email,
            action: 'ADMIN_LOGIN_DENIED',
            resource: 'admin_auth',
            resourceId: user.id.toString(),
            description: `Unauthorized admin login attempt by ${user.role} user`,
            metadata: { email, role: user.role },
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('user-agent')
          });
        } catch (activityError) {
          logger.error('Failed to log activity for admin login failure', { error: activityError.message });
        }
        throw new ApiError(403, 'Access denied. Admin privileges required.');
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      logger.debug('Password validation result', { isValidPassword, userId: user.id });
      
      if (!isValidPassword) {
        logger.warn('Admin login failed: Invalid password', { email, userId: user.id });
        // Record failed attempt
        await loginAttemptTracker.recordFailedAttempt(req, email);
        // Log failed login attempt
        try {
          await activityService.logActivity(
            user.id,
            'auth',
            'admin_login_failed',
            { 
              reason: 'Invalid password',
              email: email
            },
            req
          );
        } catch (activityError) {
          logger.error('Failed to log activity for admin login failure', { error: activityError.message });
        }
        throw new ApiError(401, 'Invalid credentials');
      }

      // Clear login attempts on successful login
      await loginAttemptTracker.clearAttempts(email, req.ip || req.connection?.remoteAddress);

      // Update last login timestamp
      await user.update({
        lastLogin: new Date()
      });
      
      logger.info('Admin login successful', { userId: user.id, email, role: user.role });

      // Generate tokens
      const token = await authService.generateToken(user.id);
      
      // Log successful admin login
      try {
        await activityService.logActivity(
          user.id,
          'auth',
          'admin_login_success',
          { 
            email: email,
            role: user.role,
            lastLogin: user.lastLogin
          },
          req
        );

        // Log audit trail
        await logAudit(req, {
          action: 'ADMIN_LOGIN',
          resource: 'admin_auth',
          resourceId: user.id.toString(),
          description: `Admin user logged in successfully`,
          metadata: { email, role: user.role },
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent')
        });
      } catch (activityError) {
        logger.error('Failed to log activity for successful admin login', { error: activityError.message });
      }

      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            phone: user.phone,
            role: user.role,
            lastLogin: user.lastLogin
          },
          token
        }
      });
    } catch (error) {
      logger.error('Admin login error', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      res.json({
        success: true,
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // Log logout activity if user is authenticated
      if (req.user) {
        try {
          await activityService.logActivity(
            req.user.id,
            'auth',
            'logout',
            {},
            req
          );
        } catch (activityError) {
          logger.error('Failed to log activity for logout', { error: activityError.message });
        }
      }
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  async validateToken(req, res, next) {
    try {
      // If we reach this method, the authenticateToken middleware has already validated the token
      // The user object is attached to req.user by the middleware
      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            username: req.user.username,
            phone: req.user.phone,
            balance: parseFloat(req.user.balance) || 0,
            role: req.user.role
          }
        }
      });
    } catch (error) {
      logger.error('Token validation error', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Don't reveal if user exists or not
        // Log password reset attempt even if user doesn't exist
        try {
          await activityService.logActivity(
            null, // No user ID since we don't know if user exists
            'auth',
            'password_reset_requested',
            { 
              email: email
            },
            req
          );
        } catch (activityError) {
          logger.error('Failed to log activity for password reset request', { error: activityError.message });
        }
        
        return res.json({
          success: true,
          message: 'If email exists, password reset instructions have been sent'
        });
      }

      // Generate reset token (implementation depends on your needs)
      // This is a simplified example
      logger.info(`Password reset requested for user ${user.id}`);
      
      // Log password reset request
      try {
        await activityService.logActivity(
          user.id,
          'auth',
          'password_reset_requested',
          { 
            email: email
          },
          req
        );
      } catch (activityError) {
        logger.error('Failed to log activity for password reset request', { error: activityError.message });
      }

      res.json({
        success: true,
        message: 'If email exists, password reset instructions have been sent'
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      // Implementation depends on your needs
      // This is a simplified example
      
      // Log password reset completion if user info is available
      if (req.user) {
        try {
          await activityService.logActivity(
            req.user.id,
            'auth',
            'password_reset_completed',
            {},
            req
          );
        } catch (activityError) {
          logger.error('Failed to log activity for password reset completion', { error: activityError.message });
        }
      }
      
      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ApiError(400, 'Verification token is required');
      }

      logger.info('Email verification attempt', { token: token.substring(0, 20) + '...' });

      // Verify the token
      const decoded = emailVerificationService.verifyToken(token);

      // Find user
      const user = await User.findOne({ 
        where: { 
          email: decoded.email,
          emailVerificationToken: token
        }
      });

      if (!user) {
        logger.warn('Email verification failed: User not found or token mismatch', { email: decoded.email });
        throw new ApiError(404, 'Invalid or expired verification token');
      }

      // Check if already verified
      if (user.emailVerified) {
        logger.info('Email already verified', { userId: user.id, email: user.email });
        return res.json({
          success: true,
          message: 'Email address is already verified. You can now log in.',
          data: {
            alreadyVerified: true
          }
        });
      }

      // Check if token is expired
      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        logger.warn('Email verification failed: Token expired', { userId: user.id, email: user.email });
        throw new ApiError(400, 'Verification token has expired. Please request a new one.');
      }

      // Update user as verified
      await user.update({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        status: 'active' // Activate account
      });

      logger.info('Email verified successfully', { userId: user.id, email: user.email });

      // Send welcome email now that email is verified
      try {
        const { emailService } = await import('../services/email.service.js');
        emailService.sendWelcomeEmail(user).catch(err => {
          logger.error('Failed to send welcome email', { userId: user.id, error: err.message });
        });
      } catch (emailError) {
        logger.error('Failed to send welcome email', { error: emailError.message });
      }

      // Log email verification
      try {
        await activityService.logActivity(
          user.id,
          'auth',
          'email_verified',
          { email: user.email },
          req
        );

        // Log audit trail
        await logAudit({
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`,
          actorEmail: user.email,
          action: 'EMAIL_VERIFIED',
          resource: 'user',
          resourceId: user.id.toString(),
          description: `User verified their email address`,
          metadata: { email: user.email },
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('user-agent')
        });
      } catch (activityError) {
        logger.error('Failed to log activity for email verification', { error: activityError.message });
      }
      
      res.json({
        success: true,
        message: 'Email verified successfully! You can now log in to your account.',
        data: {
          email: user.email,
          firstName: user.firstName,
          verified: true
        }
      });
    } catch (error) {
      logger.error('Email verification error', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  async resendVerificationEmail(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ApiError(400, 'Email address is required');
      }

      logger.info('Resend verification email request', { email });

      // Find user
      const user = await User.findOne({ where: { email } });

      if (!user) {
        // Don't reveal if user exists or not
        logger.warn('Resend verification failed: User not found', { email });
        return res.json({
          success: true,
          message: 'If an account exists with this email, a verification link has been sent.'
        });
      }

      // Check if already verified
      if (user.emailVerified) {
        logger.info('Resend verification skipped: Email already verified', { userId: user.id, email });
        return res.json({
          success: true,
          message: 'This email address is already verified. You can log in now.'
        });
      }

      // Check rate limiting - don't allow resend more than once every 5 minutes
      if (user.emailVerificationExpires) {
        const lastSentTime = new Date(user.emailVerificationExpires).getTime() - (24 * 60 * 60 * 1000);
        const timeSinceLastSent = Date.now() - lastSentTime;
        const fiveMinutes = 5 * 60 * 1000;

        if (timeSinceLastSent < fiveMinutes) {
          const remainingSeconds = Math.ceil((fiveMinutes - timeSinceLastSent) / 1000);
          throw new ApiError(429, `Please wait ${remainingSeconds} seconds before requesting another verification email.`);
        }
      }

      // Generate new verification token
      const verificationToken = emailVerificationService.generateVerificationToken(user.id, user.email);
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new token
      await user.update({
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      });

      // Send verification email
      try {
        const { emailService } = await import('../services/email.service.js');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
        const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
        
        await emailService.sendVerificationEmail(user, verificationUrl);
        
        logger.info('Verification email resent', { userId: user.id, email });
      } catch (emailError) {
        logger.error('Failed to send verification email', { error: emailError.message });
        throw new ApiError(500, 'Failed to send verification email. Please try again later.');
      }

      // Log activity
      try {
        await activityService.logActivity(
          user.id,
          'auth',
          'verification_email_resent',
          { email: user.email },
          req
        );
      } catch (activityError) {
        logger.error('Failed to log activity for resend verification', { error: activityError.message });
      }

      res.json({
        success: true,
        message: 'Verification email has been resent. Please check your inbox.'
      });
    } catch (error) {
      logger.error('Resend verification email error', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * Setup 2FA - Generate secret and QR code
   */
  async setup2FA(req, res, next) {
    try {
      const user = req.user;

      if (user.twoFactorEnabled) {
        return res.status(400).json({
          success: false,
          message: '2FA is already enabled. Disable it first to set up again.'
        });
      }

      // Generate secret and QR code
      const { secret, qrCode, backupCodes } = await twoFactorService.generateSecret(user.email);

      // Store secret temporarily (not enabled yet)
      await user.update({ twoFactorSecret: secret });

      logger.info('2FA setup initiated', { userId: user.id });

      res.json({
        success: true,
        message: '2FA setup initiated. Scan the QR code with your authenticator app.',
        data: {
          qrCode,
          secret, // Show secret for manual entry
          backupCodes // Show backup codes to save
        }
      });
    } catch (error) {
      logger.error('2FA setup error:', error);
      next(error);
    }
  }

  /**
   * Enable 2FA - Verify token and activate
   */
  async enable2FA(req, res, next) {
    try {
      const { token, backupCodes } = req.body;
      const user = req.user;

      if (!user.twoFactorSecret) {
        return res.status(400).json({
          success: false,
          message: 'Please set up 2FA first using /auth/2fa/setup'
        });
      }

      if (user.twoFactorEnabled) {
        return res.status(400).json({
          success: false,
          message: '2FA is already enabled'
        });
      }

      // Verify the token
      const isValid = twoFactorService.verifyToken(token, user.twoFactorSecret);

      if (!isValid) {
        logger.warn('Invalid 2FA token during enable', { userId: user.id });
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code. Please try again.'
        });
      }

      // Enable 2FA
      await user.update({
        twoFactorEnabled: true,
        twoFactorBackupCodes: backupCodes || []
      });

      // Audit log
      await logAudit(req, {
        action: 'TWO_FACTOR_ENABLED',
        resource: 'user',
        resourceId: user.id,
        description: `User ${user.email} enabled two-factor authentication`
      });

      logger.info('2FA enabled', { userId: user.id });

      res.json({
        success: true,
        message: '2FA has been enabled successfully'
      });
    } catch (error) {
      logger.error('2FA enable error:', error);
      next(error);
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(req, res, next) {
    try {
      const { password } = req.body;
      const user = req.user;

      if (!user.twoFactorEnabled) {
        return res.status(400).json({
          success: false,
          message: '2FA is not enabled'
        });
      }

      // Verify password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        logger.warn('Invalid password during 2FA disable', { userId: user.id });
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // Disable 2FA
      await user.update({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      });

      // Audit log
      await logAudit(req, {
        action: 'TWO_FACTOR_DISABLED',
        resource: 'user',
        resourceId: user.id,
        description: `User ${user.email} disabled two-factor authentication`
      });

      logger.info('2FA disabled', { userId: user.id });

      res.json({
        success: true,
        message: '2FA has been disabled'
      });
    } catch (error) {
      logger.error('2FA disable error:', error);
      next(error);
    }
  }

  /**
   * Verify 2FA token during login
   */
  async verify2FA(req, res, next) {
    try {
      const { email, token, useBackupCode } = req.body;

      if (!email || !token) {
        return res.status(400).json({
          success: false,
          message: 'Email and token are required'
        });
      }

      // Find user
      const user = await User.findOne({ 
        where: { email },
        attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'twoFactorEnabled', 'twoFactorSecret', 'twoFactorBackupCodes']
      });

      if (!user || !user.twoFactorEnabled) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request'
        });
      }

      let isValid = false;

      if (useBackupCode) {
        // Verify backup code
        const backupCodes = user.twoFactorBackupCodes || [];
        const index = twoFactorService.verifyBackupCode(token, backupCodes);
        
        if (index !== -1) {
          isValid = true;
          // Remove used backup code
          backupCodes.splice(index, 1);
          await user.update({ twoFactorBackupCodes: backupCodes });
          
          logger.info('Backup code used', { userId: user.id, remaining: backupCodes.length });
        }
      } else {
        // Verify TOTP token
        isValid = twoFactorService.verifyToken(token, user.twoFactorSecret);
      }

      if (!isValid) {
        logger.warn('Invalid 2FA token', { userId: user.id, email });
        return res.status(401).json({
          success: false,
          message: 'Invalid verification code'
        });
      }

      // Generate auth token
      const authToken = await authService.generateToken(user.id);

      // Update last login
      await user.update({ lastLogin: new Date() });

      logger.info('2FA verification successful', { userId: user.id });

      res.json({
        success: true,
        message: '2FA verification successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          token: authToken
        }
      });
    } catch (error) {
      logger.error('2FA verify error:', error);
      next(error);
    }
  }
}