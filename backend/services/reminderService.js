/**
 * Automated Reminder Service
 * 
 * Uses MongoDB/Mongoose to check for upcoming tasks.
 * Creates notifications in the database for dashboard display.
 */

const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendTaskReminderEmail } = require('./emailService');
const config = require('../config/config');
const { broadcastNotification, broadcastUnreadCount } = require('../services/sseService');

/**
 * Create Notification
 * 
 * Creates a notification in the database for the user's dashboard.
 */
const createNotification = async (task, user, hoursUntilDue) => {
  try {
    const dueDate = new Date(task.dueDate);
    
    // Determine notification priority based on time remaining
    let priority = 'medium';
    if (hoursUntilDue < 1) {
      priority = 'high';
    } else if (hoursUntilDue < 24) {
      priority = 'high';
    } else if (hoursUntilDue < 48) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    // Format time remaining message
    let timeRemaining;
    if (hoursUntilDue < 1) {
      timeRemaining = 'less than an hour';
    } else if (hoursUntilDue < 24) {
      timeRemaining = `${Math.round(hoursUntilDue)} hour${Math.round(hoursUntilDue) !== 1 ? 's' : ''}`;
    } else {
      const days = Math.round(hoursUntilDue / 24);
      timeRemaining = `${days} day${days !== 1 ? 's' : ''}`;
    }

    // Create notification
    const notification = new Notification({
      userId: user._id,
      taskId: task._id,
      type: 'task_reminder',
      title: `Task Reminder: ${task.title}`,
      message: `Your task "${task.title}" is due ${timeRemaining}. ${task.description ? `Description: ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}` : ''}`,
      priority,
      dueDate: dueDate,
      hoursUntilDue: Math.round(hoursUntilDue * 10) / 10 // Round to 1 decimal place
    });

    await notification.save();
    console.log(`Notification created for user ${user.username} for task: ${task.title}`);
    
    // Broadcast notification via SSE if user has active connection
    broadcastNotification(user._id.toString(), {
      ...notification.toObject(),
      id: notification._id.toString(),
      userId: notification.userId.toString(),
      taskId: notification.taskId ? notification.taskId.toString() : null
    });
    
    // Update unread count
    broadcastUnreadCount(user._id.toString());
    
    return notification;
  } catch (error) {
    console.error(`Error creating notification for user ${user.username}:`, error);
    // Don't throw error, continue with other reminders
    return null;
  }
};

/**
 * Send Reminder
 * 
 * Creates notification in database and sends reminder via email.
 */
const sendReminder = async (task, user, hoursUntilDue) => {
  const dueDate = new Date(task.dueDate);

  // Log to console
  console.log(`\nREMINDER NOTIFICATION`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`To: ${user.email} (${user.username})`);
  console.log(`Task: ${task.title}`);
  console.log(`Description: ${task.description || 'N/A'}`);
  console.log(`Priority: ${task.priority.toUpperCase()}`);
  console.log(`Due Date: ${dueDate.toLocaleString()}`);
  console.log(`Time Remaining: ${hoursUntilDue.toFixed(1)} hours`);
  console.log(`Status: ${task.status}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Create notification in database for dashboard
  await createNotification(task, user, hoursUntilDue);

  // Send email reminder
  try {
    const result = await sendTaskReminderEmail(user.email, user.username, task);
    if (result.success) {
      console.log(`Reminder email sent to ${user.email} for task: ${task.title}`);
    } else {
      console.error(`Failed to send reminder email to ${user.email}:`, result.error);
    }
  } catch (error) {
    console.error(`Error sending reminder email to ${user.email}:`, error);
    // Don't throw error, continue with other reminders
  }
};

/**
 * Check Upcoming Tasks
 * 
 * Checks for tasks approaching their due date based on configured thresholds.
 * Creates notifications for each threshold that hasn't been sent yet.
 */
const checkUpcomingTasks = async () => {
  try {
    const now = new Date();
    const thresholds = config.reminders.thresholds;
    
    // Get the maximum threshold to determine how far ahead to look
    const maxThreshold = Math.max(...thresholds);
    const maxThresholdDate = new Date(now.getTime() + maxThreshold * 60 * 60 * 1000);

    // Get tasks due within the maximum threshold that haven't been completed
    const upcomingTasks = await Task.find({
      dueDate: {
        $gt: now,
        $lte: maxThresholdDate
      },
      status: { $nin: ['completed', 'cancelled'] },
      assignedTo: { $ne: null }
    })
    .populate('assignedTo', 'username email')
    .sort({ dueDate: 1 });

    // Process each task
    for (const task of upcomingTasks) {
      const dueDate = new Date(task.dueDate);
      const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

      // Check each threshold
      for (const threshold of thresholds) {
        // Check if task is within this threshold window
        // We check if hoursUntilDue is between threshold and threshold+1 (to avoid duplicates)
        if (hoursUntilDue <= threshold && hoursUntilDue > threshold - 1) {
          // Check if we've already sent a notification for this threshold
          const reminderKey = `${task._id}-${threshold}`;
          
          // Check if notification already exists for this task and threshold
          const existingNotification = await Notification.findOne({
            taskId: task._id,
            userId: task.assignedTo._id,
            type: 'task_reminder',
            createdAt: {
              $gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) // Within last 2 hours
            }
          });

          if (!existingNotification) {
            await sendReminder(task, task.assignedTo, hoursUntilDue);
          }
        }
      }
    }

    // Clean up old notifications (older than 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true // Only delete read notifications
    });
  } catch (error) {
    console.error('Error checking upcoming tasks:', error);
  }
};

/**
 * Start Reminder Service
 * 
 * Starts the automated reminder checking service.
 * Uses configurable check interval from environment variables.
 */
const startReminderService = () => {
  const checkInterval = config.reminders.checkInterval;
  const thresholds = config.reminders.thresholds;
  
  console.log(`Reminder service started`);
  console.log(`  Check interval: ${checkInterval} minutes`);
  console.log(`  Reminder thresholds: ${thresholds.join(', ')} hours before due date`);
  
  // Run immediately on startup
  checkUpcomingTasks();
  
  // Schedule to run at configured interval
  // Convert minutes to cron format (runs every N minutes)
  const cronExpression = `*/${checkInterval} * * * *`;
  cron.schedule(cronExpression, () => {
    checkUpcomingTasks();
  });
};

module.exports = {
  startReminderService,
  checkUpcomingTasks
};
