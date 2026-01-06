#!/bin/bash

echo "========================================"
echo "  HVTSocial - Khởi động ứng dụng"
echo "========================================"
echo ""

echo "[1/4] Kiểm tra Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Redis chưa chạy. Đang khởi động..."

    # Check if running on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start redis
    else
        # Linux
        sudo systemctl start redis
    fi

    sleep 2
else
    echo "✓ Redis đã chạy"
fi

echo ""
echo "[2/4] Chạy Database Migrations..."
cd Backend
npm run db:migrate
if [ $? -ne 0 ]; then
    echo "! Migration thất bại. Vui lòng kiểm tra database connection."
    exit 1
fi

echo ""
echo "[3/4] Khởi động Backend Server..."
cd Backend
npm start &
BACKEND_PID=$!
sleep 5

echo ""
echo "[4/4] Khởi động Frontend..."
cd ../Frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  Khởi động thành công!"
echo "========================================"
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:5000/api-docs"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Nhấn Ctrl+C để dừng tất cả services"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
