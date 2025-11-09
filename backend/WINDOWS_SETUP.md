# Windows Setup Guide

## Issue: better-sqlite3 Installation Error

If you're getting an error about Visual Studio when installing `better-sqlite3`, you have two options:

## ✅ Solution 1: Use sql.js (Recommended - No Build Tools Needed)

The project has been updated to use `sql.js` instead of `better-sqlite3`. This is a pure JavaScript implementation that doesn't require native compilation.

**Just run:**
```bash
cd backend
npm install
```

This should work without any additional setup!

## 🔧 Solution 2: Install Build Tools (For better-sqlite3)

If you prefer to use `better-sqlite3` (which is faster), you need to install Visual Studio Build Tools:

### Option A: Install Visual Studio Build Tools (Recommended)

1. **Download Visual Studio Build Tools:**
   - Go to: https://visualstudio.microsoft.com/downloads/
   - Scroll down to "Tools for Visual Studio"
   - Download "Build Tools for Visual Studio 2022"

2. **Install Build Tools:**
   - Run the installer
   - Select "Desktop development with C++" workload
   - Click Install

3. **Restart your terminal** and try again:
   ```bash
   cd backend
   npm install
   ```

### Option B: Install Visual Studio Community (Full IDE)

1. **Download Visual Studio Community:**
   - Go to: https://visualstudio.microsoft.com/vs/community/
   - Download and install

2. **During installation:**
   - Select "Desktop development with C++" workload
   - Complete installation

3. **Restart your terminal** and try again:
   ```bash
   cd backend
   npm install
   ```

## 🎯 Quick Fix: Switch Back to better-sqlite3

If you want to use `better-sqlite3` after installing build tools:

1. **Update package.json:**
   ```json
   "dependencies": {
     "better-sqlite3": "^9.2.2",
     // Remove "sql.js": "^1.10.3"
   }
   ```

2. **Update database.js:**
   - Replace sql.js code with better-sqlite3 code
   - See the original implementation in git history

3. **Install:**
   ```bash
   npm install
   ```

## 📝 Notes

- **sql.js** is slower but works everywhere (no compilation)
- **better-sqlite3** is faster but requires build tools on Windows
- For learning purposes, sql.js is perfectly fine!

## ✅ Verify Installation

After installing, verify it works:

```bash
cd backend
npm start
```

You should see:
```
✅ Database initialized successfully
🚀 Server running on http://localhost:3000
```

If you see this, everything is working! 🎉




