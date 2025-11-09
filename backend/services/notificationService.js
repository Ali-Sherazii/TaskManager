/**
 * Notification Service
 * 
 * Helper service for creating notifications in the system.
 * Used by task controller and reminder service.
 */

const Notification = require('../models/Notification');
const { broadcastNotification, broadcastUnreadCount } = require('../services/sseService');
const { sendTaskAssignmentEmail } = require('./emailService');

/**
 * Create Task Assignment Notification
 * 
 * Creates a notification when a task is assigned to a user.
 */
const createTaskAssignmentNotification = async (task, assignedUser) => {
  try {
    const notification = new Notification({
      userId: assignedUser._id,
      taskId: task._id,
      type: 'task_assigned',
      title: `New Task Assigned: ${task.title}`,
      message: `You have been assigned a new task: "${task.title}". ${task.description ? `Description: ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}` : ''}`,
      priority: task.priority || 'medium',
      dueDate: task.dueDate
    });

    await notification.save();
    console.log(`Task assignment notification created for user ${assignedUser.username}`);
    
    // Send email notification
    try {
      const result = await sendTaskAssignmentEmail(assignedUser.email, assignedUser.username, task);
      if (result.success) {
        console.log(`Task assignment email sent to ${assignedUser.email} for task: ${task.title}`);
      } else {
        console.error(`Failed to send task assignment email to ${assignedUser.email}:`, result.error);
      }
    } catch (error) {
      console.error(`Error sending task assignment email to ${assignedUser.email}:`, error);
      // Don't fail notification creation if email fails
    }
    
    // Broadcast notification via SSE if user has active connection
    broadcastNotification(assignedUser._id.toString(), {
      ...notification.toObject(),
      id: notification._id.toString(),
      userId: notification.userId.toString(),
      taskId: notification.taskId ? notification.taskId.toString() : null
    });
    
    // Update unread count
    broadcastUnreadCount(assignedUser._id.toString());
    
    return notification;
  } catch (error) {
    console.error(`Error creating task assignment notification:`, error);
    return null;
  }
};

/**
 * Create Task Update Notification
 * 
 * Creates a notification when a task assigned to a user is updated.
 */
const createTaskUpdateNotification = async (task, assignedUser, changes = []) => {
  try {
    const changeMessages = changes.length > 0 
      ? ` Changes: ${changes.join(', ')}.`
      : '';
    
    const notification = new Notification({
      userId: assignedUser._id,
      taskId: task._id,
      type: 'task_updated',
      title: `Task Updated: ${task.title}`,
      message: `The task "${task.title}" has been updated.${changeMessages}`,
      priority: task.priority || 'medium',
      dueDate: task.dueDate
    });

    await notification.save();
    console.log(`Task update notification created for user ${assignedUser.username}`);
    
    // Broadcast notification via SSE if user has active connection
    broadcastNotification(assignedUser._id.toString(), {
      ...notification.toObject(),
      id: notification._id.toString(),
      userId: notification.userId.toString(),
      taskId: notification.taskId ? notification.taskId.toString() : null
    });
    
    // Update unread count
    broadcastUnreadCount(assignedUser._id.toString());
    
    return notification;
  } catch (error) {
    console.error(`Error creating task update notification:`, error);
    return null;
  }
};

module.exports = {
  createTaskAssignmentNotification,
  createTaskUpdateNotification
};

