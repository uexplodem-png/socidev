import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkAccountLockout } from '../middleware/loginAttemptTracker.js';
import { authRateLimiter, strictRateLimiter } from '../middleware/security.js';

const router = express.Router();
const authController = new AuthController();

// Register
router.post('/register', authRateLimiter, validate(schemas.register), authController.register);

// Login - with account lockout check and rate limiting
router.post('/login', authRateLimiter, checkAccountLockout, validate(schemas.login), authController.login);

// Admin login - with role validation
router.post('/admin-login', authRateLimiter, checkAccountLockout, validate(schemas.login), authController.adminLogin);

// Validate token (requires authentication)
router.get('/validate', authenticateToken, authController.validateToken);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Logout (requires authentication)
router.post('/logout', authenticateToken, authController.logout);

// Forgot password - strict rate limiting
router.post('/forgot-password', strictRateLimiter, authController.forgotPassword);

// Reset password - strict rate limiting
router.post('/reset-password', strictRateLimiter, authController.resetPassword);

// Verify email
router.post('/verify-email', authController.verifyEmail);

// 2FA routes
router.post('/2fa/setup', authenticateToken, authController.setup2FA);
router.post('/2fa/enable', authenticateToken, authController.enable2FA);
router.post('/2fa/disable', authenticateToken, authController.disable2FA);
router.post('/2fa/verify', authController.verify2FA);

export { router as authRouter };