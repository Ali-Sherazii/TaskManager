# 🚀 Quick Start Guide

Get the Task Management System up and running in 5 minutes!

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Configure Backend

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` file and set your JWT secret:
```env
JWT_SECRET=your-super-secret-key-here
```

**Tip:** Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 3: Start Servers

### Option A: Manual (Recommended for Learning)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option B: Using Scripts

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

## Step 4: Access Application

1. Open browser: `http://localhost:5173`
2. Click "Register"
3. Create an account (choose "admin" role for full access)
4. Login and start using!

## ✅ Verify Installation

### Backend Check
Visit: `http://localhost:3000`
- Should see API information
- If error, check backend is running

### Frontend Check
Visit: `http://localhost:5173`
- Should see login page
- If blank, check frontend is running

## 🎓 Next Steps

1. **Read the Learning Guide:** [LEARNING_GUIDE.md](./LEARNING_GUIDE.md)
2. **Explore the Code:** Start with `backend/server.js`
3. **Try Features:** Create tasks, manage users, test roles
4. **Make Changes:** Experiment and learn!

## 🐛 Common Issues

### "Cannot find module"
**Solution:** Run `npm install` in the directory

### "Port already in use"
**Solution:** 
- Change PORT in `backend/.env
- Or stop the process using port 3000/5173

### "Database error"
**Solution:** 
- Delete `backend/taskmanager.db`
- Restart server (database will be recreated)

### "CORS error"
**Solution:** 
- Ensure backend is running
- Check `FRONTEND_URL` in `backend/.env`

## 📚 Need Help?

- Read [LEARNING_GUIDE.md](./LEARNING_GUIDE.md) for detailed explanations
- Check code comments (all files have detailed comments)
- Review [README.md](./README.md) for full documentation

---

**Happy Coding! 🎉**




