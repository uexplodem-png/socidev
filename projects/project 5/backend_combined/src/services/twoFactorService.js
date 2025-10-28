/**
 * Two-Factor Authentication Service
 * 
 * Handles TOTP-based 2FA operations using speakeasy.
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';

export class TwoFactorService {
  /**
   * Generate a new 2FA secret for a user
   * @param {string} email - User's email
   * @param {string} issuer - Application name (default: 'SocialDev')
   * @returns {Promise<{secret: string, qrCode: string, backupCodes: string[]}>}
   */
  async generateSecret(email, issuer = 'SocialDev') {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${issuer} (${email})`,
        issuer: issuer,
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Generate backup codes (8 codes, 8 characters each)
      const backupCodes = this.generateBackupCodes(8);

      logger.info('Generated 2FA secret', { email });

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      logger.error('Error generating 2FA secret:', error);
      throw new ApiError(500, 'Failed to generate 2FA secret');
    }
  }

  /**
   * Verify a TOTP token
   * @param {string} token - 6-digit token from authenticator app
   * @param {string} secret - User's 2FA secret
   * @returns {boolean} Whether the token is valid
   */
  verifyToken(token, secret) {
    try {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps before/after (60 seconds)
      });

      logger.debug('2FA token verification', { verified });

      return verified;
    } catch (error) {
      logger.error('Error verifying 2FA token:', error);
      return false;
    }
  }

  /**
   * Verify a backup code
   * @param {string} code - Backup code to verify
   * @param {string[]} userBackupCodes - User's backup codes (hashed)
   * @returns {number} Index of the matched code, or -1 if not found
   */
  verifyBackupCode(code, userBackupCodes) {
    try {
      // In production, backup codes should be hashed
      // For now, we'll do simple comparison
      const index = userBackupCodes.indexOf(code);
      
      if (index !== -1) {
        logger.info('Backup code used successfully');
      } else {
        logger.warn('Invalid backup code attempt');
      }
      
      return index;
    } catch (error) {
      logger.error('Error verifying backup code:', error);
      return -1;
    }
  }

  /**
   * Generate random backup codes
   * @param {number} count - Number of codes to generate
   * @returns {string[]} Array of backup codes
   */
  generateBackupCodes(count = 8) {
    const codes = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Generate a current TOTP token (for testing)
   * @param {string} secret - User's 2FA secret
   * @returns {string} Current TOTP token
   */
  generateToken(secret) {
    return speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });
  }
}

export const twoFactorService = new TwoFactorService();
