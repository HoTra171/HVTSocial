-- =====================================================
-- Optimize Indexes (Safe Version)
-- =====================================================

PRINT '🚀 Starting DB Optimization...';
GO

-- 1. POSTS TABLE
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[posts]') AND type in (N'U'))
BEGIN
    -- Feed / Profile Timeline (user_id + created_at)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_posts_user_created_opt' AND object_id = OBJECT_ID('posts'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_posts_user_created_opt ON posts(user_id, created_at DESC) INCLUDE (id);
        PRINT '✅ Created: IX_posts_user_created_opt';
    END

    -- Global Timeline (created_at)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_posts_created_opt' AND object_id = OBJECT_ID('posts'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_posts_created_opt ON posts(created_at DESC) INCLUDE (id, user_id);
        PRINT '✅ Created: IX_posts_created_opt';
    END
END
GO

-- 2. COMMENTS TABLE
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[comments]') AND type in (N'U'))
BEGIN
    -- Load comments for post
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_comments_post_created_opt' AND object_id = OBJECT_ID('comments'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_comments_post_created_opt ON comments(post_id, created_at DESC);
        PRINT '✅ Created: IX_comments_post_created_opt';
    END

    -- Nested comments (replies)
    -- Check if parent_comment_id exists first
    IF COL_LENGTH('comments', 'parent_comment_id') IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_comments_parent_opt' AND object_id = OBJECT_ID('comments'))
        BEGIN
            CREATE NONCLUSTERED INDEX IX_comments_parent_opt ON comments(parent_comment_id, created_at ASC);
            PRINT '✅ Created: IX_comments_parent_opt';
        END
    END
END
GO

-- 3. MESSAGES TABLE (Chat)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[messages]') AND type in (N'U'))
BEGIN
    -- Chat History
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_messages_chat_created_opt' AND object_id = OBJECT_ID('messages'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_messages_chat_created_opt ON messages(chat_id, created_at ASC) INCLUDE (sender_id, content);
        PRINT '✅ Created: IX_messages_chat_created_opt';
    END

    -- User's sent messages
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_messages_sender_opt' AND object_id = OBJECT_ID('messages'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_messages_sender_opt ON messages(sender_id, created_at DESC);
        PRINT '✅ Created: IX_messages_sender_opt';
    END
END
GO

-- 4. NOTIFICATIONS TABLE
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[notifications]') AND type in (N'U'))
BEGIN
    -- Fetch unread / recent notifications
    IF COL_LENGTH('notifications', 'is_read') IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_notifications_user_read_opt' AND object_id = OBJECT_ID('notifications'))
        BEGIN
            CREATE NONCLUSTERED INDEX IX_notifications_user_read_opt ON notifications(user_id, is_read, created_at DESC);
            PRINT '✅ Created: IX_notifications_user_read_opt';
        END
    END
    ELSE
    BEGIN
        -- Fallback if is_read missing (unlikely but safe)
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_notifications_user_created_opt' AND object_id = OBJECT_ID('notifications'))
        BEGIN
            CREATE NONCLUSTERED INDEX IX_notifications_user_created_opt ON notifications(user_id, created_at DESC);
            PRINT '✅ Created: IX_notifications_user_created_opt';
        END
    END
END
GO

PRINT '🎉 DB Optimization Complete!';
