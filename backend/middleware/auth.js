/**
 * Authentication & Authorization Middleware
 * 
 * Uses MongoDB/Mongoose for session and user lookups.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const Session = require('../models/Session');

/**
 * Authentication Middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
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

    // Attach user info to request
    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    };
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Authorization Middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
