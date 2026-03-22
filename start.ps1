# University Communication Workspace - Startup Script
# This script starts both backend and frontend servers

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  University Communication Workspace" -ForegroundColor Cyan
Write-Host "  Startup Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeCheck = node --version 2>$null
if ($null -eq $nodeCheck) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please download and install from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Node.js found: $nodeCheck" -ForegroundColor Green
Write-Host ""

# Check if npm packages are installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow

# Check backend node_modules
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    cd backend
    npm install
    cd ..
}

# Check frontend node_modules
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    cd frontend
    npm install
    cd ..
}

Write-Host ""
Write-Host "Starting University Communication Workspace..." -ForegroundColor Cyan
Write-Host ""

# Start backend in a new PowerShell window
Write-Host "Starting Backend Server on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new PowerShell window
Write-Host "Starting Frontend Server on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  Both servers are starting!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the servers, close both PowerShell windows." -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Gray
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

Read-Host "Press Enter to exit this window"
