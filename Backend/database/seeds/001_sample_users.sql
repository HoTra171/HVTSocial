-- Sample Users Seed
-- This creates demo users for testing and development

-- Check if demo users already exist before inserting
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo1@hvtsocial.com')
BEGIN
    INSERT INTO users (username, email, password_hash, full_name, bio, avatar_url, created_at)
    VALUES
    (
        'demo_user1',
        'demo1@hvtsocial.com',
        '$2a$10$YourHashedPasswordHere', -- Change this to actual bcrypt hash
        'Demo User 1',
        'This is a demo account for testing HVTSocial features',
        'https://i.pravatar.cc/150?img=1',
        GETDATE()
    );
    PRINT 'Created demo_user1';
END
GO

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo2@hvtsocial.com')
BEGIN
    INSERT INTO users (username, email, password_hash, full_name, bio, avatar_url, created_at)
    VALUES
    (
        'demo_user2',
        'demo2@hvtsocial.com',
        '$2a$10$YourHashedPasswordHere', -- Change this to actual bcrypt hash
        'Demo User 2',
        'Another demo account for testing friendships and messaging',
        'https://i.pravatar.cc/150?img=2',
        GETDATE()
    );
    PRINT 'Created demo_user2';
END
GO

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo3@hvtsocial.com')
BEGIN
    INSERT INTO users (username, email, password_hash, full_name, bio, avatar_url, created_at)
    VALUES
    (
        'demo_user3',
        'demo3@hvtsocial.com',
        '$2a$10$YourHashedPasswordHere', -- Change this to actual bcrypt hash
        'Demo User 3',
        'Third demo account for testing features',
        'https://i.pravatar.cc/150?img=3',
        GETDATE()
    );
    PRINT 'Created demo_user3';
END
GO

PRINT 'Sample users seeded successfully!';
