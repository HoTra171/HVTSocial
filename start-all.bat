@echo off
echo ========================================
echo   HVTSocial - Khoi dong ung dung
echo ========================================
echo.

echo [1/4] Kiem tra Redis...
docker ps | findstr redis-hvtsocial >nul 2>&1
if %errorlevel% neq 0 (
    echo Redis chua chay. Dang khoi dong Redis container...
    docker run -d --name redis-hvtsocial -p 6379:6379 redis:alpine
    timeout /t 3 >nul
) else (
    echo ✓ Redis da chay
)

echo.
echo [2/4] Chay Database Migrations...
cd Backend
call npm run db:migrate
if %errorlevel% neq 0 (
    echo ! Migration that bai. Vui long kiem tra database connection.
    pause
    exit /b 1
)

echo.
echo [3/4] Khoi dong Backend Server...
start "HVTSocial Backend" cmd /k "cd /d %~dp0Backend && npm start"
timeout /t 5 >nul

echo.
echo [4/4] Khoi dong Frontend...
start "HVTSocial Frontend" cmd /k "cd /d %~dp0Frontend && npm run dev"

echo.
echo ========================================
echo   Khoi dong thanh cong!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:5000/api-docs
echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul
