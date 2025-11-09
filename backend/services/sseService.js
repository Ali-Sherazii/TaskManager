/**
 * Server-Sent Events (SSE) Service
 * 
 * Manages SSE connections and broadcasts notifications to connected clients.
 * Separated from routes to avoid circular dependencies.
 */

// Store active SSE connections per user
const activeConnections = new Map();

/**
 * Add SSE Connection
 * 
 * Registers a new SSE connection for a user.
 */
const addConnection = (userId, response) => {
  activeConnections.set(userId, response);
};

/**
 * Remove SSE Connection
 * 
 * Removes an SSE connection when client disconnects.
 */
const removeConnection = (userId) => {
  activeConnections.delete(userId);
};

/**
 * Broadcast Notification to User
 * 
 * Sends a notification to a specific user's SSE connection if active.
 */
const broadcastNotification = (userId, notification) => {
  const connection = activeConnections.get(userId);
  if (connection) {
    try {
      connection.write(`data: ${JSON.stringify({ type: 'notification', notification })}\n\n`);
    } catch (error) {
      console.error(`Error broadcasting notification to user ${userId}:`, error);
      activeConnections.delete(userId);
    }
  }
};

/**
 * Broadcast Unread Count Update
 * 
 * Updates the unread count for a specific user's SSE connection.
 */
const broadcastUnreadCount = async (userId) => {
  const connection = activeConnections.get(userId);
  if (connection) {
    try {
      const Notification = require('../models/Notification');
      const count = await Notification.countDocuments({ userId, isRead: false });
      connection.write(`data: ${JSON.stringify({ type: 'unread_count', count })}\n\n`);
    } catch (error) {
      console.error(`Error broadcasting unread count to user ${userId}:`, error);
    }
  }
};

/**
 * Get Active Connection Count
 * 
 * Returns the number of active SSE connections.
 */
const getActiveConnectionCount = () => {
  return activeConnections.size;
};

/**
 * Get Connection for User
 * 
 * Returns the SSE connection for a specific user.
 */
const getConnection = (userId) => {
  return activeConnections.get(userId);
};

module.exports = {
  addConnection,
  removeConnection,
  broadcastNotification,
  broadcastUnreadCount,
  getActiveConnectionCount,
  getConnection
};

