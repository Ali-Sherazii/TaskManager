/**
 * Security Middleware
 * 
 * Provides security enhancements for production deployment:
 * - Helmet: Security headers
 * - Rate Limiting: Prevent abuse
 * - Request Sanitization: XSS protection
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Security Headers Middleware
 * 
 * Uses Helmet to set various HTTP headers for security:
 * - Content Security Policy
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - X-XSS-Protection
 * - Strict-Transport-Security (HSTS)
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow cross-origin resources
});

/**
 * General Rate Limiter
 * 
 * Limits requests from same IP to prevent abuse.
 * Applied to all API routes.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Authentication Rate Limiter
 * 
 * Stricter rate limiting for authentication endpoints
 * to prevent brute force attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Task Operation Rate Limiter
 * 
 * Rate limiting for task-related operations.
 */
const taskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many task requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * User Management Rate Limiter
 * 
 * Rate limiting for user management operations (Admin only).
 */
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many user management requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Input Sanitization Middleware
 * 
 * Basic XSS protection by sanitizing user input.
 * Note: This is a basic implementation. For production,
 * consider using a dedicated sanitization library.
 */
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize object properties
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') : obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitize(obj[key]);
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Sanitize request query
  if (req.query) {
    req.query = sanitize(req.query);
  }

  // Sanitize request params
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

module.exports = {
  securityHeaders,
  generalLimiter,
  authLimiter,
  taskLimiter,
  userLimiter,
  sanitizeInput
};


