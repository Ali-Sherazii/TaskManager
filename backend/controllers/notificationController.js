/**
 * Notification Controller
 * 
 * Handles all notification-related operations with strict role-based access control.
 * Users can only access their own notifications.
 */

const Notification = require('../models/Notification');
const Task = require('../models/Task');
const { broadcastUnreadCount } = require('../services/sseService');

/**
 * Get User Notifications
 * 
 * Returns notifications for the authenticated user only.
 * Role: All authenticated users (Admin, Manager, User)
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, unreadOnly = false } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Build query - users can only see their own notifications
    const query = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Get notifications
    const notifications = await Notification.find(query)
      .populate('taskId', 'title status priority dueDate assignedTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Format notifications
    const formattedNotifications = notifications.map(notif => ({
      ...notif.toObject(),
      id: notif._id.toString(),
      userId: notif.userId.toString(),
      taskId: notif.taskId ? notif.taskId._id.toString() : null
    }));

    // Get unread count
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      notifications: formattedNotifications,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get Unread Count
 * 
 * Returns the count of unread notifications for the authenticated user.
 * Role: All authenticated users
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({ userId, isRead: false });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Mark Notification as Read
 * 
 * Marks a specific notification as read.
 * Users can only mark their own notifications as read.
 * Role: All authenticated users
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find notification and verify ownership
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Security check: Users can only mark their own notifications as read
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only mark your own notifications as read.' });
    }

    // Mark as read
    await notification.markAsRead();

    // Broadcast updated unread count
    broadcastUnreadCount(userId);

    res.json({
      message: 'Notification marked as read',
      notification: {
        ...notification.toObject(),
        id: notification._id.toString()
      }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Mark All Notifications as Read
 * 
 * Marks all unread notifications for the authenticated user as read.
 * Role: All authenticated users
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { 
        $set: { 
          isRead: true, 
          readAt: new Date() 
        } 
      }
    );

    // Broadcast updated unread count
    broadcastUnreadCount(userId);

    res.json({
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete Notification
 * 
 * Deletes a specific notification.
 * Users can only delete their own notifications.
 * Role: All authenticated users
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find notification and verify ownership
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Security check: Users can only delete their own notifications
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own notifications.' });
    }

    // Delete notification
    await Notification.findByIdAndDelete(id);

    // Broadcast updated unread count
    broadcastUnreadCount(userId);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete All Notifications
 * 
 * Deletes all notifications for the authenticated user.
 * Role: All authenticated users
 */
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all notifications for this user
    const result = await Notification.deleteMany({ userId });

    // Broadcast updated unread count
    broadcastUnreadCount(userId);

    res.json({
      message: 'All notifications deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
};

