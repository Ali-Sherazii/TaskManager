# Backend API - Task Management System

RESTful API built with Node.js and Express.js.

## Structure

```
backend/
├── config/          # Configuration files
│   ├── config.js    # Environment variables
│   └── database.js  # Database setup
├── controllers/     # Business logic
│   ├── authController.js
│   ├── taskController.js
│   └── userController.js
├── middleware/      # Request processing
│   ├── auth.js      # Authentication
│   └── validation.js # Input validation
├── routes/          # API endpoints
│   ├── authRoutes.js
│   ├── taskRoutes.js
│   └── userRoutes.js
├── services/        # Background services
│   └── reminderService.js
├── server.js        # Main entry point
└── package.json
```

## Getting Started

1. **Install Dependencies:**
```bash
npm install
```

2. **Create Environment File:**
```bash
cp .env.example .env
# Edit .env and set JWT_SECRET
```

3. **Start Server:**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server runs on: `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/revoke-session/:userId` - Revoke sessions

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id/role` - Update user role

## Authentication

All task and user endpoints require authentication.

**Header Format:**
```
Authorization: Bearer <jwt-token>
```

## Learning

All code files have detailed comments explaining:
- What each function does
- How it works
- Why it's implemented that way

**Start Learning:**
1. Read `server.js` - Entry point
2. Study `routes/` - API endpoints
3. Explore `controllers/` - Business logic
4. Understand `middleware/` - Request processing

For complete learning guide, see [../LEARNING_GUIDE.md](../LEARNING_GUIDE.md)

## Database

MongoDB database: `taskmanager` (created automatically)

**Collections:**
- `users` - User accounts
- `tasks` - Tasks
- `sessions` - Active sessions

## Configuration

Edit `.env` file:
```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Code Quality

- Comprehensive comments
- Error handling
- Input validation
- Security best practices
- Role-based access control



