# Task Management System REST API - Production Ready

## Overview

A production-ready, secure Task Management System REST API built with Node.js, Express.js, and MongoDB. The system implements comprehensive role-based access control, secure authentication, automated reminders, and follows industry best practices for security and scalability.

## Features

### Core Functionality
- User Authentication: JWT-based authentication with session management
- Role-Based Access Control: Admin, Manager, and User roles with hierarchical permissions
- Task Management: Complete CRUD operations with role-based restrictions
- User Management: Admin-only user management endpoints
- Automated Reminders: Scheduled task reminders for upcoming due dates
- Pagination: Efficient pagination for large datasets
- Filtering & Sorting: Advanced filtering and sorting capabilities

### Security Features
- Helmet.js: Security headers protection
- Rate Limiting: Protection against abuse and DDoS attacks
- Input Sanitization: XSS protection
- Password Hashing: bcrypt with salt rounds
- Session Management: Database-backed session storage
- CORS Protection: Configurable cross-origin resource sharing
- Input Validation: Comprehensive validation on all endpoints

### Production Features
- Error Handling: Comprehensive error handling with detailed responses
- Logging: Request logging with timestamps and IP addresses
- Health Checks: Health check endpoint for monitoring
- Graceful Shutdown: Proper cleanup on server shutdown
- Environment Configuration: Environment-based configuration
- Database Indexing: Optimized database queries with indexes

## Requirements

- Node.js 18+
- MongoDB 4.4+ (local or MongoDB Atlas)
- npm or yarn

## Installation

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB:**
   ```bash
   # Local MongoDB
   mongod

   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env
   ```

4. **Start Server:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/taskmanager
```

## Documentation

- [API Documentation](./API_DOCUMENTATION.md): Complete API reference
- [Production Guide](./PRODUCTION_GUIDE.md): Production deployment guide
- [Testing Guide](./TESTING_GUIDE.md): Testing instructions and examples
- [MongoDB Setup](./MONGODB_SETUP.md): MongoDB setup instructions
- [Email Setup](./EMAIL_SETUP.md): Email service setup instructions
- [Troubleshooting](./TROUBLESHOOTING.md): Common issues and solutions

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/revoke-session/:userId` - Revoke user sessions

### Tasks
- `GET /api/tasks` - Get all tasks (with pagination and filters)
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task (Admin/Manager only)
- `PUT /api/tasks/:id` - Update task (role-based restrictions)
- `DELETE /api/tasks/:id` - Delete task (Admin/Manager only)

### Users
- `GET /api/users` - Get all users (Admin/Manager only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id/role` - Update user role (Admin only)

### Utilities
- `GET /health` - Health check endpoint
- `GET /` - API information

## Security

### Authentication
- JWT tokens with configurable expiration
- Database-backed session storage
- Session revocation capability
- Password hashing with bcrypt

### Authorization
- Role-based access control (RBAC)
- Hierarchical permissions
- Endpoint-level authorization checks
- User-specific data access

### Protection
- Rate limiting (prevents abuse)
- Input sanitization (XSS protection)
- Security headers (Helmet.js)
- CORS configuration
- Input validation (express-validator)

## Role-Based Access Control

### Admin
- Full system access
- User management
- All task operations
- Session revocation

### Manager
- Create and assign tasks
- Update tasks they created or are assigned to
- Delete tasks they created
- View users (for task assignment)
- View tasks they created or are assigned to

### User
- View assigned tasks only
- Update status of assigned tasks
- Cannot create, delete, or modify other task fields

## Automated Reminders

The system includes an automated reminder service that:
- Checks for tasks due within 48 hours
- Sends email reminders for incomplete tasks
- Runs every hour automatically
- Logs reminder notifications to console
- Sends HTML email notifications with task details

## Email Service

The system sends emails for:
- Welcome emails: Sent when users register
- Task reminders: Sent for upcoming tasks (48-hour window)

### Email Providers Supported:
- Gmail (Development)
- SendGrid (Production recommended)
- Mailgun (Production)
- Generic SMTP (Any SMTP server)

See [EMAIL_SETUP.md](./EMAIL_SETUP.md) for detailed setup instructions.

## Performance

### Optimizations
- Database indexing for faster queries
- Pagination for large datasets
- Efficient query construction
- Response caching (can be added)

### Monitoring
- Request logging
- Error tracking
- Performance metrics
- Health check endpoint

## Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.

### Quick Test
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Create task (use token from login)
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Test Task","dueDate":"2024-12-31T23:59:59.000Z"}'
```

## Deployment

See [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md) for detailed deployment instructions.

### Quick Deployment
1. Set up MongoDB (local or Atlas)
2. Configure environment variables
3. Install dependencies
4. Start with PM2: `pm2 start server.js`
5. Set up reverse proxy (Nginx)
6. Configure SSL certificate

## Best Practices

1. **Security:**
   - Use strong JWT secrets
   - Enable HTTPS in production
   - Regular security updates
   - Monitor for vulnerabilities

2. **Performance:**
   - Use database indexes
   - Implement caching
   - Optimize queries
   - Monitor performance

3. **Maintenance:**
   - Regular backups
   - Log monitoring
   - Error tracking
   - Performance monitoring

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

### Common Issues
- Database connection errors
- Authentication failures
- Rate limiting triggers
- Validation errors

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues or questions:
- Check documentation
- Review error logs
- Consult troubleshooting guide
- Contact development team

## Acknowledgments

Built with:
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Helmet
- express-rate-limit
- node-cron
- nodemailer

---

**Ready for Production!**

This API is production-ready with comprehensive security, error handling, and documentation. Follow the deployment guide to get started!

