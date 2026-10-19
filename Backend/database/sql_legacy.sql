/* =============================================================
   XÓA & TẠO LẠI DATABASE
   ============================================================= */
USE master;
GO
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'HVTSocial')
BEGIN
    ALTER DATABASE HVTSocial SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE HVTSocial;
END
GO

CREATE DATABASE HVTSocial;
GO
USE HVTSocial;
GO

/* =============================================================
   BẢNG USERS
   ============================================================= */
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(100),
    username NVARCHAR(100) UNIQUE NOT NULL,
    date_of_birth DATE,
    gender NVARCHAR(10) CHECK (gender IN ('male','female','other')),
    avatar NVARCHAR(255),
    background NVARCHAR(255),
    bio NVARCHAR(MAX),
    address NVARCHAR(255),
    notification_unread INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    reset_otp NVARCHAR(10) NULL,
    reset_otp_expires DATETIME NULL,
    reset_otp_attempts INT DEFAULT 0
);
GO

/* =============================================================
   HOBBIES + USER_HOBBIES
   ============================================================= */
CREATE TABLE hobbies (
    id INT IDENTITY(1,1) PRIMARY KEY,
    content NVARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE user_hobbies (
    user_id INT NOT NULL,
    hobby_id INT NOT NULL,
    PRIMARY KEY (user_id, hobby_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hobby_id) REFERENCES hobbies(id) ON DELETE CASCADE
);
GO

/* =============================================================
   POSTS
   ============================================================= */
CREATE TABLE posts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    content NVARCHAR(MAX),
    media NVARCHAR(MAX),
    status NVARCHAR(10) DEFAULT 'public' CHECK(status IN ('public','friends','private')),
    shared_post_id INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_posts_shared_post_id
ON posts(shared_post_id);

ALTER TABLE posts
ADD CONSTRAINT fk_posts_shared_post
    FOREIGN KEY(shared_post_id) REFERENCES posts(id) ON DELETE NO ACTION;
GO

/* =============================================================
   COMMENTS
   ============================================================= */
CREATE TABLE comments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    media NVARCHAR(255),
    comment_parent INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE NO ACTION,
    FOREIGN KEY(comment_parent) REFERENCES comments(id) ON DELETE NO ACTION
);
GO

/* =============================================================
   LIKES (like post hoặc comment)
   ============================================================= */
CREATE TABLE likes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    post_id INT NULL,
    comment_id INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE NO ACTION,
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE NO ACTION,
    CONSTRAINT chk_like_target CHECK(
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    CONSTRAINT uq_like UNIQUE(user_id, post_id, comment_id)
);
GO

/* =============================================================
   CHATS & CHAT_USERS
   ============================================================= */
CREATE TABLE chats (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100),
    is_group_chat BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE chat_users (
    chat_id INT NOT NULL,
    user_id INT NOT NULL,
    is_admin BIT DEFAULT 0,
    PRIMARY KEY(chat_id, user_id),
    FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_chat_users_userid_chatid
ON chat_users(user_id, chat_id);
GO

/* =============================================================
   MESSAGES
   ============================================================= */
CREATE TABLE messages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    chat_id INT NOT NULL,
    sender_id INT NOT NULL,
    content NVARCHAR(MAX),
    status NVARCHAR(10) DEFAULT 'sent'
        CHECK(status IN ('sent','delivered','read')),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    message_type NVARCHAR(20) NULL,
    media_url NVARCHAR(MAX) NULL,
    duration INT NULL,
    FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_messages_chatid ON messages(chat_id);
GO
CREATE INDEX idx_messages_chatid_createdat ON messages(chat_id, created_at);
GO
CREATE INDEX idx_messages_chatid_createdat_desc
ON messages(chat_id, created_at DESC, id DESC)
INCLUDE (sender_id, content, status, message_type, media_url);
GO

/* =============================================================
   NOTIFICATIONS
   ============================================================= */
CREATE TABLE notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    sender_id INT NULL,
    post_id INT NULL,
    content NVARCHAR(255),
    type NVARCHAR(20) DEFAULT 'other'
        CHECK(type IN ('like','comment','friend_request','message','other')),
    status NVARCHAR(10) DEFAULT 'unread'
        CHECK(status IN ('unread','read')),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE NO ACTION,
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE NO ACTION
);
GO

/* =============================================================
   FRIENDSHIPS (quan hệ bạn bè 2 chiều)
   ============================================================= */
CREATE TABLE friendships (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    status NVARCHAR(10) DEFAULT 'pending'
        CHECK(status IN ('pending','accepted','blocked')),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(friend_id) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT uq_friendship UNIQUE(user_id, friend_id)
);
GO

/* =============================================================
   STORIES
   ============================================================= */
CREATE TABLE stories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    background_color NVARCHAR(20) NULL,
    media_type NVARCHAR(20) NOT NULL,
    media_url NVARCHAR(MAX)  NULL,
    caption NVARCHAR(500) NULL,
    privacy NVARCHAR(20) DEFAULT 'public'
        CHECK (privacy IN ('public','friends','custom')),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    music_url NVARCHAR(500) NULL,
    text_color NVARCHAR(20) NULL DEFAULT '#FFFFFF',
    font_size INT NULL DEFAULT 24,
    text_position NVARCHAR(500) NULL,
    show_frame BIT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

CREATE TABLE story_views (
    story_id  INT NOT NULL,
    viewer_id INT NOT NULL,
    viewed_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (story_id, viewer_id),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE NO ACTION
);
GO

CREATE TRIGGER trg_stories_updated_at ON stories 
AFTER UPDATE AS
BEGIN
    UPDATE stories
    SET updated_at = GETDATE()
    FROM inserted i
    WHERE stories.id = i.id;
END
GO

/* =============================================================
   SAVED_POSTS (bài viết đã lưu)
   ============================================================= */
CREATE TABLE saved_posts (
    user_id    INT NOT NULL,
    post_id    INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY(user_id, post_id),
    FOREIGN KEY(user_id) REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY(post_id) REFERENCES posts(id)  ON DELETE NO ACTION
);
GO

/* =============================================================
   REACTIONS (cảm xúc đa dạng)
   ============================================================= */
CREATE TABLE reactions (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    name       NVARCHAR(50) NOT NULL,
    icon       NVARCHAR(100) NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Reaction trên bài viết
CREATE TABLE post_reactions (
    user_id     INT NOT NULL,
    post_id     INT NOT NULL,
    reaction_id INT NOT NULL,
    created_at  DATETIME DEFAULT GETDATE(),
    PRIMARY KEY(user_id, post_id),
    FOREIGN KEY(user_id)     REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(post_id)     REFERENCES posts(id) ON DELETE NO ACTION,
    FOREIGN KEY(reaction_id) REFERENCES reactions(id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_post_reactions_post
ON post_reactions(post_id);
GO

-- Reaction trên comment
CREATE TABLE comment_reactions (
    user_id     INT NOT NULL,
    comment_id  INT NOT NULL,
    reaction_id INT NOT NULL,
    created_at  DATETIME DEFAULT GETDATE(),
    PRIMARY KEY(user_id, comment_id),
    FOREIGN KEY(user_id)     REFERENCES users(id) ON DELETE NO ACTION,
    FOREIGN KEY(comment_id)  REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY(reaction_id) REFERENCES reactions(id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_comment_reactions_comment
ON comment_reactions(comment_id);
GO

/* =============================================================
   TAG BẠN BÈ TRONG POST & COMMENT
   ============================================================= */
CREATE TABLE post_tags (
    post_id        INT NOT NULL,
    tagged_user_id INT NOT NULL,
    created_at     DATETIME DEFAULT GETDATE(),
    PRIMARY KEY(post_id, tagged_user_id),
    FOREIGN KEY(post_id)        REFERENCES posts(id) ON DELETE NO ACTION,
    FOREIGN KEY(tagged_user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_post_tags_user
ON post_tags(tagged_user_id);
GO

CREATE TABLE comment_tags (
    comment_id     INT NOT NULL,
    tagged_user_id INT NOT NULL,
    created_at     DATETIME DEFAULT GETDATE(),
    PRIMARY KEY(comment_id, tagged_user_id),
    FOREIGN KEY(comment_id)     REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY(tagged_user_id) REFERENCES users(id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_comment_tags_user
ON comment_tags(tagged_user_id);
GO

/* =============================================================
   CHẶN NGƯỜI DÙNG (BLOCK)
   ============================================================= */
CREATE TABLE user_blocks (
    blocker_id INT NOT NULL,
    blocked_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY(blocker_id, blocked_id),
    FOREIGN KEY(blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(blocked_id) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT chk_block_self CHECK (blocker_id <> blocked_id)
);
GO

/* =============================================================
   BÁO CÁO NỘI DUNG (REPORTS)
   ============================================================= */
CREATE TABLE reports (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    reporter_id INT NOT NULL,
    target_type NVARCHAR(20) NOT NULL
        CHECK (target_type IN ('user','post','comment','message')),
    target_id   INT NOT NULL,
    reason      NVARCHAR(MAX) NULL,
    status      NVARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending','reviewed','dismissed')),
    created_at  DATETIME DEFAULT GETDATE(),
    reviewed_at DATETIME NULL,
    reviewer_id INT NULL,
    FOREIGN KEY(reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE NO ACTION
);
GO

CREATE INDEX idx_reports_target
ON reports(target_type, target_id);
GO

/* =============================================================
   THEO DÕI 1 CHIỀU (FOLLOWS)
   ============================================================= */
CREATE TABLE follows (
    follower_id  INT NOT NULL,
    following_id INT NOT NULL,
    created_at   DATETIME DEFAULT GETDATE(),
    PRIMARY KEY(follower_id, following_id),
    FOREIGN KEY(follower_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(following_id) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT chk_follow_self CHECK (follower_id <> following_id)
);
GO

CREATE INDEX idx_follows_following
ON follows(following_id);
GO

/* =============================================================
   TRIGGERS UPDATE updated_at
   ============================================================= */
CREATE TRIGGER trg_users_updated_at ON users AFTER UPDATE AS
BEGIN
    UPDATE users
    SET updated_at = GETDATE()
    FROM inserted i
    WHERE users.id = i.id;
END
GO

CREATE TRIGGER trg_posts_updated_at ON posts AFTER UPDATE AS
BEGIN
    UPDATE posts
    SET updated_at = GETDATE()
    FROM inserted i
    WHERE posts.id = i.id;
END
GO

CREATE TRIGGER trg_comments_updated_at ON comments AFTER UPDATE AS
BEGIN
    UPDATE comments
    SET updated_at = GETDATE()
    FROM inserted i
    WHERE comments.id = i.id;
END
GO

CREATE TRIGGER trg_likes_updated_at ON likes AFTER UPDATE AS
BEGIN
    UPDATE likes
    SET updated_at = GETDATE()
    FROM inserted i
    WHERE likes.id = i.id;
END
GO

CREATE TRIGGER trg_messages_updated_at ON messages AFTER UPDATE AS
BEGIN
    UPDATE messages
    SET updated_at = GETDATE()
    FROM inserted i
    WHERE messages.id = i.id;
END
GO

CREATE TRIGGER trg_notifications_updated_at ON notifications AFTER UPDATE AS
BEGIN
    UPDATE notifications
    SET updated_at = GETDATE()
    FROM inserted i
    WHERE notifications.id = i.id;
END
GO

CREATE TRIGGER trg_friendships_updated_at ON friendships AFTER UPDATE AS
BEGIN
    UPDATE friendships
    SET updated_at = GETDATE()
    FROM inserted i
    WHERE friendships.id = i.id;
END
GO

--  THÊM CỘT VÀO BẢNG STORIES

-- Privacy
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('stories') AND name = 'privacy')
BEGIN
    ALTER TABLE stories
    ADD privacy NVARCHAR(20) DEFAULT 'public';
END
GO

-- Sticker
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('stories') AND name = 'sticker')
BEGIN
    ALTER TABLE stories
    ADD sticker NVARCHAR(10) NULL;
END
GO

-- Sticker Position
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('stories') AND name = 'sticker_position')
BEGIN
    ALTER TABLE stories
    ADD sticker_position NVARCHAR(MAX) NULL;
END
GO

-- TẠO BẢNG STORY_VIEWERS (cho custom privacy)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'story_viewers')
BEGIN
    CREATE TABLE story_viewers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        story_id INT NOT NULL,
        viewer_id INT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE NO ACTION,
        
        --  1 viewer chỉ được add 1 lần cho 1 story
        UNIQUE(story_id, viewer_id)
    );
    
    CREATE INDEX idx_story_viewers_story ON story_viewers(story_id);
    CREATE INDEX idx_story_viewers_viewer ON story_viewers(viewer_id);
END
GO

--  CHECK CONSTRAINT cho privacy
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_story_privacy')
BEGIN
    ALTER TABLE stories
    ADD CONSTRAINT CHK_story_privacy 
    CHECK (privacy IN ('public', 'friends', 'custom'));
END
GO

-- SAMPLE DATA
PRINT 'Schema updated successfully!';
PRINT 'Privacy values: public, friends, custom';
PRINT 'story_viewers table created for custom privacy';

PRINT 'Database HVTSocial created successfully!';
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='call_history' AND xtype='U')
BEGIN
    CREATE TABLE call_history (
        id INT IDENTITY(1,1) PRIMARY KEY,
        caller_id INT NOT NULL,
        receiver_id INT NOT NULL,
        call_type VARCHAR(10) NOT NULL CHECK (call_type IN ('video', 'voice')),
        status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'missed', 'rejected', 'failed', 'busy')),
        duration INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (caller_id) REFERENCES users(id), -- Bỏ ON DELETE CASCADE để tránh lỗi cycle
        FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE INDEX idx_call_history_caller ON call_history(caller_id);
    CREATE INDEX idx_call_history_receiver ON call_history(receiver_id);
END