@echo off
REM University Communication Workspace - Startup Script
REM This script starts both backend and frontend servers

echo.
echo ===============================================
echo  University Communication Workspace
echo  Startup Script
echo ===============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install from: https://nodejs.org/
    pause
    exit /b 1
)

REM Get Node version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js found: %NODE_VERSION%
echo.

REM Check and install dependencies
echo Checking dependencies...

if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Starting University Communication Workspace...
echo.

REM Start backend in a new window
echo Starting Backend Server on port 5000...
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait for backend to start
timeout /t 3 /nobreak

REM Start frontend in a new window
echo Starting Frontend Server on port 3000...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ===============================================
echo  Both servers are starting!
echo ===============================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo To stop the servers, close both command windows.
echo Opening browser in 2 seconds...
echo.
timeout /t 2 /nobreak

REM Open browser
start http://localhost:3000

echo Browser opened!
pause
