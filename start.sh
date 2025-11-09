#!/bin/bash

echo "Starting Task Management System..."
echo ""
echo "Starting Backend Server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

sleep 3

echo ""
echo "Starting Frontend Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Both servers are starting..."
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Make sure you have:"
echo "1. Installed dependencies (npm install in both backend and frontend)"
echo "2. Created .env file in backend directory"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait


