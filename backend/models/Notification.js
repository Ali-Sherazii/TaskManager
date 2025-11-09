/**
 * Notification Model
 * 
 * Stores notifications for users that appear on their dashboard.
 * Notifications persist until acknowledged (marked as read) or deleted.
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for faster queries by user
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null // null for non-task notifications
  },
  type: {
    type: String,
    enum: ['task_reminder', 'task_assigned', 'task_updated', 'task_completed', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true // Index for faster queries of unread notifications
  },
  readAt: {
    type: Date,
    default: null
  },
  // Additional data for task reminders
  dueDate: {
    type: Date,
    default: null
  },
  hoursUntilDue: {
    type: Number,
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Compound index for efficient queries: user + unread status
notificationSchema.index({ userId: 1, isRead: 1 });

// Index for task-related notifications
notificationSchema.index({ taskId: 1 });

// Index for sorting by creation date
notificationSchema.index({ createdAt: -1 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, isRead: false });
};

// Static method to get all notifications for a user
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const { limit = 50, skip = 0, unreadOnly = false } = options;
  
  const query = { userId };
  if (unreadOnly) {
    query.isRead = false;
  }
  
  return await this.find(query)
    .populate('taskId', 'title status priority dueDate')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Create and export Notification model
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

