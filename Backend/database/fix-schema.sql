-- ============================================================
-- Quick Fix Migration for Existing PostgreSQL Database
-- Safe to run multiple times (uses IF NOT EXISTS/IF EXISTS)
-- ============================================================

-- 1. Add privacy column to stories if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' AND column_name = 'privacy'
    ) THEN
        ALTER TABLE stories 
        ADD COLUMN privacy VARCHAR(20) DEFAULT 'public' 
        CHECK (privacy IN ('public', 'friends', 'custom'));
        
        RAISE NOTICE '✅ Added privacy column to stories';
    ELSE
        RAISE NOTICE '✓ stories.privacy already exists';
    END IF;
END $$;

-- 2. Rename chat_participants to chat_users if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'chat_participants'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'chat_users'
    ) THEN
        ALTER TABLE chat_participants RENAME TO chat_users;
        
        -- Rename indexes
        ALTER INDEX IF EXISTS idx_chat_participants_chat 
            RENAME TO idx_chat_users_chat;
        ALTER INDEX IF EXISTS idx_chat_participants_user 
            RENAME TO idx_chat_users_user;
            
        -- Rename constraint
        ALTER TABLE chat_users 
            RENAME CONSTRAINT unique_participant TO unique_chat_user;
        
        RAISE NOTICE '✅ Renamed chat_participants to chat_users';
    ELSE
        RAISE NOTICE '✓ chat_users already exists or chat_participants does not exist';
    END IF;
END $$;

-- 3. Rename is_group to is_group_chat in chats table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chats' AND column_name = 'is_group'
    ) THEN
        ALTER TABLE chats RENAME COLUMN is_group TO is_group_chat;
        
        -- Rename index
        ALTER INDEX IF EXISTS idx_chats_is_group 
            RENAME TO idx_chats_is_group_chat;
        
        RAISE NOTICE '✅ Renamed is_group to is_group_chat';
    ELSE
        RAISE NOTICE '✓ is_group_chat already exists or is_group does not exist';
    END IF;
END $$;

-- 4. Change role to is_admin in chat_users if needed
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_users' AND column_name = 'role'
    ) THEN
        -- Add new column
        ALTER TABLE chat_users 
        ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        
        -- Migrate data: role='admin' -> is_admin=true
        UPDATE chat_users SET is_admin = (role = 'admin');
        
        -- Drop old column
        ALTER TABLE chat_users DROP COLUMN role;
        
        RAISE NOTICE '✅ Converted role to is_admin';
    ELSE
        RAISE NOTICE '✓ is_admin already exists or role does not exist';
    END IF;
END $$;

-- 5. Add message_type to messages if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'message_type'
    ) THEN
        ALTER TABLE messages 
        ADD COLUMN message_type VARCHAR(20) DEFAULT 'text' 
        CHECK (message_type IN ('text', 'image', 'voice', 'video', 'file', 'recalled'));
        
        RAISE NOTICE '✅ Added message_type to messages';
    ELSE
        RAISE NOTICE '✓ messages.message_type already exists';
    END IF;
END $$;

-- 6. Add status to messages if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'status'
    ) THEN
        ALTER TABLE messages 
        ADD COLUMN status VARCHAR(20) DEFAULT 'sent' 
        CHECK (status IN ('sent', 'delivered', 'read'));
        
        RAISE NOTICE '✅ Added status to messages';
    ELSE
        RAISE NOTICE '✓ messages.status already exists';
    END IF;
END $$;

-- 7. Add duration to messages if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'duration'
    ) THEN
        ALTER TABLE messages ADD COLUMN duration INTEGER;
        
        RAISE NOTICE '✅ Added duration to messages';
    ELSE
        RAISE NOTICE '✓ messages.duration already exists';
    END IF;
END $$;

-- 8. Create story_viewers table if it doesn't exist
CREATE TABLE IF NOT EXISTS story_viewers (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_story_viewer UNIQUE (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_viewers_story ON story_viewers(story_id);
CREATE INDEX IF NOT EXISTS idx_story_viewers_viewer ON story_viewers(viewer_id);

-- ============================================================
-- Verification Queries
-- ============================================================

-- Show tables
SELECT 'Tables in database:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Show stories columns
SELECT 'Stories table columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'stories'
ORDER BY ordinal_position;

-- Show chats columns
SELECT 'Chats table columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'chats'
ORDER BY ordinal_position;

-- Show chat_users columns
SELECT 'Chat_users table columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'chat_users'
ORDER BY ordinal_position;

-- Show messages columns
SELECT 'Messages table columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
