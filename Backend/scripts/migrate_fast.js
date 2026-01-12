import { pool } from '../config/db.js';

const createTableQuery = `
CREATE TABLE IF NOT EXISTS call_history (
    id SERIAL PRIMARY KEY,
    caller_id INT NOT NULL,
    receiver_id INT NOT NULL,
    call_type VARCHAR(10) NOT NULL CHECK (call_type IN ('video', 'voice')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'missed', 'rejected', 'failed', 'busy')),
    duration INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_call_history_caller ON call_history(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_history_receiver ON call_history(receiver_id);
`;

const runMigration = async () => {
    try {
        console.log('🚀 Starting migration...');
        if (!pool) {
            throw new Error('Database pool not initialized. Check your .env config.');
        }

        // Check if we are using the pg pool directly (Postgres) or mssql pool
        // Based on db.js, pool.query exists for Postgres

        console.log('📦 Creating table call_history...');
        await pool.query(createTableQuery);

        console.log('✅ Migration successful! Table "call_history" created.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

// Wait a bit for db.js to initialize connection
setTimeout(runMigration, 1000);
