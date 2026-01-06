/**
 * PostgreSQL Migration Runner
 * Chạy file postgres-migration.sql để setup database trên Railway/Neon/Supabase
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection config
const config = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Railway/Render requires this
  } : false
};

async function runMigration() {
  const client = new Client(config);

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!');

    // Read migration file
    const migrationPath = path.join(__dirname, 'postgres-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📝 Running migration...');
    console.log('=' .repeat(50));

    // Execute the entire SQL file at once instead of splitting
    // PostgreSQL can handle multiple statements in one query
    try {
      await client.query(migrationSQL);
      console.log('✅ All tables, indexes, and constraints created successfully!');
    } catch (error) {
      console.error('❌ Migration error:', error.message);
      throw error;
    }

    console.log('=' .repeat(50));

    // Verify tables created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`\n📋 Tables created (${result.rows.length}):`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n🎉 Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

// Run migration
console.log('\n🚀 PostgreSQL Migration Tool\n');
runMigration();
