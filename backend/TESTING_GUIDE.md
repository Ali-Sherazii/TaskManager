# Testing Guide

## Overview

This guide provides instructions for testing the Task Management System REST API.

## Prerequisites

- Node.js 18+ installed
- MongoDB running
- API server running
- API testing tool (Postman, cURL, or similar)

---

## Manual Testing

### 1. User Registration

**Endpoint:** `POST /api/auth/register`

**Test Case 1: Successful Registration**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "user"
  }'
```

**Expected Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**Test Case 2: Duplicate Username**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test2@example.com",
    "password": "password123"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Username already exists"
}
```

**Test Case 3: Invalid Email**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "invalid-email",
    "password": "password123"
  }'
```

**Expected Response:** `400 Bad Request`
```json
{
  "error": "Invalid email format"
}
```

---

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Test Case 1: Successful Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**Expected Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**Test Case 2: Invalid Credentials**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "wrongpassword"
  }'
```

**Expected Response:** `401 Unauthorized`
```json
{
  "error": "Invalid credentials"
}
```

---

### 3. Create Task

**Endpoint:** `POST /api/tasks`

**Prerequisites:** Login and get token

**Test Case 1: Create Task (Admin/Manager)**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task",
    "priority": "high",
    "dueDate": "2024-12-31T23:59:59.000Z"
  }'
```

**Expected Response:** `201 Created`
```json
{
  "message": "Task created successfully",
  "task": {
    "id": "...",
    "title": "Test Task",
    "description": "This is a test task",
    "status": "pending",
    "priority": "high",
    "dueDate": "2024-12-31T23:59:59.000Z"
  }
}
```

**Test Case 2: Create Task as User (Should Fail)**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user-token>" \
  -d '{
    "title": "Test Task",
    "dueDate": "2024-12-31T23:59:59.000Z"
  }'
```

**Expected Response:** `403 Forbidden`
```json
{
  "error": "Insufficient permissions"
}
```

---

### 4. Get All Tasks

**Endpoint:** `GET /api/tasks`

**Test Case 1: Get Tasks (Admin)**
```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <admin-token>"
```

**Expected Response:** `200 OK`
```json
{
  "tasks": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

**Test Case 2: Get Tasks with Filters**
```bash
curl -X GET "http://localhost:3000/api/tasks?status=pending&priority=high&page=1&limit=5" \
  -H "Authorization: Bearer <token>"
```

**Expected Response:** `200 OK` with filtered tasks

---

### 5. Update Task

**Endpoint:** `PUT /api/tasks/:id`

**Test Case 1: Update Task (Admin)**
```bash
curl -X PUT http://localhost:3000/api/tasks/<task-id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "status": "in-progress",
    "priority": "medium"
  }'
```

**Expected Response:** `200 OK`
```json
{
  "message": "Task updated successfully",
  "task": {...}
}
```

**Test Case 2: Update Task Status (User)**
```bash
curl -X PUT http://localhost:3000/api/tasks/<task-id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user-token>" \
  -d '{
    "status": "completed"
  }'
```

**Expected Response:** `200 OK` (if task is assigned to user)

---

### 6. Delete Task

**Endpoint:** `DELETE /api/tasks/:id`

**Test Case 1: Delete Task (Admin)**
```bash
curl -X DELETE http://localhost:3000/api/tasks/<task-id> \
  -H "Authorization: Bearer <admin-token>"
```

**Expected Response:** `200 OK`
```json
{
  "message": "Task deleted successfully"
}
```

**Test Case 2: Delete Task (User - Should Fail)**
```bash
curl -X DELETE http://localhost:3000/api/tasks/<task-id> \
  -H "Authorization: Bearer <user-token>"
```

**Expected Response:** `403 Forbidden`
```json
{
  "error": "Insufficient permissions"
}
```

---

## Automated Testing

### Using Postman

1. **Import Collection:**
   - Create a new Postman collection
   - Add all API endpoints
   - Set up environment variables (token, base URL)

2. **Set Up Tests:**
   - Add tests for each endpoint
   - Verify status codes
   - Validate response structure
   - Test error cases

3. **Run Collection:**
   - Use Postman's collection runner
   - Set up test data
   - Run all tests

### Using cURL Scripts

Create test scripts:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"

# Register user
echo "Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }')

echo "Register response: $REGISTER_RESPONSE"

# Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

# Create task
echo "Creating task..."
TASK_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Task",
    "dueDate": "2024-12-31T23:59:59.000Z"
  }')

echo "Task response: $TASK_RESPONSE"
```

---

## Test Scenarios

### Role-Based Access Control

1. **Admin:**
   - Can create, read, update, delete any task
   - Can manage users
   - Can see all tasks

2. **Manager:**
   - Can create tasks
   - Can update tasks they created or are assigned to
   - Can delete tasks they created
   - Can see tasks they created or are assigned to
   - Can see users (for task assignment)

3. **User:**
   - Can only see tasks assigned to them
   - Can only update status of assigned tasks
   - Cannot create, delete, or update other fields

### Validation Testing

1. **Username Validation:**
   - Minimum 3 characters
   - Maximum 30 characters
   - Alphanumeric + underscore only
   - No spaces

2. **Email Validation:**
   - Valid email format
   - Unique email

3. **Password Validation:**
   - Minimum 6 characters

4. **Task Validation:**
   - Title: 1-200 characters
   - Description: Max 1000 characters
   - Due date: Must be in future
   - Status: Valid enum values
   - Priority: Valid enum values

### Error Handling

1. **401 Unauthorized:**
   - Missing token
   - Invalid token
   - Expired token

2. **403 Forbidden:**
   - Insufficient permissions
   - Role-based restrictions

3. **404 Not Found:**
   - Task not found
   - User not found

4. **400 Bad Request:**
   - Validation errors
   - Invalid input

5. **500 Internal Server Error:**
   - Server errors
   - Database errors

---

## Performance Testing

### Load Testing

Use tools like:
- **Apache JMeter**
- **Artillery**
- **k6**

### Test Scenarios

1. **Concurrent Requests:**
   - Test with multiple simultaneous requests
   - Verify rate limiting
   - Check response times

2. **Large Datasets:**
   - Test with large number of tasks
   - Verify pagination
   - Check query performance

3. **Stress Testing:**
   - Test system under high load
   - Verify error handling
   - Check resource usage

---

## Security Testing

### Authentication Testing

1. **Token Validation:**
   - Test with invalid token
   - Test with expired token
   - Test with missing token

2. **Session Management:**
   - Test logout
   - Test session revocation
   - Test multiple sessions

### Authorization Testing

1. **Role-Based Access:**
   - Test each role's permissions
   - Test unauthorized access attempts
   - Test privilege escalation

2. **Input Validation:**
   - Test XSS attacks
   - Test SQL injection (if applicable)
   - Test command injection

---

## Monitoring and Logging

### Application Logs

Monitor logs for:
- Error messages
- Authentication attempts
- Rate limiting triggers
- Performance issues

### Database Logs

Monitor database for:
- Slow queries
- Connection issues
- Data integrity

---

## Test Checklist

- [ ] User registration
- [ ] User login
- [ ] User logout
- [ ] Session revocation
- [ ] Create task (all roles)
- [ ] Get tasks (all roles)
- [ ] Update task (all roles)
- [ ] Delete task (all roles)
- [ ] User management (Admin)
- [ ] Role-based access control
- [ ] Input validation
- [ ] Error handling
- [ ] Rate limiting
- [ ] Pagination
- [ ] Filtering and sorting
- [ ] Automated reminders

---

## Troubleshooting

### Common Issues

1. **Authentication Errors:**
   - Check token validity
   - Verify token expiration
   - Check session storage

2. **Authorization Errors:**
   - Verify user role
   - Check permissions
   - Review access control logic

3. **Validation Errors:**
   - Check input format
   - Verify required fields
   - Review validation rules

4. **Database Errors:**
   - Check MongoDB connection
   - Verify database access
   - Review query syntax

---

## Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [REST API Testing Best Practices](https://www.postman.com/resources/rest-api-testing/)
- [API Testing Tools](https://www.guru99.com/api-testing.html)


