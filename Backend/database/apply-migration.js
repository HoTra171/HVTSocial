/**
 * Apply PostgreSQL migration manually
 * Usage: node database/apply-migration.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set!');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function applyMigration() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!');

    const migrationPath = path.join(__dirname, 'postgres-migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Reading migration file...');
    console.log(`📍 File: ${migrationPath}`);

    console.log('🚀 Applying migration...');
    await client.query(sql);

    console.log('✅ Migration applied successfully!');

    // Verify tables
    console.log('\n📊 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📋 Tables in database:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // Check stories schema
    console.log('\n🔍 Checking stories table schema...');
    const storiesSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'stories'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Stories columns:');
    storiesSchema.rows.forEach((row) => {
      console.log(
        `  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`
      );
    });

    // Check chat_users schema
    console.log('\n🔍 Checking chat_users table...');
    const chatUsersExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'chat_users'
      ) as exists;
    `);

    if (chatUsersExists.rows[0].exists) {
      console.log('✅ chat_users table exists');

      const chatUsersSchema = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'chat_users'
        ORDER BY ordinal_position;
      `);

      console.log('📋 chat_users columns:');
      chatUsersSchema.rows.forEach((row) => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('❌ chat_users table does NOT exist');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Connection closed');
  }
}

applyMigration();
