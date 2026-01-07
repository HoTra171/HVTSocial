import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  port: parseInt(process.env.SQL_PORT) || 1433,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: process.env.SQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.SQL_TRUST_CERT === 'true',
    useUTC: false,
  },
};

async function applyMigration() {
  try {
    const pool = await sql.connect(config);
    console.log('Connected to MSSQL');

    const query = `
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
          PRINT 'Table refresh_tokens created.';
      END
      ELSE
      BEGIN
          PRINT 'Table refresh_tokens already exists.';
      END
    `;

    await pool.request().query(query);
    console.log('Migration applied successfully.');
    await pool.close();
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

applyMigration();
