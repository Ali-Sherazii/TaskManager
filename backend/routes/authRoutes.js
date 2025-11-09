/**
 * Authentication Routes
 * 
 * Defines API endpoints for authentication:
 * - POST /api/auth/register - Register new user
 * - POST /api/auth/login - Login user
 * - POST /api/auth/logout - Logout user (requires auth)
 * - POST /api/auth/revoke-session/:userId - Revoke user sessions (requires auth)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerValidation, loginValidation, userIdValidation } = require('../middleware/validation');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Public routes (no authentication required)
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Email verification routes (no authentication required)
router.post('/verify-email', [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid verification token format'),
  handleValidationErrors
], authController.verifyEmail);

router.post('/resend-verification', [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  handleValidationErrors
], authController.resendVerificationEmail);

// Protected routes (require authentication)
router.post('/logout', authenticate, authController.logout);
router.post('/revoke-session/:userId', authenticate, userIdValidation, authController.revokeSession);

module.exports = router;




