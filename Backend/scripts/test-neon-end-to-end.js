import { pool } from '../config/db.js';

async function testNeon() {
  try {
    console.log('--- Testing Neon PostgreSQL Connection & Schema ---');
    
    // 1. Check Tables
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    const tableList = (tables.recordset || tables.rows || []).map((r) => r.table_name);
    console.log(`✅ Tables in Neon DB (${tableList.length}):`, tableList.join(', '));

    // 2. Query Database Details
    const dbInfo = await pool.query(
      'SELECT current_database() as db_name, NOW() as current_time, version() as pg_version'
    );
    const row = (dbInfo.recordset || dbInfo.rows)[0];
    console.log('✅ Current Database Name:', row.db_name);
    console.log('✅ Neon Server Time:', row.current_time);
    console.log('✅ PostgreSQL Version:', row.pg_version);

    // 3. Test Querying Users Table
    const usersCount = await pool.query('SELECT count(*) as count FROM users');
    console.log('✅ Users table row count:', (usersCount.recordset || usersCount.rows)[0].count);

    console.log('\n🎉 ALL NEON POSTGRES END-TO-END TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Neon End-to-End Test Failed:', error);
    process.exit(1);
  }
}

testNeon();
