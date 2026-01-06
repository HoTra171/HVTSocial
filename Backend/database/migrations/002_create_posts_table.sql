-- Migration: Create posts table
-- Created: 2026-01-01
-- Description: Posts table with media support

CREATE TABLE IF NOT EXISTS posts (
  id INT PRIMARY KEY IDENTITY(1,1),
  user_id INT NOT NULL,
  content NVARCHAR(MAX),
  image_urls NVARCHAR(MAX),
  status NVARCHAR(20) DEFAULT 'public', -- public, friends, private
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_status ON posts(status);
