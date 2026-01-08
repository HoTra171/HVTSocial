import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

// Parse DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function viewDatabase() {
  try {
    console.log('🔗 Connecting to Railway PostgreSQL...\n');

    // 1. List all tables
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tables in database:');
    console.log('━'.repeat(50));
    tablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    console.log('');

    // 2. Count rows in each table
    console.log('📈 Row counts:');
    console.log('━'.repeat(50));
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
      console.log(`${tableName.padEnd(30)} ${countResult.rows[0].count} rows`);
    }
    console.log('');

    // 3. Show sample data from main tables
    const mainTables = ['users', 'posts', 'comments', 'refresh_tokens'];

    for (const tableName of mainTables) {
      const exists = tablesResult.rows.find(r => r.table_name === tableName);
      if (!exists) continue;

      console.log(`\n📋 Sample data from "${tableName}":`);
      console.log('━'.repeat(50));

      const sampleResult = await pool.query(`SELECT * FROM ${tableName} LIMIT 5`);

      if (sampleResult.rows.length === 0) {
        console.log('  (empty table)');
      } else {
        console.table(sampleResult.rows);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    console.log('\n✅ Connection closed');
  }
}

viewDatabase();
