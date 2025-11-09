# Task Management System REST API Documentation

## Overview

Production-ready Task Management System REST API with role-based access control, secure authentication, and automated reminders.

**Base URL:** `http://localhost:3000/api`

**Version:** 1.0.0

## Authentication

All endpoints (except registration and login) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## User Roles

- **Admin**: Full system access including user management and all task operations
- **Manager**: Can create and assign tasks, modify their own tasks
- **User**: Can only view assigned tasks and update their own task status

---

## Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Validation:**
- `username`: Required, 3-30 characters, alphanumeric + underscore only
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters
- `role`: Optional, must be 'admin', 'manager', or 'user' (default: 'user')

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or duplicate username/email
- `500 Internal Server Error`: Server error

---

### Login

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Server error

---

### Logout

**POST** `/api/auth/logout`

Invalidate current session token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Logout successful"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error

---

### Revoke User Sessions

**POST** `/api/auth/revoke-session/:userId`

Revoke all sessions for a specific user (Admin only, or user revoking their own sessions).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "All sessions revoked successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

## Task Endpoints

### Get All Tasks

**GET** `/api/tasks`

Retrieve tasks based on user role and optional filters.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, in-progress, completed, cancelled)
- `priority` (optional): Filter by priority (low, medium, high)
- `assignedTo` (optional): Filter by assigned user ID
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Role-Based Filtering:**
- **Admin**: Sees all tasks
- **Manager**: Sees tasks they created or are assigned to
- **User**: Sees only tasks assigned to them

**Response:** `200 OK`
```json
{
  "tasks": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Complete project documentation",
      "description": "Write comprehensive API documentation",
      "status": "in-progress",
      "priority": "high",
      "dueDate": "2024-01-15T10:00:00.000Z",
      "assignedTo": "507f1f77bcf86cd799439012",
      "assignedToUsername": "jane_smith",
      "createdBy": "507f1f77bcf86cd799439013",
      "createdByUsername": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Server error

---

### Get Task by ID

**GET** `/api/tasks/:id`

Retrieve a specific task by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "task": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation",
    "status": "in-progress",
    "priority": "high",
    "dueDate": "2024-01-15T10:00:00.000Z",
    "assignedTo": "507f1f77bcf86cd799439012",
    "assignedToUsername": "jane_smith",
    "createdBy": "507f1f77bcf86cd799439013",
    "createdByUsername": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Access denied (role-based restrictions)
- `404 Not Found`: Task not found
- `500 Internal Server Error`: Server error

---

### Create Task

**POST** `/api/tasks`

Create a new task (Admin and Manager only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "assignedTo": "507f1f77bcf86cd799439012",
  "status": "pending",
  "priority": "high",
  "dueDate": "2024-01-15T10:00:00.000Z"
}
```

**Validation:**
- `title`: Required, 1-200 characters
- `description`: Optional, max 1000 characters
- `assignedTo`: Optional, valid MongoDB ObjectId or null
- `status`: Optional, must be 'pending', 'in-progress', 'completed', or 'cancelled' (default: 'pending')
- `priority`: Optional, must be 'low', 'medium', or 'high' (default: 'medium')
- `dueDate`: Required, valid ISO 8601 date, must be in future

**Response:** `201 Created`
```json
{
  "message": "Task created successfully",
  "task": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation",
    "status": "pending",
    "priority": "high",
    "dueDate": "2024-01-15T10:00:00.000Z",
    "assignedTo": "507f1f77bcf86cd799439012",
    "assignedToUsername": "jane_smith",
    "createdBy": "507f1f77bcf86cd799439013",
    "createdByUsername": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or assigned user not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not Admin or Manager)
- `500 Internal Server Error`: Server error

---

### Update Task

**PUT** `/api/tasks/:id`

Update an existing task (role-based restrictions apply).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (All fields optional)
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "assignedTo": "507f1f77bcf86cd799439012",
  "status": "in-progress",
  "priority": "medium",
  "dueDate": "2024-01-20T10:00:00.000Z"
}
```

**Role-Based Restrictions:**
- **Admin**: Can update any task
- **Manager**: Can update tasks they created or are assigned to
- **User**: Can only update status of tasks assigned to them

**Response:** `200 OK`
```json
{
  "message": "Task updated successfully",
  "task": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Updated task title",
    "description": "Updated description",
    "status": "in-progress",
    "priority": "medium",
    "dueDate": "2024-01-20T10:00:00.000Z",
    "assignedTo": "507f1f77bcf86cd799439012",
    "assignedToUsername": "jane_smith",
    "createdBy": "507f1f77bcf86cd799439013",
    "createdByUsername": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-03T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or assigned user not found
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions or access denied
- `404 Not Found`: Task not found
- `500 Internal Server Error`: Server error

---

### Delete Task

**DELETE** `/api/tasks/:id`

Delete a task (Admin and Manager only).

**Headers:**
```
Authorization: Bearer <token>
```

**Role-Based Restrictions:**
- **Admin**: Can delete any task
- **Manager**: Can only delete tasks they created
- **User**: Cannot delete tasks

**Response:** `200 OK`
```json
{
  "message": "Task deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Task not found
- `500 Internal Server Error`: Server error

---

## User Management Endpoints (Admin Only)

### Get All Users

**GET** `/api/users`

Retrieve all users (Admin and Manager only - Managers can see users for task assignment).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

### Get User by ID

**GET** `/api/users/:id`

Retrieve a specific user by ID (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

### Create User

**POST** `/api/users`

Create a new user (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "jane_smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "manager"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "username": "jane_smith",
    "email": "jane@example.com",
    "role": "manager",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or duplicate username/email
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

### Update User Role

**PUT** `/api/users/:id/role`

Update a user's role (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "role": "manager"
}
```

**Validation:**
- `role`: Required, must be 'admin', 'manager', or 'user'

**Response:** `200 OK`
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "manager",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid role
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

---

## Utility Endpoints

### Health Check

**GET** `/health`

Check server and database status.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

---

### API Information

**GET** `/`

Get API information and available endpoints.

**Response:** `200 OK`
```json
{
  "message": "Task Management System API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "tasks": "/api/tasks",
    "users": "/api/users",
    "health": "/health"
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Validation error or invalid input
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Automated Reminder System

The system includes an automated reminder service that:
- Checks for tasks due within 48 hours
- Sends reminders for tasks that haven't been completed or cancelled
- Runs every hour automatically
- Logs reminder notifications to the console

**Reminder Criteria:**
- Task due date is within 48 hours
- Task status is not 'completed' or 'cancelled'
- Task is assigned to a user

---

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Session Management**: Database-backed session storage with expiration
3. **Role-Based Access Control**: Hierarchical permission system
4. **Input Validation**: Comprehensive validation on all endpoints
5. **Password Hashing**: bcrypt with salt rounds
6. **CORS Protection**: Configurable cross-origin resource sharing
7. **Error Handling**: Secure error messages without exposing internal details

---

## Rate Limiting

API endpoints are protected by rate limiting to prevent abuse:
- Authentication endpoints: 5 requests per 15 minutes per IP
- Task endpoints: 100 requests per 15 minutes per user
- User management endpoints: 50 requests per 15 minutes per user

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Validate input** on the client side before sending requests
3. **Handle errors gracefully** and display user-friendly messages
4. **Use pagination** for large datasets
5. **Store tokens securely** (e.g., in httpOnly cookies or secure storage)
6. **Refresh tokens** before they expire
7. **Implement proper error handling** in your client application

---

## Support

For issues or questions, please contact the development team or refer to the project documentation.


