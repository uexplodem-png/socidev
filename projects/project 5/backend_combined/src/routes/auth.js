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

export { router as authRouter };