@echo off
echo Starting Task Management System...
echo.
echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm start"
cd ..
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend Server...
cd frontend
start "Frontend Server" cmd /k "npm run dev"
cd ..
echo.
echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Make sure you have:
echo 1. Installed dependencies (npm install in both backend and frontend)
echo 2. Created .env file in backend directory
echo.
pause


