-- ============================================================
-- Add Missing Columns to Users Table
-- Run this if you get error: column "date_of_birth" does not exist
-- ============================================================

-- Thêm các cột bị thiếu vào bảng users (nếu chưa có)
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_attempts INTEGER DEFAULT 0;

-- Verify các cột đã được thêm
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Kết quả mong đợi: Bạn sẽ thấy tất cả các cột trên trong danh sách
