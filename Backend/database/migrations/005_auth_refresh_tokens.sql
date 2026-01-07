-- Create refresh_tokens table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='refresh_tokens' AND xtype='U')
BEGIN
    CREATE TABLE refresh_tokens (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        token NVARCHAR(500) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        revoked BIT DEFAULT 0,
        replaced_by_token NVARCHAR(500) NULL,
        CONSTRAINT FK_refresh_tokens_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
    CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
END
GO
