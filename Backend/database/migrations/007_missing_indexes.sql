-- =====================================================
-- Optimize Indexes for Friendships & Likes
-- =====================================================

PRINT '🚀 Starting DB Optimization (Part 2)...';
GO

-- 1. FRIENDSHIPS TABLE
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[friendships]') AND type in (N'U'))
BEGIN
    -- Check status between two users (frequently used in getProfile, guards)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_friendships_users_opt' AND object_id = OBJECT_ID('friendships'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_friendships_users_opt ON friendships(user_id, friend_id, status);
        PRINT '✅ Created: IX_friendships_users_opt';
    END

    -- Get friends list (status = accepted)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_friendships_status_opt' AND object_id = OBJECT_ID('friendships'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_friendships_status_opt ON friendships(user_id, status) INCLUDE (friend_id);
        PRINT '✅ Created: IX_friendships_status_opt';
    END
END
GO

-- 2. LIKES TABLE
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[likes]') AND type in (N'U'))
BEGIN
    -- Check if user liked post
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_likes_post_user_opt' AND object_id = OBJECT_ID('likes'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_likes_post_user_opt ON likes(post_id, user_id);
        PRINT '✅ Created: IX_likes_post_user_opt';
    END
END
GO

PRINT '🎉 DB Optimization Part 2 Complete!';
