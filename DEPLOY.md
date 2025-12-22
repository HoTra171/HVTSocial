# 🚀 Quick Deploy Guide

## Phương án 1: Deploy Miễn Phí (Khuyến nghị)

### ⏱️ Thời gian: ~30 phút

### Bước 1: Deploy Database (Azure SQL - Miễn phí 12 tháng)

1. Truy cập: https://azure.microsoft.com/free/students/
2. Đăng ký với email sinh viên
3. Tạo SQL Database:
   - Azure Portal → Create Resource → SQL Database
   - Resource Group: `hvtsocial-rg`
   - Database name: `HVTSocial`
   - Server: Tạo mới
   - Compute + storage: Basic (5 DTU, 2GB) - $4.99/tháng hoặc Free tier
4. Lưu connection string:
   ```
   Server=your-server.database.windows.net
   Database=HVTSocial
   User=your-username
   Password=your-password
   ```

### Bước 2: Deploy Backend (Render.com - Miễn phí)

1. Truy cập: https://render.com
2. Đăng nhập bằng GitHub
3. New → Web Service
4. Connect: `HoTra171/HVTSocial`
5. Cấu hình:
   - **Name**: `hvtsocial-backend`
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

6. Environment Variables (copy từ `.env`):
   ```
   SQL_SERVER=your-azure-server.database.windows.net
   SQL_PORT=1433
   SQL_DATABASE=HVTSocial
   SQL_USER=your-username
   SQL_PASSWORD=your-password
   SQL_ENCRYPT=true
   SQL_TRUST_CERT=false
   JWT_SECRET=your-random-secret-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   CLIENT_URL=https://hvtsocial.vercel.app
   CORS_ORIGINS=https://hvtsocial.vercel.app
   ```

7. Click **Create Web Service**
8. **Lưu URL**: `https://hvtsocial-backend.onrender.com`

### Bước 3: Deploy Frontend (Vercel - Miễn phí)

1. Truy cập: https://vercel.com
2. Import Project → `HoTra171/HVTSocial`
3. Cấu hình:
   - **Project Name**: `hvtsocial`
   - **Framework**: Vite
   - **Root Directory**: `Frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Environment Variables:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your-clerk-key
   VITE_API_URL=https://hvtsocial-backend.onrender.com
   ```

5. Deploy!
6. **Lưu URL**: `https://hvtsocial.vercel.app`

### Bước 4: Cập nhật CORS

1. Quay lại Render.com
2. Vào Backend service → Environment
3. Cập nhật `CORS_ORIGINS` và `CLIENT_URL` với URL Vercel thực tế
4. Save → Redeploy

### ✅ Hoàn thành!

- Frontend: `https://hvtsocial.vercel.app`
- Backend: `https://hvtsocial-backend.onrender.com`
- Database: Azure SQL

---

## Phương án 2: Deploy với Docker (Local hoặc VPS)

### Yêu cầu:
- Docker và Docker Compose đã cài đặt

### Các bước:

1. **Clone repository**:
   ```bash
   git clone https://github.com/HoTra171/HVTSocial.git
   cd HVTSocial
   ```

2. **Tạo file `.env`**:
   ```bash
   cp Backend/.env.example Backend/.env
   cp Frontend/.env.example Frontend/.env
   ```

3. **Cập nhật `.env` files** với thông tin của bạn

4. **Chạy Docker Compose**:
   ```bash
   docker-compose up -d
   ```

5. **Kiểm tra**:
   - Frontend: http://localhost
   - Backend: http://localhost:5000
   - Database: localhost:1433

6. **Xem logs**:
   ```bash
   docker-compose logs -f
   ```

7. **Dừng services**:
   ```bash
   docker-compose down
   ```

---

## 🔧 Troubleshooting

### Backend không kết nối được Database
- Kiểm tra connection string
- Đảm bảo firewall cho phép kết nối
- Với Azure: Add IP address vào firewall rules

### Frontend không gọi được API
- Kiểm tra `VITE_API_URL` trong Frontend `.env`
- Kiểm tra CORS settings trong Backend
- Mở Developer Console để xem lỗi

### Render.com deploy failed
- Kiểm tra logs trong Render dashboard
- Đảm bảo `package.json` có script `start`
- Kiểm tra Node version compatibility

---

## 📞 Cần trợ giúp?

Xem hướng dẫn chi tiết trong `deployment_guide.md`
