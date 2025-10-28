import { User } from '../models/index.js';
import { AuthService } from '../services/auth.service.js';
import { validateRegistration, validateLogin } from '../validators/auth.validator.js';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';
import { Op } from 'sequelize'; // Import Sequelize operators
import { ActivityService } from '../services/activity.service.js';

const authService = new AuthService();
const activityService = new ActivityService();

export class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, username, phone } = req.body;
      
      logger.info('Registration attempt', { email, username });

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

      // Create user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        username,
        phone
      });
      
      logger.info('User registered successfully', { userId: user.id, email, username });
      
      // Log successful registration
      try {
        await activityService.logActivity(
          user.id,
          'auth',
          'registration_success',
          { 
            email: email,
            username: username
          },
          req
        );
      } catch (activityError) {
        logger.error('Failed to log activity for successful registration', { error: activityError.message });
      }

      // Generate tokens
      const token = await authService.generateToken(user.id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            phone: user.phone,
            role: user.role
          },
          token
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
            balance: req.user.balance || 0,
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
      // Implementation depends on your needs
      // This is a simplified example
      
      // Log email verification if user info is available
      if (req.user) {
        try {
          await activityService.logActivity(
            req.user.id,
            'auth',
            'email_verified',
            {},
            req
          );
        } catch (activityError) {
          logger.error('Failed to log activity for email verification', { error: activityError.message });
        }
      }
      
      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}