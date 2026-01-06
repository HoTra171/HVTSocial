@echo off
REM Quick Deployment Helper for Windows
REM Run this script to check deployment readiness

echo ========================================
echo   HVTSocial - Deployment Checker
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js is installed
node --version
echo.

REM Check if npm is installed
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [OK] npm is installed
npm --version
echo.

REM Check Backend setup
echo ========================================
echo Checking Backend...
echo ========================================
echo.

cd Backend

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [WARNING] Backend dependencies not installed
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Backend dependencies
        cd ..
        pause
        exit /b 1
    )
) else (
    echo [OK] Backend dependencies installed
)

echo.

REM Check .env file
if not exist ".env" (
    echo [WARNING] Backend .env file not found
    echo.
    echo Please create .env file:
    echo 1. Copy .env.example to .env
    echo 2. Fill in all required values
    echo 3. Run: npm run check-env
    echo.
    cd ..
    pause
    exit /b 1
) else (
    echo [OK] Backend .env file exists
)

echo.
echo Checking environment variables...
call npm run check-env
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Environment variables check failed!
    echo.
    echo Quick fixes:
    echo - Generate JWT secret: npm run generate-secret
    echo - Get Cloudinary credentials from https://cloudinary.com
    echo - Update .env file with correct values
    echo.
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo Checking Frontend...
echo ========================================
echo.

cd Frontend

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [WARNING] Frontend dependencies not installed
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Frontend dependencies
        cd ..
        pause
        exit /b 1
    )
) else (
    echo [OK] Frontend dependencies installed
)

echo.

REM Check .env file
if not exist ".env" (
    echo [INFO] Frontend .env file not found (optional for local dev)
    echo For production, create .env.production with:
    echo VITE_API_URL=https://your-backend-url.com
    echo VITE_WS_URL=https://your-backend-url.com
) else (
    echo [OK] Frontend .env file exists
)

cd ..

echo.
echo ========================================
echo Docker Check
echo ========================================
echo.

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Docker is not installed
    echo Docker is optional but recommended for production deployment
    echo Install from: https://www.docker.com/products/docker-desktop
) else (
    echo [OK] Docker is installed
    docker --version
)

echo.
echo ========================================
echo Summary
echo ========================================
echo.

echo Project structure: OK
echo Backend dependencies: OK
echo Backend .env: OK
echo Frontend dependencies: OK

echo.
echo ========================================
echo Next Steps
echo ========================================
echo.
echo Local Development:
echo   1. cd Backend ^&^& npm run dev
echo   2. cd Frontend ^&^& npm run dev
echo   3. Open http://localhost:3000
echo.
echo Production Deployment:
echo   1. Read DEPLOYMENT_CHECKLIST.md
echo   2. Follow step-by-step guide (30 minutes)
echo   3. Deploy to Vercel + Render (FREE)
echo.
echo Useful Commands:
echo   npm run check-env        - Check environment variables
echo   npm run generate-secret  - Generate JWT secret
echo   npm run db:migrate       - Run database migration
echo.
echo ========================================
echo Ready to Deploy!
echo ========================================
echo.
pause
