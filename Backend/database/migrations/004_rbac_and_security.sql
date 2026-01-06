/* =============================================================
   MIGRATION 004: RBAC, 2FA, Account Status & Security Features
   Created: 2026-01-01
   Description: Add role-based access control, two-factor auth,
                account suspension, and security features
   ============================================================= */

USE HVTSocial;
GO

/* =============================================================
   1. ROLES TABLE - Định nghĩa vai trò trong hệ thống
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
BEGIN
    CREATE TABLE roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) UNIQUE NOT NULL,
        description NVARCHAR(255),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );

    -- Insert default roles
    INSERT INTO roles (name, description) VALUES
    ('user', 'Regular user with basic permissions'),
    ('moderator', 'Can moderate content and users'),
    ('admin', 'Full system access'),
    ('support', 'Customer support staff');

    PRINT '✓ Table roles created with default roles';
END
GO

/* =============================================================
   2. PERMISSIONS TABLE - Định nghĩa quyền hạn
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'permissions')
BEGIN
    CREATE TABLE permissions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) UNIQUE NOT NULL,
        resource NVARCHAR(50) NOT NULL,  -- posts, users, comments, etc.
        action NVARCHAR(50) NOT NULL,    -- create, read, update, delete
        description NVARCHAR(255),
        created_at DATETIME DEFAULT GETDATE()
    );

    -- Insert default permissions
    INSERT INTO permissions (name, resource, action, description) VALUES
    -- User permissions
    ('user.read', 'user', 'read', 'View user profiles'),
    ('user.update.own', 'user', 'update', 'Update own profile'),
    ('user.delete.own', 'user', 'delete', 'Delete own account'),

    -- Post permissions
    ('post.create', 'post', 'create', 'Create posts'),
    ('post.read', 'post', 'read', 'View posts'),
    ('post.update.own', 'post', 'update', 'Update own posts'),
    ('post.delete.own', 'post', 'delete', 'Delete own posts'),
    ('post.delete.any', 'post', 'delete', 'Delete any post (moderator)'),

    -- Comment permissions
    ('comment.create', 'comment', 'create', 'Create comments'),
    ('comment.read', 'comment', 'read', 'View comments'),
    ('comment.delete.any', 'comment', 'delete', 'Delete any comment (moderator)'),

    -- Admin permissions
    ('user.suspend', 'user', 'suspend', 'Suspend user accounts'),
    ('user.delete.any', 'user', 'delete', 'Delete any user account'),
    ('report.review', 'report', 'review', 'Review content reports'),
    ('audit.read', 'audit', 'read', 'View audit logs'),
    ('system.config', 'system', 'config', 'Configure system settings');

    PRINT '✓ Table permissions created with default permissions';
END
GO

/* =============================================================
   3. ROLE_PERMISSIONS - Mapping vai trò với quyền
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'role_permissions')
BEGIN
    CREATE TABLE role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );

    -- Assign permissions to roles
    DECLARE @userRoleId INT, @modRoleId INT, @adminRoleId INT, @supportRoleId INT;
    SELECT @userRoleId = id FROM roles WHERE name = 'user';
    SELECT @modRoleId = id FROM roles WHERE name = 'moderator';
    SELECT @adminRoleId = id FROM roles WHERE name = 'admin';
    SELECT @supportRoleId = id FROM roles WHERE name = 'support';

    -- User role permissions (basic)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT @userRoleId, id FROM permissions WHERE name IN (
        'user.read', 'user.update.own', 'user.delete.own',
        'post.create', 'post.read', 'post.update.own', 'post.delete.own',
        'comment.create', 'comment.read'
    );

    -- Moderator role permissions (user + moderation)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT @modRoleId, id FROM permissions WHERE name IN (
        'user.read', 'user.update.own', 'user.delete.own',
        'post.create', 'post.read', 'post.update.own', 'post.delete.own', 'post.delete.any',
        'comment.create', 'comment.read', 'comment.delete.any',
        'user.suspend', 'report.review'
    );

    -- Support role permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT @supportRoleId, id FROM permissions WHERE name IN (
        'user.read', 'report.review', 'audit.read'
    );

    -- Admin role permissions (all)
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT @adminRoleId, id FROM permissions;

    PRINT '✓ Table role_permissions created and populated';
END
GO

/* =============================================================
   4. USER_ROLES - Gán vai trò cho người dùng
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_roles')
BEGIN
    CREATE TABLE user_roles (
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        assigned_at DATETIME DEFAULT GETDATE(),
        assigned_by INT NULL, -- user_id of admin who assigned
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE NO ACTION
    );

    -- Assign 'user' role to all existing users
    DECLARE @userRoleId INT;
    SELECT @userRoleId = id FROM roles WHERE name = 'user';

    INSERT INTO user_roles (user_id, role_id)
    SELECT id, @userRoleId FROM users;

    PRINT '✓ Table user_roles created and all users assigned default role';
END
GO

/* =============================================================
   5. UPDATE USERS TABLE - Add security fields
   ============================================================= */

-- Account status
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'account_status')
BEGIN
    ALTER TABLE users
    ADD account_status NVARCHAR(20) DEFAULT 'active' NOT NULL
        CHECK (account_status IN ('active', 'suspended', 'deactivated', 'deleted'));
    PRINT '✓ Added account_status column to users';
END
GO

-- Suspension reason and dates
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'suspended_at')
BEGIN
    ALTER TABLE users
    ADD suspended_at DATETIME NULL,
        suspended_until DATETIME NULL,
        suspension_reason NVARCHAR(500) NULL,
        suspended_by INT NULL,
        FOREIGN KEY (suspended_by) REFERENCES users(id) ON DELETE NO ACTION;
    PRINT '✓ Added suspension tracking columns to users';
END
GO

-- 2FA fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'two_factor_enabled')
BEGIN
    ALTER TABLE users
    ADD two_factor_enabled BIT DEFAULT 0 NOT NULL,
        two_factor_secret NVARCHAR(255) NULL,
        two_factor_backup_codes NVARCHAR(MAX) NULL; -- JSON array of backup codes
    PRINT '✓ Added 2FA columns to users';
END
GO

-- Email verification
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'email_verified')
BEGIN
    ALTER TABLE users
    ADD email_verified BIT DEFAULT 0 NOT NULL,
        email_verified_at DATETIME NULL,
        email_verification_token NVARCHAR(255) NULL,
        email_verification_expires DATETIME NULL;
    PRINT '✓ Added email verification columns to users';
END
GO

-- Phone verification for SMS 2FA
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'phone_number')
BEGIN
    ALTER TABLE users
    ADD phone_number NVARCHAR(20) NULL,
        phone_verified BIT DEFAULT 0 NOT NULL,
        phone_verified_at DATETIME NULL;
    PRINT '✓ Added phone verification columns to users';
END
GO

-- Last login tracking
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_login_at')
BEGIN
    ALTER TABLE users
    ADD last_login_at DATETIME NULL,
        last_login_ip NVARCHAR(45) NULL; -- IPv6 support
    PRINT '✓ Added login tracking columns to users';
END
GO

-- GDPR consent
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'privacy_consent')
BEGIN
    ALTER TABLE users
    ADD privacy_consent BIT DEFAULT 0 NOT NULL,
        privacy_consent_at DATETIME NULL,
        terms_accepted BIT DEFAULT 0 NOT NULL,
        terms_accepted_at DATETIME NULL;
    PRINT '✓ Added GDPR consent columns to users';
END
GO

/* =============================================================
   6. AUDIT_LOGS - Comprehensive audit trail
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        action NVARCHAR(100) NOT NULL, -- login, logout, create_post, delete_user, etc.
        resource_type NVARCHAR(50) NULL, -- user, post, comment, etc.
        resource_id INT NULL,
        old_values NVARCHAR(MAX) NULL, -- JSON of old values
        new_values NVARCHAR(MAX) NULL, -- JSON of new values
        ip_address NVARCHAR(45) NULL,
        user_agent NVARCHAR(500) NULL,
        status NVARCHAR(20) DEFAULT 'success', -- success, failed
        error_message NVARCHAR(MAX) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION
    );

    CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
    CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

    PRINT '✓ Table audit_logs created with indexes';
END
GO

/* =============================================================
   7. LOGIN_ATTEMPTS - Track failed login attempts
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'login_attempts')
BEGIN
    CREATE TABLE login_attempts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(100) NOT NULL,
        ip_address NVARCHAR(45) NOT NULL,
        user_agent NVARCHAR(500) NULL,
        status NVARCHAR(20) DEFAULT 'failed', -- success, failed, blocked
        attempt_count INT DEFAULT 1,
        last_attempt_at DATETIME DEFAULT GETDATE(),
        created_at DATETIME DEFAULT GETDATE()
    );

    CREATE INDEX idx_login_attempts_email ON login_attempts(email);
    CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
    CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at DESC);

    PRINT '✓ Table login_attempts created';
END
GO

/* =============================================================
   8. TWO_FACTOR_CODES - Temporary 2FA codes (SMS/Email)
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'two_factor_codes')
BEGIN
    CREATE TABLE two_factor_codes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        code NVARCHAR(10) NOT NULL,
        type NVARCHAR(20) DEFAULT 'totp', -- totp, sms, email
        expires_at DATETIME NOT NULL,
        used BIT DEFAULT 0,
        used_at DATETIME NULL,
        ip_address NVARCHAR(45) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_2fa_codes_user_id ON two_factor_codes(user_id);
    CREATE INDEX idx_2fa_codes_expires_at ON two_factor_codes(expires_at);

    PRINT '✓ Table two_factor_codes created';
END
GO

/* =============================================================
   9. DATA_EXPORT_REQUESTS - GDPR data export tracking
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'data_export_requests')
BEGIN
    CREATE TABLE data_export_requests (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        status NVARCHAR(20) DEFAULT 'pending',
            -- pending, processing, completed, failed
        file_url NVARCHAR(500) NULL,
        file_expires_at DATETIME NULL,
        requested_at DATETIME DEFAULT GETDATE(),
        completed_at DATETIME NULL,
        error_message NVARCHAR(MAX) NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_data_exports_user_id ON data_export_requests(user_id);
    CREATE INDEX idx_data_exports_status ON data_export_requests(status);

    PRINT '✓ Table data_export_requests created';
END
GO

/* =============================================================
   10. DATA_DELETION_REQUESTS - GDPR right to be forgotten
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'data_deletion_requests')
BEGIN
    CREATE TABLE data_deletion_requests (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        status NVARCHAR(20) DEFAULT 'pending',
            -- pending, approved, rejected, completed
        reason NVARCHAR(500) NULL,
        requested_at DATETIME DEFAULT GETDATE(),
        reviewed_at DATETIME NULL,
        reviewed_by INT NULL,
        completed_at DATETIME NULL,
        rejection_reason NVARCHAR(500) NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE NO ACTION
    );

    CREATE INDEX idx_data_deletions_user_id ON data_deletion_requests(user_id);
    CREATE INDEX idx_data_deletions_status ON data_deletion_requests(status);

    PRINT '✓ Table data_deletion_requests created';
END
GO

/* =============================================================
   11. RATE_LIMIT_TRACKING - Per-user rate limiting
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'rate_limit_tracking')
BEGIN
    CREATE TABLE rate_limit_tracking (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        ip_address NVARCHAR(45) NOT NULL,
        endpoint NVARCHAR(255) NOT NULL,
        request_count INT DEFAULT 1,
        window_start DATETIME DEFAULT GETDATE(),
        window_end DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_rate_limit_user_endpoint ON rate_limit_tracking(user_id, endpoint, window_end);
    CREATE INDEX idx_rate_limit_ip_endpoint ON rate_limit_tracking(ip_address, endpoint, window_end);

    PRINT '✓ Table rate_limit_tracking created';
END
GO

/* =============================================================
   12. UPDATE REPORTS TABLE - Add moderator actions
   ============================================================= */
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('reports') AND name = 'reviewed_at')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('reports') AND name = 'action_taken')
    BEGIN
        ALTER TABLE reports
        ADD action_taken NVARCHAR(50) NULL, -- no_action, content_removed, user_warned, user_suspended
            action_notes NVARCHAR(MAX) NULL;
        PRINT '✓ Added moderator action columns to reports';
    END
END
GO

/* =============================================================
   13. EMAIL_TEMPLATES - Managed email templates
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'email_templates')
BEGIN
    CREATE TABLE email_templates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) UNIQUE NOT NULL, -- welcome, password_reset, 2fa_code, etc.
        subject NVARCHAR(255) NOT NULL,
        body NVARCHAR(MAX) NOT NULL, -- HTML template
        variables NVARCHAR(MAX) NULL, -- JSON array of available variables
        active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );

    -- Insert default templates
    INSERT INTO email_templates (name, subject, body, variables) VALUES
    ('welcome', 'Welcome to HVTSocial!',
     '<h1>Welcome {{full_name}}!</h1><p>Thanks for joining HVTSocial.</p>',
     '["full_name", "username"]'),
    ('email_verification', 'Verify your email address',
     '<h1>Verify Email</h1><p>Click here: {{verification_link}}</p>',
     '["verification_link", "full_name"]'),
    ('password_reset', 'Reset your password',
     '<h1>Password Reset</h1><p>Your OTP: {{otp}}</p><p>Expires in 10 minutes.</p>',
     '["otp", "full_name"]'),
    ('2fa_code', 'Your 2FA code',
     '<h1>Two-Factor Authentication</h1><p>Your code: {{code}}</p>',
     '["code", "full_name"]'),
    ('account_suspended', 'Your account has been suspended',
     '<h1>Account Suspended</h1><p>Reason: {{reason}}</p><p>Until: {{suspended_until}}</p>',
     '["reason", "suspended_until", "full_name"]'),
    ('security_alert', 'Security Alert',
     '<h1>Security Alert</h1><p>{{alert_message}}</p><p>IP: {{ip_address}}</p>',
     '["alert_message", "ip_address", "full_name"]');

    PRINT '✓ Table email_templates created with default templates';
END
GO

/* =============================================================
   14. EMAIL_QUEUE - Background job queue for emails
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'email_queue')
BEGIN
    CREATE TABLE email_queue (
        id INT IDENTITY(1,1) PRIMARY KEY,
        to_email NVARCHAR(100) NOT NULL,
        subject NVARCHAR(255) NOT NULL,
        body NVARCHAR(MAX) NOT NULL,
        template_name NVARCHAR(100) NULL,
        status NVARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
        attempts INT DEFAULT 0,
        max_attempts INT DEFAULT 3,
        error_message NVARCHAR(MAX) NULL,
        scheduled_at DATETIME DEFAULT GETDATE(),
        sent_at DATETIME NULL,
        created_at DATETIME DEFAULT GETDATE()
    );

    CREATE INDEX idx_email_queue_status ON email_queue(status, scheduled_at);

    PRINT '✓ Table email_queue created';
END
GO

/* =============================================================
   15. CONTENT_MODERATION_RULES - Auto-moderation rules
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'content_moderation_rules')
BEGIN
    CREATE TABLE content_moderation_rules (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        rule_type NVARCHAR(50) NOT NULL, -- keyword, regex, ai_filter
        pattern NVARCHAR(MAX) NOT NULL, -- keyword or regex pattern
        action NVARCHAR(50) DEFAULT 'flag', -- flag, auto_remove, warn_user
        severity NVARCHAR(20) DEFAULT 'medium', -- low, medium, high
        active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );

    -- Insert default moderation rules
    INSERT INTO content_moderation_rules (name, rule_type, pattern, action, severity) VALUES
    ('Profanity Filter', 'keyword', 'fuck,shit,damn', 'flag', 'medium'),
    ('Spam Detection', 'keyword', 'click here,buy now,limited offer', 'flag', 'high'),
    ('Hate Speech', 'keyword', 'hate,racist', 'auto_remove', 'high');

    PRINT '✓ Table content_moderation_rules created with default rules';
END
GO

/* =============================================================
   16. MODERATION_ACTIONS - Track all moderation actions
   ============================================================= */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'moderation_actions')
BEGIN
    CREATE TABLE moderation_actions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        moderator_id INT NOT NULL,
        target_type NVARCHAR(50) NOT NULL, -- post, comment, user
        target_id INT NOT NULL,
        action NVARCHAR(50) NOT NULL, -- remove, restore, warn, suspend
        reason NVARCHAR(500) NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE NO ACTION
    );

    CREATE INDEX idx_moderation_actions_target ON moderation_actions(target_type, target_id);
    CREATE INDEX idx_moderation_actions_moderator ON moderation_actions(moderator_id);

    PRINT '✓ Table moderation_actions created';
END
GO

/* =============================================================
   CLEANUP & FINAL TASKS
   ============================================================= */

-- Add trigger for roles updated_at
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_roles_updated_at')
BEGIN
    EXEC('
    CREATE TRIGGER trg_roles_updated_at ON roles AFTER UPDATE AS
    BEGIN
        UPDATE roles
        SET updated_at = GETDATE()
        FROM inserted i
        WHERE roles.id = i.id;
    END
    ');
    PRINT '✓ Trigger trg_roles_updated_at created';
END
GO

PRINT '';
PRINT '================================================';
PRINT 'Migration 004 completed successfully!';
PRINT '================================================';
PRINT 'Created/Updated:';
PRINT '  ✓ RBAC: roles, permissions, role_permissions, user_roles';
PRINT '  ✓ Security: 2FA fields, account status, email/phone verification';
PRINT '  ✓ Audit: audit_logs, login_attempts, moderation_actions';
PRINT '  ✓ GDPR: data_export_requests, data_deletion_requests';
PRINT '  ✓ Rate Limiting: rate_limit_tracking';
PRINT '  ✓ Email: email_templates, email_queue';
PRINT '  ✓ Content Moderation: moderation_rules, moderation_actions';
PRINT '================================================';
GO
