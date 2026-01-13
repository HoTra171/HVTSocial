-- ============================================================
-- PostgreSQL Migration for HVTSocial
-- Convert từ MSSQL sang PostgreSQL cho Railway deployment
-- ============================================================

-- Drop existing tables if needed (careful in production!)
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS posts CASCADE;
-- ... (uncomment nếu cần reset)

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar TEXT,
    cover_photo TEXT,
    bio TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    location VARCHAR(255),
    website VARCHAR(255),
    profile_picture TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted', 'pending')),
    suspended_until TIMESTAMP,
    suspension_reason TEXT,
    reset_otp VARCHAR(10),
    reset_otp_expires TIMESTAMP,
    reset_otp_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================
-- 2. POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    media_type VARCHAR(50),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted);

-- ============================================================
-- 3. COMMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- ============================================================
-- 4. LIKES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_like UNIQUE (user_id, post_id, comment_id),
    CONSTRAINT check_like_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_comment_id ON likes(comment_id);

-- ============================================================
-- 5. FRIENDSHIPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_friendship UNIQUE (requester_id, receiver_id),
    CONSTRAINT no_self_friend CHECK (requester_id != receiver_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_receiver ON friendships(receiver_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- ============================================================
-- 6. CHATS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    is_group_chat BOOLEAN DEFAULT FALSE,
    name VARCHAR(100),
    avatar TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chats_is_group_chat ON chats(is_group_chat);
CREATE INDEX idx_chats_created_at ON chats(created_at);

-- ============================================================
-- 7. CHAT_USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_users (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_chat_user UNIQUE (chat_id, user_id)
);

CREATE INDEX idx_chat_users_chat ON chat_users(chat_id);
CREATE INDEX idx_chat_users_user ON chat_users(user_id);

-- ============================================================
-- 8. MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'video', 'file', 'recalled')),
    media_url TEXT,
    duration INTEGER,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    reply_content TEXT,
    reply_type VARCHAR(20),
    reply_sender VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================================
-- 9. MESSAGE_READS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS message_reads (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_read UNIQUE (message_id, user_id)
);

CREATE INDEX idx_message_reads_message ON message_reads(message_id);
CREATE INDEX idx_message_reads_user ON message_reads(user_id);

-- ============================================================
-- 10. STORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS stories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    media_type VARCHAR(50),
    background_color VARCHAR(20),
    privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'friends', 'custom')),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);

-- ============================================================
-- 11. STORY_VIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS story_views (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_story_view UNIQUE (story_id, viewer_id)
);

CREATE INDEX idx_story_views_story ON story_views(story_id);
CREATE INDEX idx_story_views_viewer ON story_views(viewer_id);

-- ============================================================
-- 11b. STORY_VIEWERS TABLE (for custom privacy)
-- ============================================================
CREATE TABLE IF NOT EXISTS story_viewers (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_story_viewer UNIQUE (story_id, viewer_id)
);

CREATE INDEX idx_story_viewers_story ON story_viewers(story_id);
CREATE INDEX idx_story_viewers_viewer ON story_viewers(viewer_id);

-- ============================================================
-- 12. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'friend_request', 'message', 'story_view', 'mention', 'share')),
    actor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50),
    target_id INTEGER,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================================
-- 13. SAVED_POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_saved_post UNIQUE (user_id, post_id)
);

CREATE INDEX idx_saved_posts_user ON saved_posts(user_id);
CREATE INDEX idx_saved_posts_post ON saved_posts(post_id);

-- ============================================================
-- 14. SHARES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS shares (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    shared_to VARCHAR(50) DEFAULT 'timeline' CHECK (shared_to IN ('timeline', 'message', 'story')),
    caption TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shares_user ON shares(user_id);
CREATE INDEX idx_shares_post ON shares(post_id);
CREATE INDEX idx_shares_created_at ON shares(created_at);

-- ============================================================
-- 15. AUDIT_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- 15b. REFRESH_TOKENS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE,
    replaced_by_token VARCHAR(500)
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ============================================================
-- 16. PASSWORD_RESET_TOKENS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens(expires_at);

-- ============================================================
-- 17. ROLES TABLE (RBAC)
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
    ('admin', 'Administrator with full access'),
    ('moderator', 'Moderator with content management'),
    ('user', 'Regular user'),
    ('premium', 'Premium user with extra features')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 18. USER_ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- ============================================================
-- 19. PERFORMANCE INDEXES (OPTIMIZED)
-- ============================================================
-- Feeds
CREATE INDEX IF NOT EXISTS idx_posts_user_created_opt ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_opt ON posts(created_at DESC);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_post_created_opt ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_opt ON comments(parent_comment_id, created_at ASC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_chat_created_opt ON messages(chat_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_opt ON messages(sender_id, created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_opt ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- SUMMARY
-- ============================================================
SELECT
    'Migration Complete!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
    NOW() as completed_at;

-- Verify tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
