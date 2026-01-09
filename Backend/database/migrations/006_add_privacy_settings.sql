/* =============================================================
   Migration 006: Thêm Privacy Settings vào bảng users
   ============================================================= */

USE HVTSocial;
GO

-- Kiểm tra xem các cột đã tồn tại chưa
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('users')
    AND name = 'profile_visibility'
)
BEGIN
    ALTER TABLE users
    ADD profile_visibility NVARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private'));

    PRINT 'Added column: profile_visibility';
END
ELSE
BEGIN
    PRINT 'Column profile_visibility already exists';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('users')
    AND name = 'post_visibility'
)
BEGIN
    ALTER TABLE users
    ADD post_visibility NVARCHAR(20) DEFAULT 'public' CHECK (post_visibility IN ('public', 'friends'));

    PRINT 'Added column: post_visibility';
END
ELSE
BEGIN
    PRINT 'Column post_visibility already exists';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('users')
    AND name = 'allow_friend_requests'
)
BEGIN
    ALTER TABLE users
    ADD allow_friend_requests BIT DEFAULT 1;

    PRINT 'Added column: allow_friend_requests';
END
ELSE
BEGIN
    PRINT 'Column allow_friend_requests already exists';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('users')
    AND name = 'show_online_status'
)
BEGIN
    ALTER TABLE users
    ADD show_online_status BIT DEFAULT 1;

    PRINT 'Added column: show_online_status';
END
ELSE
BEGIN
    PRINT 'Column show_online_status already exists';
END
GO

PRINT 'Migration 006 completed: Privacy settings columns added successfully';
GO
