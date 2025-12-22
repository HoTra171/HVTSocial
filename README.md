# HVTSocial

Dự án mạng xã hội HVTSocial với Backend (Node.js/Express) và Frontend (React + Vite).

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt](#-cài-đặt)
- [Cấu hình môi trường](#-cấu-hình-môi-trường)
- [Chạy dự án](#-chạy-dự-án)

## ✨ Tính năng

- Đăng ký/Đăng nhập người dùng
- Đăng bài viết (text, hình ảnh, video)
- Tương tác (like, comment, share)
- Chat realtime
- Video call / Voice call
- Upload ảnh/video lên Cloudinary
- Xác thực JWT

## 🛠 Công nghệ sử dụng

### Backend
- Node.js + Express
- SQL Server
- Socket.io (realtime chat)
- Cloudinary (lưu trữ media)
- JWT Authentication

### Frontend
- React + Vite
- Clerk (Authentication)
- Socket.io Client

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

Tạo file `Frontend/.env` từ file mẫu:
```bash
cp Frontend/.env.example Frontend/.env
```

Cập nhật:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

> **Lưu ý**: Đăng ký tài khoản tại [Clerk.com](https://clerk.com) để lấy API key

## 🏃 Chạy dự án

### Development Mode

**Terminal 1 - Backend:**
```bash
cd Backend
npm start
```
Server sẽ chạy tại: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```
App sẽ chạy tại: `http://localhost:3000`

### Production Build

**Frontend:**
```bash
cd Frontend
npm run build
```

## 📝 Lưu ý

- File `.env` chứa thông tin nhạy cảm, **KHÔNG** được commit lên Git
- Thư mục `uploads/` chứa file upload của user, đã được ignore trong Git
- Đảm bảo SQL Server đang chạy trước khi start Backend
- Cấu hình CORS trong Backend nếu deploy lên server

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo Pull Request.

## 📄 License

MIT License
