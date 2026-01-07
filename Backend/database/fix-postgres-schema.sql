-- ============================================================
-- Fix PostgreSQL Schema - Add Missing Tables and Columns
-- Run this migration to fix the errors:
-- 1. user_hobbies table missing
-- 2. friendships table missing user_id/friend_id columns
-- 3. notifications table missing sender_id column
-- 4. stories table missing columns (music_url, caption, etc.)
-- ============================================================

-- ============================================================
-- 1. HOBBIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS hobbies (
    id SERIAL PRIMARY KEY,
    content VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hobbies_content ON hobbies(content);

-- ============================================================
-- 2. USER_HOBBIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_hobbies (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hobby_id INTEGER NOT NULL REFERENCES hobbies(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, hobby_id)
);

CREATE INDEX idx_user_hobbies_user ON user_hobbies(user_id);
CREATE INDEX idx_user_hobbies_hobby ON user_hobbies(hobby_id);

-- ============================================================
-- 3. FIX FRIENDSHIPS TABLE - Add user_id and friend_id columns
-- ============================================================
-- Add user_id and friend_id columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='friendships' AND column_name='user_id') THEN
        ALTER TABLE friendships ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='friendships' AND column_name='friend_id') THEN
        ALTER TABLE friendships ADD COLUMN friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Migrate data from requester_id/receiver_id to user_id/friend_id if needed
-- Only update if requester_id/receiver_id exist and user_id/friend_id are NULL
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='friendships' AND column_name='requester_id') THEN
        UPDATE friendships 
        SET user_id = requester_id, friend_id = receiver_id 
        WHERE (user_id IS NULL OR friend_id IS NULL) 
        AND requester_id IS NOT NULL AND receiver_id IS NOT NULL;
    END IF;
END $$;

-- Create indexes for user_id and friend_id
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);

-- ============================================================
-- 4. FIX NOTIFICATIONS TABLE - Add sender_id column
-- ============================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='sender_id') THEN
        ALTER TABLE notifications ADD COLUMN sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        
        -- Migrate actor_id to sender_id if actor_id exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='actor_id') THEN
            UPDATE notifications SET sender_id = actor_id WHERE sender_id IS NULL;
        END IF;
    END IF;
    
    -- Add status column if missing (for MSSQL compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='status') THEN
        ALTER TABLE notifications ADD COLUMN status VARCHAR(10) DEFAULT 'unread' 
            CHECK (status IN ('unread', 'read'));
        
        -- Migrate is_read to status
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='is_read') THEN
            UPDATE notifications SET status = CASE WHEN is_read THEN 'read' ELSE 'unread' END;
        END IF;
    END IF;
    
    -- Add post_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='post_id') THEN
        ALTER TABLE notifications ADD COLUMN post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL;
        
        -- Migrate target_id to post_id if target_type is 'post'
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='target_id' 
                   AND EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='notifications' AND column_name='target_type')) THEN
            UPDATE notifications 
            SET post_id = target_id 
            WHERE target_type = 'post' AND post_id IS NULL;
        END IF;
    END IF;
    
    -- Add content column if missing (rename from message if exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='content') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='message') THEN
            ALTER TABLE notifications RENAME COLUMN message TO content;
        ELSE
            ALTER TABLE notifications ADD COLUMN content TEXT;
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_post ON notifications(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- ============================================================
-- 5. FIX STORIES TABLE - Add missing columns
-- ============================================================
DO $$ 
BEGIN
    -- Add music_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='music_url') THEN
        ALTER TABLE stories ADD COLUMN music_url VARCHAR(500);
    END IF;
    
    -- Add caption column (rename from content if exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='caption') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='content') THEN
            ALTER TABLE stories RENAME COLUMN content TO caption;
        ELSE
            ALTER TABLE stories ADD COLUMN caption VARCHAR(500);
        END IF;
    END IF;
    
    -- Add text_color column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='text_color') THEN
        ALTER TABLE stories ADD COLUMN text_color VARCHAR(20) DEFAULT '#FFFFFF';
    END IF;
    
    -- Add font_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='font_size') THEN
        ALTER TABLE stories ADD COLUMN font_size INTEGER DEFAULT 24;
    END IF;
    
    -- Add text_position column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='text_position') THEN
        ALTER TABLE stories ADD COLUMN text_position VARCHAR(500);
    END IF;
    
    -- Add show_frame column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='show_frame') THEN
        ALTER TABLE stories ADD COLUMN show_frame BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add sticker column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='sticker') THEN
        ALTER TABLE stories ADD COLUMN sticker VARCHAR(500);
    END IF;
    
    -- Add sticker_position column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='sticker_position') THEN
        ALTER TABLE stories ADD COLUMN sticker_position VARCHAR(500);
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='stories' AND column_name='updated_at') THEN
        ALTER TABLE stories ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- ============================================================
-- 6. FOLLOWS TABLE (if missing)
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ============================================================
-- 7. USER_BLOCKS TABLE (if missing)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_blocks (
    blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT chk_block_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- ============================================================
-- Summary
-- ============================================================
SELECT 
    'Migration Complete!' as status,
    NOW() as completed_at;
