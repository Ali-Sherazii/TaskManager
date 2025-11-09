/**
 * Notification Routes
 * 
 * Defines API endpoints for notification management.
 * All routes require authentication and enforce user-specific access.
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Apply authentication to all notification routes
router.use(authenticate);

/**
 * Notification ID validation
 */
const notificationIdValidation = [
  param('id')
    .custom((value) => {
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!objectIdPattern.test(value)) {
        throw new Error('Notification ID must be a valid MongoDB ObjectId');
      }
      return true;
    }),
  handleValidationErrors
];

// Get all notifications for authenticated user
// GET /api/notifications
router.get('/', notificationController.getNotifications);

// Get unread notification count
// GET /api/notifications/unread/count
router.get('/unread/count', notificationController.getUnreadCount);

// Mark notification as read
// PUT /api/notifications/:id/read
router.put('/:id/read', notificationIdValidation, notificationController.markAsRead);

// Mark all notifications as read
// PUT /api/notifications/read/all
router.put('/read/all', notificationController.markAllAsRead);

// Delete notification
// DELETE /api/notifications/:id
router.delete('/:id', notificationIdValidation, notificationController.deleteNotification);

// Delete all notifications
// DELETE /api/notifications
router.delete('/', notificationController.deleteAllNotifications);

module.exports = router;

