/**
 * Configuration Module
 * 
 * This file loads environment variables from .env file and exports configuration.
 */

require('dotenv').config();

module.exports = {
  // JWT Secret: Used to sign and verify authentication tokens
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  
  // JWT Expiration: How long tokens remain valid
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Server Port: Port number the server listens on
  port: process.env.PORT || 3000,
  
  // Environment: 'development' or 'production'
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB Connection String
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager',
  
  // Email Configuration
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    service: process.env.EMAIL_SERVICE || 'gmail', // 'gmail', 'sendgrid', 'mailgun', or 'smtp'
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    apiKey: process.env.EMAIL_API_KEY, // For SendGrid
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    fromName: process.env.EMAIL_FROM_NAME || 'Task Management System',
    rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false'
  },
  
  // Reminder Configuration
  reminders: {
    // Time thresholds in hours before due date to send reminders
    // Multiple thresholds can be configured (e.g., 48 hours, 24 hours, 1 hour)
    thresholds: process.env.REMINDER_THRESHOLDS 
      ? process.env.REMINDER_THRESHOLDS.split(',').map(h => parseInt(h.trim(), 10)).filter(h => !isNaN(h))
      : [48, 24, 1], // Default: 48 hours, 24 hours, and 1 hour before due date
    // Check interval in minutes (how often to check for upcoming tasks)
    checkInterval: parseInt(process.env.REMINDER_CHECK_INTERVAL) || 60 // Default: every 60 minutes (1 hour)
  },
  
  // Email Verification Configuration
  emailVerification: {
    // Token expiration time in hours
    tokenExpirationHours: parseInt(process.env.EMAIL_VERIFICATION_EXPIRATION_HOURS) || 24,
    // Frontend URL for verification link
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  }
};
