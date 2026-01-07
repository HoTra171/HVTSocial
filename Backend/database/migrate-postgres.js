/**
 * PostgreSQL Database Migration Script
 * Run this to add missing columns to users table
 *
 * Usage: node migrate-postgres.js
 */

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable not found!');
  console.error('Please set DATABASE_URL in your .env file or environment variables.');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

async function migrate() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('\n📝 Adding missing columns to users table...');

    const migrations = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(10)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires TIMESTAMP',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_attempts INTEGER DEFAULT 0',
    ];

    for (const sql of migrations) {
      try {
        await client.query(sql);
        console.log(`✅ ${sql.substring(0, 50)}...`);
      } catch (err) {
        console.error(`⚠️  Warning: ${err.message}`);
      }
    }

    console.log('\n🔍 Verifying columns...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Current users table schema:');
    console.table(result.rows);

    console.log('\n✅ Migration completed successfully!');
    console.log('🎉 You can now test registration from your frontend!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run migration
migrate();
