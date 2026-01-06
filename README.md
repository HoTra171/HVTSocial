# HVTSocial

Dự án mạng xã hội HVTSocial với Backend (Node.js/Express) và Frontend (React + Vite).

## ⚡ Quick Check - Sẵn sàng Deploy?

```bash
# Windows
check-deployment.bat

# Linux/Mac
bash check-deployment.sh
```

Kiểm tra nhanh: dependencies, environment variables, cấu hình → Sẵn sàng deploy trong 30 phút!

## 🚀 Quick Links

- **[PROJECT_READY_SUMMARY.md](PROJECT_READY_SUMMARY.md)** - ⭐ Tóm tắt dự án & deployment readiness
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - ⭐ Hướng dẫn deploy chi tiết từng bước
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Setup local trong 15 phút
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy free trong 30 phút
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Fix lỗi thường gặp

## 📚 Documentation

| File | Description |
|------|-------------|
| [PROJECT_READY_SUMMARY.md](PROJECT_READY_SUMMARY.md) | ⭐ Tóm tắt tình trạng & sẵn sàng deploy |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | ⭐ Step-by-step deployment guide |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Setup local + troubleshooting |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Quick deploy guide (FREE) |
| [DEPLOYMENT_ADVANCED.md](DEPLOYMENT_ADVANCED.md) | Advanced topics & PostgreSQL |
| [CONFIGURATION.md](CONFIGURATION.md) | Environment & config |
| [SECURITY.md](SECURITY.md) | Security features |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common bugs & fixes |
| [TESTING.md](TESTING.md) | Testing guide |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

## 📋 Table of Contents

- [Features](#-tính-năng)
- [Tech Stack](#-công-nghệ-sử-dụng)
- [Quick Start](#-quick-start)

## ✨ Tính năng

- 👤 Đăng ký/Đăng nhập người dùng (JWT Authentication)
- 📝 Đăng bài viết (text, hình ảnh, video)
- 💬 Chat realtime (Socket.IO)
- 📱 Stories (24h auto-delete)
- 👍 Tương tác (like, comment, share)
- 👥 Follow/Unfollow, friendships
- 🔔 Notifications realtime
- 📸 Upload ảnh/video lên Cloudinary
- 🔐 Security: Helmet, Rate Limiting, RBAC
- 📊 API Documentation (Swagger)
- ✅ Unit Tests (Jest)
- 🐳 Docker support
- 🚀 Production-ready deployment configs

## 🛠 Công nghệ sử dụng

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js 5
- **Database:** SQL Server (MSSQL) hoặc PostgreSQL
- **Realtime:** Socket.IO
- **Caching:** Redis + Bull Queue
- **Storage:** Cloudinary
- **Auth:** JWT (không dùng Clerk nữa)
- **Security:** Helmet, Rate Limiting, CORS
- **Validation:** Joi
- **Testing:** Jest
- **API Docs:** Swagger UI
- **Logging:** Winston

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 7
- **Styling:** TailwindCSS 4
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Realtime:** Socket.IO Client
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Testing:** Vitest (setup available)

## 📁 Cấu trúc dự án

```
HVTSocial/
├── Backend/
│   ├── config/          # Cấu hình database, cloudinary
│   ├── controllers/     # Xử lý logic
│   ├── models/          # Models database
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middlewares/     # Authentication, validation
│   ├── sockets/         # Socket.io handlers
│   ├── uploads/         # Thư mục lưu file upload
│   └── server.js        # Entry point
│
└── Frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── page/        # Pages
    │   └── socket.js    # Socket client
    └── public/          # Static files
```

## 🚀 Cài đặt

### Yêu cầu hệ thống
- Node.js (v14 trở lên)
- SQL Server
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone https://github.com/your-username/HVTSocial.git
cd HVTSocial
```

### Bước 2: Cài đặt dependencies

**Backend:**
```bash
cd Backend
npm install
```

**Frontend:**
```bash
cd Frontend
npm install
```

## ⚙️ Cấu hình môi trường

### Backend

Tạo file `Backend/.env` từ file mẫu:
```bash
cp Backend/.env.example Backend/.env
```

Sau đó cập nhật các giá trị trong `Backend/.env`:

```env
# Database
SQL_SERVER=localhost
SQL_PORT=1433
SQL_DATABASE=HVTSocial
SQL_USER=sa
SQL_PASSWORD=your_password

# JWT
JWT_SECRET=your_secure_random_string

# Email (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary (https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Client URL
CLIENT_URL=http://localhost:3000
```

### Frontend

Tạo file `Frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

**Chi tiết đầy đủ:** [GETTING_STARTED.md](GETTING_STARTED.md)

---

## 🚀 Quick Start

```bash
# 1. Clone repo
git clone https://github.com/your-username/HVTSocial.git
cd HVTSocial

# 2. Install dependencies
cd Backend && npm install
cd ../Frontend && npm install

# 3. Setup .env files (xem trên)

# 4. Start Backend
cd Backend && npm start

# 5. Start Frontend (terminal mới)
cd Frontend && npm run dev

# 6. Open browser: http://localhost:3000
```

**Full guide:** [GETTING_STARTED.md](GETTING_STARTED.md)

---

## 🌐 Deploy Free

Deploy lên cloud **miễn phí 100%** trong 30 phút:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Railway PostgreSQL
- **Total Cost:** $0/month

**Quick guide:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📖 Documentation Index

### Setup & Local Development
- [GETTING_STARTED.md](GETTING_STARTED.md) - Complete setup guide

### Deployment
- [DEPLOYMENT.md](DEPLOYMENT.md) - Quick deploy (30 min)
- [DEPLOYMENT_ADVANCED.md](DEPLOYMENT_ADVANCED.md) - PostgreSQL, Docker, scaling

### Configuration
- [CONFIGURATION.md](CONFIGURATION.md) - Environment variables, database, Redis, email

### Troubleshooting
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common errors & fixes

### Security & Testing
- [SECURITY.md](SECURITY.md) - Security features & best practices
- [TESTING.md](TESTING.md) - Unit & integration tests

### Project History
- [CHANGELOG.md](CHANGELOG.md) - Version history & changes

---

## 📝 API Documentation

When Backend is running:
- **Swagger UI:** http://localhost:5000/api-docs
- **Health Check:** http://localhost:5000/health

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT License

---

## ✨ Notes

- **No Clerk:** Chuyển sang JWT authentication
- **No 2FA:** Simplified auth flow
- **Free Deploy:** Vercel + Render + Railway = $0/month
- **Production Ready:** Security, testing, monitoring included

---

**Made with ❤️ by HVTSocial Team**

**Last Updated:** 2026-01-06

---

> 📚 **Tip:** Start with [GETTING_STARTED.md](GETTING_STARTED.md) for local setup or [DEPLOYMENT.md](DEPLOYMENT.md) to deploy immediately!
