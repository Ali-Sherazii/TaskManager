# Task Management System

A full-stack web application for managing tasks with role-based access control, real-time notifications, and automated email reminders. Built with Node.js, Express.js, MongoDB, and React.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Role-Based Access Control](#role-based-access-control)
- [Email Features](#email-features)
- [Notification System](#notification-system)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Overview

The Task Management System is a comprehensive solution for organizing and tracking tasks within teams. It provides secure user authentication, granular role-based permissions, automated task reminders, and real-time notifications. The system ensures that users stay informed about their tasks through both email notifications and an interactive dashboard.

## Features

### Core Functionality

- **User Authentication**: Secure JWT-based authentication with email verification
- **Role-Based Access Control**: Three-tier permission system (Admin, Manager, User)
- **Task Management**: Complete CRUD operations with role-based restrictions
- **User Management**: Admin-only user administration
- **Automated Reminders**: Scheduled email notifications for upcoming tasks
- **Real-Time Notifications**: Server-Sent Events (SSE) for instant dashboard updates
- **Email Verification**: Token-based email verification during registration
- **Session Management**: Database-backed session storage with revocation capability

### Task Features

- Create, read, update, and delete tasks
- Assign tasks to users
- Set task priority (low, medium, high)
- Track task status (pending, in-progress, completed, cancelled)
- Set due dates with automated reminders
- Filter and search tasks
- Pagination support for large datasets

### Notification Features

- Real-time notification delivery via Server-Sent Events
- Email notifications for task assignments
- Email reminders for upcoming tasks (configurable thresholds)
- Dashboard notification menu with unread count
- Mark notifications as read
- Delete notifications
- Persistent notification storage

### Email Features

- Welcome emails upon successful registration
- Email verification tokens for account activation
- Task assignment notifications
- Automated task reminders at configurable intervals
- HTML email templates with professional styling
- Support for multiple email providers (Gmail, SendGrid, Mailgun, SMTP)

## Technology Stack

### Backend

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JSON Web Tokens (JWT)**: Authentication tokens
- **bcryptjs**: Password hashing
- **express-validator**: Input validation
- **node-cron**: Scheduled task reminders
- **nodemailer**: Email service
- **helmet**: Security headers
- **express-rate-limit**: Rate limiting
- **cors**: Cross-origin resource sharing

### Frontend

- **React**: UI framework
- **Vite**: Build tool and development server
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **date-fns**: Date formatting
- **Context API**: State management

## Project Structure

```
TaskManager/
├── backend/
│   ├── config/
│   │   ├── config.js              # Configuration management
│   │   └── database.js            # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   ├── taskController.js      # Task CRUD operations
│   │   ├── userController.js      # User management
│   │   └── notificationController.js  # Notification management
│   ├── middleware/
│   │   ├── auth.js                # Authentication middleware
│   │   ├── validation.js          # Input validation rules
│   │   └── security.js            # Security middleware
│   ├── models/
│   │   ├── User.js                # User schema
│   │   ├── Task.js                # Task schema
│   │   ├── Session.js             # Session schema
│   │   └── Notification.js        # Notification schema
│   ├── routes/
│   │   ├── authRoutes.js          # Authentication endpoints
│   │   ├── taskRoutes.js          # Task endpoints
│   │   ├── userRoutes.js          # User endpoints
│   │   ├── notificationRoutes.js  # Notification endpoints
│   │   └── notificationSSE.js    # Server-Sent Events endpoint
│   ├── services/
│   │   ├── emailService.js        # Email sending service
│   │   ├── reminderService.js     # Automated reminder service
│   │   ├── notificationService.js # Notification creation
│   │   └── sseService.js          # SSE connection management
│   ├── server.js                  # Main entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx         # Main layout component
│   │   │   ├── NotificationMenu.jsx  # Notification dropdown
│   │   │   ├── TaskModal.jsx      # Task creation/edit modal
│   │   │   └── UserModal.jsx     # User creation/edit modal
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx   # Authentication context
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Login page
│   │   │   ├── Register.jsx      # Registration page
│   │   │   ├── VerifyEmail.jsx   # Email verification page
│   │   │   ├── ResendVerification.jsx  # Resend verification page
│   │   │   ├── Dashboard.jsx     # Dashboard page
│   │   │   ├── Tasks.jsx         # Tasks list page
│   │   │   └── Users.jsx         # Users management page
│   │   ├── services/
│   │   │   └── api.js            # API service layer
│   │   ├── App.jsx               # Main app component
│   │   └── main.jsx              # Entry point
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18 or higher
- MongoDB 4.4 or higher (local installation or MongoDB Atlas)
- npm or yarn package manager
- Email service account (Gmail, SendGrid, Mailgun, or SMTP)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TaskManager
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Configuration

### Backend Configuration

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/taskmanager

# Email Configuration
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Task Management System

# Email Verification Configuration
EMAIL_VERIFICATION_EXPIRATION_HOURS=24

# Reminder Configuration
REMINDER_THRESHOLDS=48,24,1
REMINDER_CHECK_INTERVAL=60
```

### Frontend Configuration

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3000/api
```

### MongoDB Setup

**Option 1: Local MongoDB**

1. Install MongoDB Community Server
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   mongod
   ```

**Option 2: MongoDB Atlas (Cloud)**

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create database user
4. Whitelist your IP address
5. Copy connection string to `MONGODB_URI`

### Email Service Setup

**Gmail Setup:**

1. Enable 2-Factor Authentication on your Google account
2. Generate App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Use the 16-character app password in `EMAIL_PASSWORD`

**SendGrid Setup:**

1. Create account at [SendGrid](https://sendgrid.com/)
2. Create API key with Mail Send permissions
3. Set `EMAIL_SERVICE=sendgrid`
4. Set `EMAIL_API_KEY=your-api-key`
5. Verify sender identity

**Mailgun Setup:**

1. Create account at [Mailgun](https://www.mailgun.com/)
2. Get SMTP credentials from domain settings
3. Set `EMAIL_SERVICE=mailgun`
4. Configure SMTP host, port, user, and password

## Running the Application

### Development Mode

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Production Mode

**Backend:**

```bash
cd backend
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
npm run preview
```

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>
```

#### Verify Email
```
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

#### Resend Verification Email
```
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Task Endpoints

#### Get All Tasks
```
GET /api/tasks?page=1&limit=10&status=pending&priority=high
Authorization: Bearer <token>
```

#### Get Task by ID
```
GET /api/tasks/:id
Authorization: Bearer <token>
```

#### Create Task
```
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive documentation",
  "assignedTo": "user-id",
  "status": "pending",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59.000Z"
}
```

#### Update Task
```
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in-progress",
  "priority": "medium"
}
```

#### Delete Task
```
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

### User Endpoints (Admin Only)

#### Get All Users
```
GET /api/users?page=1&limit=10
Authorization: Bearer <token>
```

#### Get User by ID
```
GET /api/users/:id
Authorization: Bearer <token>
```

#### Create User
```
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

#### Update User Role
```
PUT /api/users/:id/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "manager"
}
```

### Notification Endpoints

#### Get User Notifications
```
GET /api/notifications?page=1&limit=10&isRead=false
Authorization: Bearer <token>
```

#### Get Unread Count
```
GET /api/notifications/unread/count
Authorization: Bearer <token>
```

#### Mark Notification as Read
```
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```
PUT /api/notifications/read/all
Authorization: Bearer <token>
```

#### Delete Notification
```
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

#### Delete All Notifications
```
DELETE /api/notifications
Authorization: Bearer <token>
```

### Server-Sent Events

#### Notification Stream
```
GET /api/notifications/stream?token=<jwt-token>
```

Establishes a persistent connection for real-time notification delivery.

## Authentication

### Email Verification Flow

1. User registers with email address
2. System generates secure verification token
3. Verification email sent to user
4. User clicks link in email
5. Email verified, account activated
6. User can now log in

### JWT Token

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

Tokens are stored in the database as sessions and can be revoked. Default expiration is 24 hours.

## Role-Based Access Control

### Admin Role

- Full system access
- Create, read, update, delete all tasks
- User management (create, read, update roles)
- View all users and tasks
- Session revocation

### Manager Role

- Create and assign tasks
- Update tasks they created or are assigned to
- Delete tasks they created
- View users (for task assignment)
- View tasks they created or are assigned to
- Cannot manage users or delete other users' tasks

### User Role

- View only tasks assigned to them
- Update status of assigned tasks
- Cannot create, delete, or modify other task fields
- Cannot view other users' tasks

## Email Features

### Email Verification

- Token-based email verification during registration
- Secure 64-character hexadecimal tokens
- 24-hour token expiration (configurable)
- Resend verification email functionality
- Welcome email sent after successful verification

### Task Assignment Emails

- Automatic email notification when task is assigned
- Includes task title, description, due date, priority, and status
- HTML email template with professional styling

### Task Reminder Emails

- Automated reminders at configurable thresholds (default: 48h, 24h, 1h before due date)
- Includes task details and time remaining
- Priority-based styling
- Urgent notifications for tasks due within 24 hours

### Email Providers

The system supports multiple email providers:

- **Gmail**: Use App Password for authentication
- **SendGrid**: Use API key authentication
- **Mailgun**: Use SMTP credentials
- **Generic SMTP**: Any SMTP server

## Notification System

### Real-Time Notifications

- Server-Sent Events (SSE) for instant notification delivery
- Automatic reconnection on connection loss
- Heartbeat mechanism to keep connections alive
- User-specific notification streams

### Notification Types

- **Task Reminder**: Upcoming task due date notifications
- **Task Assigned**: Notification when task is assigned to user
- **Task Updated**: Notification when assigned task is updated
- **System Alert**: General system notifications

### Notification Features

- Unread count badge in navigation bar
- Dropdown menu with all notifications
- Mark individual notifications as read
- Mark all notifications as read
- Delete notifications
- Priority-based styling
- Task details and due dates displayed

### Notification Persistence

- All notifications stored in database
- Notifications persist until deleted
- Automatic cleanup of old read notifications (30+ days)
- User-specific notification access

## Development

### Backend Development

```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Vite development server with HMR
```

### Code Structure

- **Controllers**: Business logic and request handling
- **Models**: Database schemas and validation
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, validation, security
- **Services**: Background services (email, reminders, notifications)

### Environment Variables

All sensitive configuration should be stored in `.env` files and never committed to version control. See `.gitignore` for excluded files.

## Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use strong `JWT_SECRET` (minimum 32 characters)
3. Configure production MongoDB URI
4. Set up production email service
5. Use process manager (PM2) for Node.js:
   ```bash
   npm install -g pm2
   pm2 start server.js --name task-manager-api
   ```

### Frontend Deployment

1. Build production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy `dist` folder to static hosting (Netlify, Vercel, etc.)
3. Configure `VITE_API_URL` to point to production backend

### Security Checklist

- Use HTTPS in production
- Set strong JWT secret
- Enable rate limiting
- Configure CORS properly
- Use environment variables for secrets
- Enable Helmet security headers
- Regular security updates
- Monitor error logs

## Security

### Authentication Security

- JWT tokens with configurable expiration
- Database-backed session storage
- Session revocation capability
- Password hashing with bcrypt (10 rounds)
- Email verification required before login

### API Security

- Rate limiting on all endpoints
- Input validation and sanitization
- XSS protection
- CORS configuration
- Security headers (Helmet)
- Role-based authorization checks

### Data Security

- Password never stored in plain text
- Sensitive fields excluded from API responses
- Token-based email verification
- Secure token generation (crypto.randomBytes)
- Token expiration enforcement

## Troubleshooting

### Common Issues

**MongoDB Connection Error:**
- Verify MongoDB is running
- Check `MONGODB_URI` in `.env`
- Ensure network access for MongoDB Atlas

**Email Not Sending:**
- Verify `EMAIL_ENABLED=true`
- Check email credentials
- Check email service logs
- Verify sender email is verified (SendGrid/Mailgun)

**Login Fails After Registration:**
- Check email inbox for verification link
- Verify email address is correct
- Use resend verification if token expired

**Notifications Not Appearing:**
- Check SSE connection in browser console
- Verify token is valid
- Check backend logs for errors
- Ensure notification service is running

**Task Reminders Not Sending:**
- Verify reminder service is started
- Check `REMINDER_THRESHOLDS` configuration
- Verify tasks have due dates and assigned users
- Check email service configuration

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

Check server logs for detailed error messages and request information.

## License

ISC

## Support

For issues, questions, or contributions:
- Review error logs
- Check configuration files
- Verify environment variables
- Consult API documentation

---

**Version**: 1.0.0  
**Last Updated**: 2024
