/**
 * User Management Routes
 * 
 * Defines API endpoints for user management (Admin only):
 * - POST /api/users - Create user
 * - GET /api/users - Get all users
 * - GET /api/users/:id - Get user by ID
 * - PUT /api/users/:id/role - Update user role
 * 
 * All routes require Admin role.
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { registerValidation, userIdValidation } = require('../middleware/validation');

// Apply authentication to all user routes
router.use(authenticate);

// Create user (Admin only)
router.post('/', authorize('admin'), registerValidation, userController.createUser);

// Get all users (Admin and Manager can see users for task assignment)
router.get('/', authorize('admin', 'manager'), userController.getUsers);

// Get user by ID (Admin only)
router.get('/:id', authorize('admin'), userIdValidation, userController.getUserById);

// Update user role (Admin only)
router.put('/:id/role', authorize('admin'), userIdValidation, userController.updateUserRole);

module.exports = router;


