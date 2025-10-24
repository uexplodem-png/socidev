import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const authController = new AuthController();

// Register
router.post('/register', validate(schemas.register), authController.register);

// Login
router.post('/login', validate(schemas.login), authController.login);

// Validate token (requires authentication)
router.get('/validate', authenticateToken, authController.validateToken);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Logout (requires authentication)
router.post('/logout', authenticateToken, authController.logout);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password', authController.resetPassword);

// Verify email
router.post('/verify-email', authController.verifyEmail);

export { router as authRouter };