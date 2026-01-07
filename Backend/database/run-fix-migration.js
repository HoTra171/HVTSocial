/**
 * Run PostgreSQL Schema Fix Migration
 *
 * This script fixes missing tables and columns in PostgreSQL database:
 * - Adds hobbies and user_hobbies tables
 * - Adds user_id/friend_id columns to friendships table
 * - Adds sender_id column to notifications table
 * - Adds missing columns to stories table
 * - Adds follows and user_blocks tables
 *
 * Usage:
 *   node Backend/database/run-fix-migration.js
 *
 * Or with DATABASE_URL:
 *   DATABASE_URL=postgresql://... node Backend/database/run-fix-migration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('Please set DATABASE_URL to your PostgreSQL connection string');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === 'production'
        ? {
            rejectUnauthorized: false,
          }
        : false,
  });

  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected successfully');

    // Read migration file
    const migrationPath = path.join(__dirname, 'fix-postgres-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration...');
    console.log('This will:');
    console.log('  - Create hobbies and user_hobbies tables');
    console.log('  - Add user_id/friend_id columns to friendships');
    console.log('  - Add sender_id column to notifications');
    console.log('  - Add missing columns to stories');
    console.log('  - Create follows and user_blocks tables');
    console.log('');

    // Execute migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    // Verify tables exist
    console.log('\n📊 Verifying tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('hobbies', 'user_hobbies', 'follows', 'user_blocks')
      ORDER BY table_name
    `);

    console.log('Created tables:');
    tablesResult.rows.forEach((row) => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Verify columns
    console.log('\n📋 Verifying columns...');

    // Check friendships columns
    const friendshipsCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'friendships' 
      AND column_name IN ('user_id', 'friend_id')
    `);
    console.log('friendships columns:', friendshipsCols.rows.map((r) => r.column_name).join(', '));

    // Check notifications columns
    const notificationsCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name IN ('sender_id', 'status', 'post_id', 'content')
    `);
    console.log(
      'notifications columns:',
      notificationsCols.rows.map((r) => r.column_name).join(', ')
    );

    // Check stories columns
    const storiesCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stories' 
      AND column_name IN ('music_url', 'caption', 'text_color', 'font_size', 'text_position', 'show_frame', 'sticker', 'sticker_position', 'updated_at')
    `);
    console.log('stories columns:', storiesCols.rows.map((r) => r.column_name).join(', '));
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigration();
