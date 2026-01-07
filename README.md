# HVTSocial - Social Media Platform

A full-stack social media application built with React, Node.js, and SQL Server/PostgreSQL.

## 🚀 Features
- **Authentication**: Secure login/register with JWT and Refresh Tokens.
- **News Feed**: Infinite scroll with cursor-based pagination.
- **Real-time Chat**: Messaging with Socket.io.
- **Media**: Image and video uploads via Cloudinary.
- **Stories**: ephemeral content like Instagram.

## 🛠️ Stack
- **Frontend**: React, Vite, TailwindCSS.
- **Backend**: Node.js, Express, Socket.io.
- **Database**: MSSQL (Local), PostgreSQL (Production).

## ⚙️ Environment Setup

### 1. Backend (`Backend/.env`)
Copy the example file:
```bash
cd Backend
cp .env.example .env
```
Update the values in `.env`:
*   `JWT_SECRET`: Generate a strong key (`node generate-jwt-secret.js`).
*   `CLOUDINARY_*`: Get from your Cloudinary dashboard.
*   `DATABASE_URL`: Your PostgreSQL connection string (if using Postgres).

### 2. Frontend (`Frontend/.env`)
Copy the example file:
```bash
cd Frontend
cp .env.example .env
```
Update if needed:
*   `VITE_API_URL`: Backend URL (default: `http://localhost:5000`).

## 🛡️ Security Note
This repository includes a `.gitignore` to prevent sensitive files (`.env`) from being committed.
**WARNING**: If you have previously committed `.env` files, please rotate all your secrets (JWT, DB, Cloudinary) immediately.

## 🏃‍♂️ Run Locally
1. Start Backend:
   ```bash
   cd Backend
   npm install
   npm start
   ```
2. Start Frontend:
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```
