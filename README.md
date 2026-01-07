# 🌐 HVTSocial - Modern Social Media Platform

A production-ready social media application featuring real-time interaction, rich media sharing, and a responsive mobile-first design. Built for scalability and performance.

---

## 📸 Feature Showcase

| **Main Feed** | **Chat Interface** | **User Profile** |
|:---:|:---:|:---:|
| ![Feed](docs/assets/feed_demo.png) | ![Chat](docs/assets/chat_demo.png) | ![Profile](docs/assets/profile_demo.png) |
| *Infinite scrolling news feed with rich media support* | *Real-time messaging with typing indicators* | *Customizable profiles and media grid* |

| **Notifications** | **Create Post** | **Comments** |
|:---:|:---:|:---:|
| ![Notifications](docs/assets/notification_demo.png) | ![Post](docs/assets/post_demo.png) | ![Comments](docs/assets/comment_demo.png) |
| *Instantly notified of likes and friend requests* | *Easy post creation with media uploads* | *Nested comments and interactive discussions* |

---

## 🏗️ System Architecture

Typical data flow: **Client** ↔ **API Gateway (Express)** ↔ **Services/DB**.

```mermaid
graph TD
    Client[📱 React Client (Vite)]
    LB[🛡️ API Gateway / Nginx]
    Backend[🚀 Node.js Backend (Express)]
    Socket[🔌 Socket.IO Server]
    
    DB[(🗄️ Database (MSSQL/Postgres))]
    Redis[(⚡ Redis Cache (Optional))]
    Cloudinary[☁️ Cloudinary Storage]
    
    Client -->|HTTP/REST| Backend
    Client -->|WebSocket| Socket
    
    Backend --> DB
    Backend --> Cloudinary
    Backend --> Redis
    
    subgraph Observability
        Sentry[🐞 Sentry Error Tracking]
        Logger[📝 Winston Logs]
    end
    
    Backend -.-> Sentry
    Backend -.-> Logger
```

---

## 🛠️ Technology Stack

**Frontend**
- **Framework**: React 18 + Vite
- **Styling**: TailwindCSS + Lucide Icons
- **State/API**: Axios, React Router DOM
- **Realtime**: Socket.io-client

**Backend**
- **Runtime**: Node.js + Express
- **Database**: MSSQL (Dev) / PostgreSQL (Prod) with connection pooling
- **Realtime**: Socket.io (Namespaces, Rooms)
- **Security**: Helmet, Rate Limit, CORS, JWT (Access + Refresh)

**DevOps & Tools**
- **CI/CD**: GitHub Actions (Lint + Test)
- **Logging**: Winston (Daily Rotate) + Morgan
- **APIs**: Cloudinary (Media), Voicon (TTS - Integrated)

---

## 📖 API Documentation

The API is fully documented using Swagger/OpenAPI.

*   **Swagger UI**: `http://localhost:5000/api-docs` (Local)
*   **JSON Spec**: `http://localhost:5000/api-docs.json`
*   **Postman Collection**: [Download Postman JSON](./docs/HVTSocial.postman_collection.json) *(Coming Soon)*

---

## 🛡️ Security Notes

This project adheres to modern security best practices:

1.  **Rate Limiting**: 
    - Critical endpoints (Auth): **10 reqs / 15 min**.
    - APIs: **100 reqs / 15 min**.
    - Prevent Brute Force & DDoS attacks.

2.  **Headers & CORS**:
    - **Helmet** configured to secure HTTP headers (XSS Filter, No-Sniff, Frameguard).
    - **CORS** restricted to trusted domains only.

3.  **Authentication**:
    - **JWT** signed with RS256/HS256.
    - **Refresh Token Rotation** to handle session hijacking.
    - **Passwords** hashed with `bcryptjs`.

4.  **Upload Security**:
    - Validated file types (images/videos only).
    - File size limits enforced (Multer + Cloudinary).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18+
- SQL Server or PostgreSQL
- Git

### 2. Backend Setup
```bash
cd Backend
npm install
cp .env.example .env
# Fill in your Database, JWT, and Cloudinary secrets in .env
npm run migrate # Run DB migrations
npm start
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
cp .env.example .env
npm run dev
```

---

## 🤝 Contributing
1.  Fork the repo
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

© 2025 HVTSocial. Built with ❤️.
