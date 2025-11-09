/**
 * Task Routes
 * 
 * Defines API endpoints for task management:
 * - POST /api/tasks - Create task (Admin/Manager only)
 * - GET /api/tasks - Get all tasks (role-based filtering)
 * - GET /api/tasks/:id - Get task by ID
 * - PUT /api/tasks/:id - Update task (role-based restrictions)
 * - DELETE /api/tasks/:id - Delete task (Admin/Manager only)
 * 
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');
const { 
  createTaskValidation, 
  updateTaskValidation, 
  taskIdValidation 
} = require('../middleware/validation');

// Apply authentication to all task routes
router.use(authenticate);

// Create task - Only Admin and Manager
router.post('/', authorize('admin', 'manager'), createTaskValidation, taskController.createTask);

// Get all tasks - Role-based filtering applied in controller
router.get('/', taskController.getTasks);

// Get task by ID
router.get('/:id', taskIdValidation, taskController.getTaskById);

// Update task - Role-based restrictions applied in controller
router.put('/:id', taskIdValidation, updateTaskValidation, taskController.updateTask);

// Delete task - Only Admin and Manager
router.delete('/:id', authorize('admin', 'manager'), taskIdValidation, taskController.deleteTask);

module.exports = router;




