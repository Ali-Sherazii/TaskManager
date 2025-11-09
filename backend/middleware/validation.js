/**
 * Input Validation Middleware
 * 
 * Validates request data before it reaches controllers.
 * Uses express-validator library for validation rules.
 * 
 * Why validate?
 * - Prevents invalid data from entering database
 * - Provides clear error messages to users
 * - Protects against malicious input
 * - Ensures data consistency
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Error Handler for Validation
 * 
 * Checks validation results and returns errors if any.
 * Must be called after validation rules.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ============================================
// VALIDATION RULES
// ============================================

/**
 * User Registration Validation
 * 
 * Validates:
 * - Username: 3-30 chars, alphanumeric + underscore only
 * - Email: Valid email format
 * - Password: Minimum 6 characters
 * - Role: Optional, must be valid role
 */
const registerValidation = [
  body('username')
    .trim()  // Remove whitespace
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)  // Only letters, numbers, underscore
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),  // Converts to lowercase, etc.
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()  // Not required
    .toLowerCase()
    .isIn(['admin', 'manager', 'user'])
    .withMessage('Role must be admin, manager, or user'),
  handleValidationErrors  // Must be last - handles validation results
];

/**
 * Login Validation
 * 
 * Validates:
 * - Username: Required, not empty
 * - Password: Required, not empty
 */
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Task Creation Validation
 * 
 * Validates:
 * - Title: 1-200 characters
 * - Description: Optional, max 1000 characters
 * - AssignedTo: Optional, must be valid user ID
 * - Status: Optional, must be valid status
 * - Priority: Optional, must be valid priority
 * - DueDate: Required, must be valid ISO date, must be in future
 */
const createTaskValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('assignedTo')
    .optional()
    .custom((value) => {
      // Allow null, empty string, or valid MongoDB ObjectId
      if (value === null || value === '' || value === undefined) {
        return true;
      }
      // Check if it's a valid MongoDB ObjectId format (24 hex characters)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!objectIdPattern.test(value)) {
        throw new Error('assignedTo must be a valid user ID');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Status must be pending, in-progress, completed, or cancelled'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate')
    .isISO8601()  // Valid ISO 8601 date format
    .withMessage('dueDate must be a valid ISO 8601 date')
    .custom((value) => {
      // Custom validation: due date must be in future
      if (new Date(value) < new Date()) {
        throw new Error('dueDate must be in the future');
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * Task Update Validation
 * 
 * Similar to create, but all fields are optional (only update what's provided)
 */
const updateTaskValidation = [
  param('id')  // Validate URL parameter - MongoDB ObjectId
    .custom((value) => {
      // Check if it's a valid MongoDB ObjectId format (24 hex characters)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!objectIdPattern.test(value)) {
        throw new Error('Task ID must be a valid MongoDB ObjectId');
      }
      return true;
    }),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('assignedTo')
    .optional()
    .custom((value) => {
      // Allow null, empty string, or valid MongoDB ObjectId
      if (value === null || value === '' || value === undefined) {
        return true;
      }
      // Check if it's a valid MongoDB ObjectId format (24 hex characters)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!objectIdPattern.test(value)) {
        throw new Error('assignedTo must be a valid user ID');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Status must be pending, in-progress, completed, or cancelled'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('dueDate must be a valid ISO 8601 date'),
  handleValidationErrors
];

/**
 * Task ID Parameter Validation
 */
const taskIdValidation = [
  param('id')
    .custom((value) => {
      // Check if it's a valid MongoDB ObjectId format (24 hex characters)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!objectIdPattern.test(value)) {
        throw new Error('Task ID must be a valid MongoDB ObjectId');
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * User ID Parameter Validation
 */
const userIdValidation = [
  param('id')
    .custom((value) => {
      // Check if it's a valid MongoDB ObjectId format (24 hex characters)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!objectIdPattern.test(value)) {
        throw new Error('User ID must be a valid MongoDB ObjectId');
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  createTaskValidation,
  updateTaskValidation,
  taskIdValidation,
  userIdValidation,
  handleValidationErrors
};

