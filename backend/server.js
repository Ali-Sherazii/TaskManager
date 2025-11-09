/**
 * Task Management System - Main Server File
 * 
 * This is the entry point of the backend application.
 * It sets up Express server, middleware, routes, and starts the server.
 * 
 * Key Concepts:
 * - Express.js: Web framework for Node.js
 * - Middleware: Functions that process requests before they reach routes
 * - Routes: Define API endpoints and their handlers
 * - CORS: Allows frontend to communicate with backend
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/config');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const reminderService = require('./services/reminderService');
const {
  securityHeaders,
  sanitizeInput
} = require('./middleware/security');

// Import route handlers
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Create Express application instance
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Security headers (Helmet)
if (config.nodeEnv === 'production') {
  app.use(securityHeaders);
}

// ============================================
// MIDDLEWARE SETUP
// ============================================

// CORS (Cross-Origin Resource Sharing) - Allows frontend to access API
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse cookies from request headers
app.use(cookieParser());

// Parse JSON request bodies (converts JSON strings to JavaScript objects)
app.use(express.json({ limit: '10mb' })); // Limit payload size

// Parse URL-encoded request bodies (for form data)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization (basic XSS protection)
app.use(sanitizeInput);

// Request logging middleware - logs every incoming request
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next(); // Pass control to next middleware/route
});

// ============================================
// ROUTE SETUP
// ============================================

// Authentication routes (login, register, logout)
app.use('/api/auth', authRoutes);

// Task management routes (CRUD operations)
app.use('/api/tasks', taskRoutes);

// User management routes (Admin only)
app.use('/api/users', userRoutes);

// Notification routes (All authenticated users - access only their own notifications)
app.use('/api/notifications', notificationRoutes);

// SSE route for real-time notifications (no rate limiting for SSE)
const notificationSSE = require('./routes/notificationSSE');
app.use('/api/notifications', notificationSSE);

// ============================================
// UTILITY ENDPOINTS
// ============================================

// Health check endpoint - used to verify server is running
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    message: 'Task Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tasks: '/api/tasks',
      users: '/api/users',
      health: '/health'
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// Global error handler - catches all errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler - catches all undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = config.port;

// Initialize database and start server
async function startServer() {
  try {
    // Connect to MongoDB first
    console.log('Connecting to MongoDB...');
    await connectDatabase();
    
    // Start the server and listen on specified port
    app.listen(PORT, () => {
      console.log(`\nServer running on http://localhost:${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`\nAvailable endpoints:`);
      console.log(`  POST   /api/auth/register`);
      console.log(`  POST   /api/auth/login`);
      console.log(`  POST   /api/auth/logout`);
      console.log(`  GET    /api/tasks`);
      console.log(`  POST   /api/tasks`);
      console.log(`  GET    /api/tasks/:id`);
      console.log(`  PUT    /api/tasks/:id`);
      console.log(`  DELETE /api/tasks/:id`);
      console.log(`  GET    /api/users`);
      console.log(`  POST   /api/users`);
      console.log(`  GET    /api/users/:id`);
      console.log(`  PUT    /api/users/:id/role`);
      console.log(`  GET    /api/notifications`);
      console.log(`  GET    /api/notifications/unread/count`);
      console.log(`  GET    /api/notifications/stream (SSE)`);
      console.log(`  PUT    /api/notifications/:id/read`);
      console.log(`  PUT    /api/notifications/read/all`);
      console.log(`  DELETE /api/notifications/:id`);
      console.log(`  DELETE /api/notifications`);
      console.log(`\n`);
    });

    // Start automated reminder service
    reminderService.startReminderService();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

// Handle process termination signals
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});
