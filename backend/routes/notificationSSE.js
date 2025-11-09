/**
 * Server-Sent Events (SSE) Route for Real-time Notifications
 * 
 * Provides real-time notification delivery to the frontend dashboard.
 * Uses Server-Sent Events (SSE) for one-way communication from server to client.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Notification = require('../models/Notification');
const { addConnection, removeConnection, broadcastUnreadCount } = require('../services/sseService');

/**
 * SSE Endpoint for Real-time Notifications
 * 
 * GET /api/notifications/stream?token=<jwt-token>
 * 
 * Establishes an SSE connection that sends notifications to the client in real-time.
 * Only sends notifications for the authenticated user.
 * 
 * Note: EventSource doesn't support custom headers, so token is passed as query parameter.
 */
router.get('/stream', async (req, res, next) => {
  // Extract token from query parameter (EventSource limitation) or Authorization header
  const token = req.query.token || (req.headers.authorization?.startsWith('Bearer ') 
    ? req.headers.authorization.substring(7) 
    : null);
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Manually authenticate using the token
  try {
    const jwt = require('jsonwebtoken');
    const config = require('../../config/config');
    const User = require('../../models/User');
    const Session = require('../../models/Session');

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Check if session exists and is valid
    const session = await Session.findOne({
      token,
      expiresAt: { $gt: new Date() }
    });
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Get user details
    const user = await User.findById(decoded.userId).select('id username email role');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user info to request for use below
    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }

  const userId = req.user.id;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Notification stream connected' })}\n\n`);

  // Store connection
  addConnection(userId, res);

  // Send initial unread count
  Notification.countDocuments({ userId, isRead: false })
    .then(count => {
      res.write(`data: ${JSON.stringify({ type: 'unread_count', count })}\n\n`);
    })
    .catch(err => {
      console.error('Error getting initial unread count:', err);
    });

  // Handle client disconnect
  req.on('close', () => {
    removeConnection(userId);
    console.log(`SSE connection closed for user ${userId}`);
  });

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    try {
      // Check if this specific connection is still active
      const { getConnection } = require('../services/sseService');
      const connection = getConnection(userId);
      
      if (connection && connection === res) {
        res.write(`: heartbeat\n\n`);
      } else {
        clearInterval(heartbeat);
        removeConnection(userId);
      }
    } catch (error) {
      clearInterval(heartbeat);
      removeConnection(userId);
    }
  }, 30000); // Send heartbeat every 30 seconds
});

module.exports = router;

