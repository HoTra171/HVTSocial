-- Migration: Create comments table
-- Created: 2026-01-01
-- Description: Comments with nested replies support

CREATE TABLE IF NOT EXISTS comments (
  id INT PRIMARY KEY IDENTITY(1,1),
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content NVARCHAR(MAX) NOT NULL,
  comment_parent INT NULL, -- For nested replies
  replies_count INT DEFAULT 0,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_parent) REFERENCES comments(id) ON DELETE NO ACTION
);

-- Indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(comment_parent);
CREATE INDEX idx_comments_created_at ON comments(created_at);
