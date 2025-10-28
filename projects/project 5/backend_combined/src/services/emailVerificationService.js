/**
 * Email Verification Service
 * 
 * Handles email verification token generation and validation.
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';
import { settingsService } from './settingsService.js';

export class EmailVerificationService {
  /**
   * Generate an email verification token
   * @param {number} userId - User's ID
   * @param {string} email - User's email
   * @returns {string} JWT token for email verification
   */
  generateVerificationToken(userId, email) {
    try {
      const payload = {
        userId,
        email,
        type: 'email_verification',
        timestamp: Date.now()
      };

      // Token expires in 24 hours
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '24h'
      });

      logger.info('Generated email verification token', { userId, email });

      return token;
    } catch (error) {
      logger.error('Error generating verification token:', error);
      throw new ApiError(500, 'Failed to generate verification token');
    }
  }

  /**
   * Verify an email verification token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      if (decoded.type !== 'email_verification') {
        throw new ApiError(400, 'Invalid token type');
      }

      logger.info('Email verification token verified', { userId: decoded.userId });

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('Email verification token expired');
        throw new ApiError(400, 'Verification token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        logger.warn('Invalid email verification token');
        throw new ApiError(400, 'Invalid verification token');
      }
      logger.error('Error verifying token:', error);
      throw error;
    }
  }

  /**
   * Generate a password reset token
   * @param {number} userId - User's ID
   * @param {string} email - User's email
   * @returns {string} JWT token for password reset
   */
  generatePasswordResetToken(userId, email) {
    try {
      const payload = {
        userId,
        email,
        type: 'password_reset',
        timestamp: Date.now()
      };

      // Token expires in 1 hour
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '1h'
      });

      logger.info('Generated password reset token', { userId, email });

      return token;
    } catch (error) {
      logger.error('Error generating password reset token:', error);
      throw new ApiError(500, 'Failed to generate password reset token');
    }
  }

  /**
   * Verify a password reset token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

      if (decoded.type !== 'password_reset') {
        throw new ApiError(400, 'Invalid token type');
      }

      logger.info('Password reset token verified', { userId: decoded.userId });

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('Password reset token expired');
        throw new ApiError(400, 'Reset token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        logger.warn('Invalid password reset token');
        throw new ApiError(400, 'Invalid reset token');
      }
      logger.error('Error verifying password reset token:', error);
      throw error;
    }
  }

  /**
   * Generate a verification code (6 digits)
   * Used for SMS or email-based verification
   * @returns {string} 6-digit code
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Hash a verification code for storage
   * @param {string} code - Verification code
   * @returns {string} Hashed code
   */
  hashVerificationCode(code) {
    return crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
  }

  /**
   * Verify a hashed verification code
   * @param {string} code - Code to verify
   * @param {string} hashedCode - Stored hashed code
   * @returns {boolean} Whether the code matches
   */
  verifyVerificationCode(code, hashedCode) {
    const inputHash = this.hashVerificationCode(code);
    return inputHash === hashedCode;
  }

  /**
   * Get verification email configuration from settings
   * @returns {Promise<Object>} Email configuration
   */
  async getEmailConfig() {
    const from = await settingsService.get('notifications.email.from', 'noreply@socialdev.com');
    const subject = await settingsService.get('notifications.email.verificationSubject', 'Verify your email address');
    
    return { from, subject };
  }

  /**
   * Build verification email HTML
   * @param {string} verificationUrl - URL with token
   * @param {string} userName - User's name
   * @returns {string} HTML email content
   */
  buildVerificationEmail(verificationUrl, userName) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: #4F46E5; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName || 'there'}!</h2>
              <p>Thank you for registering with SocialDev. Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SocialDev. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Build password reset email HTML
   * @param {string} resetUrl - URL with token
   * @param {string} userName - User's name
   * @returns {string} HTML email content
   */
  buildPasswordResetEmail(resetUrl, userName) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: #DC2626; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .warning { background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName || 'there'}!</h2>
              <p>We received a request to reset your password. Click the button below to set a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
              <div class="warning">
                <p><strong>⚠️ Important:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour.</li>
                  <li>If you didn't request a password reset, please ignore this email.</li>
                  <li>Your password will not change until you access the link above and create a new one.</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SocialDev. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailVerificationService = new EmailVerificationService();
