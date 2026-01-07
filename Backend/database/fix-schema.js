/**
 * Quick schema fix for Railway PostgreSQL
 * Applies ALTER TABLE commands to existing database
 * Safe to run multiple times
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
  console.log('\n💡 Usage:');
  console.log('   DATABASE_URL="postgresql://..." node database/fix-schema.js');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function fixSchema() {
  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    const sqlPath = path.join(__dirname, 'fix-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔧 Applying schema fixes...\n');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('SELECT')) {
        // This is a verification query
        const result = await client.query(statement);
        if (result.rows.length > 0) {
          console.log('\n📋', result.rows[0].info || '');
          result.rows.forEach((row) => {
            if (row.table_name) {
              console.log(`   - ${row.table_name}`);
            } else if (row.column_name) {
              console.log(`   - ${row.column_name} (${row.data_type})`);
            }
          });
        }
      } else {
        await client.query(statement);
      }
    }

    console.log('\n✅ Schema fixes applied successfully!\n');

    // Final verification
    console.log('🔍 Final verification...\n');

    const checks = [
      {
        name: 'stories.privacy column',
        query: `SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'stories' AND column_name = 'privacy'`,
      },
      {
        name: 'chat_users table',
        query: `SELECT table_name FROM information_schema.tables 
                WHERE table_name = 'chat_users'`,
      },
      {
        name: 'chats.is_group_chat column',
        query: `SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'chats' AND column_name = 'is_group_chat'`,
      },
      {
        name: 'chat_users.is_admin column',
        query: `SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'chat_users' AND column_name = 'is_admin'`,
      },
      {
        name: 'messages.message_type column',
        query: `SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'messages' AND column_name = 'message_type'`,
      },
      {
        name: 'messages.status column',
        query: `SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'messages' AND column_name = 'status'`,
      },
      {
        name: 'story_viewers table',
        query: `SELECT table_name FROM information_schema.tables 
                WHERE table_name = 'story_viewers'`,
      },
    ];

    let allPassed = true;
    for (const check of checks) {
      const result = await client.query(check.query);
      const passed = result.rows.length > 0;
      allPassed = allPassed && passed;
      console.log(`${passed ? '✅' : '❌'} ${check.name}`);
    }

    if (allPassed) {
      console.log('\n🎉 All schema checks passed!');
      console.log('💡 You can now redeploy your Render backend');
    } else {
      console.log('\n⚠️  Some checks failed. Please review the output above.');
    }
  } catch (error) {
    console.error('\n❌ Schema fix failed:', error.message);
    if (error.position) {
      console.error(`   Position: ${error.position}`);
    }
    console.error('\n📋 Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Connection closed');
  }
}

fixSchema();
