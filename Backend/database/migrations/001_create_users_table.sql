-- Migration: Create users table
-- Created: 2026-01-01
-- Description: Base users table with authentication fields

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY IDENTITY(1,1),
  full_name NVARCHAR(255) NOT NULL,
  username NVARCHAR(100) UNIQUE NOT NULL,
  email NVARCHAR(255) UNIQUE NOT NULL,
  password NVARCHAR(255) NOT NULL,
  profile_picture NVARCHAR(MAX),
  bio NVARCHAR(MAX),
  date_of_birth DATE,
  gender NVARCHAR(20),
  location NVARCHAR(255),
  website NVARCHAR(255),
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
