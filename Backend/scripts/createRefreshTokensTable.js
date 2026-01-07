// scripts/createRefreshTokensTable.js
import { pool } from '../config/db.js';

async function createTable() {
    console.log('Creating refresh_tokens table...');

    await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

    console.log('✅ refresh_tokens table created!');
    process.exit(0);
}

createTable().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
