import { pool } from '../config/db.js';

async function main() {
  try {
    const db = await pool;
    const cols = await db.request().query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    
    const tables = {};
    for (const row of cols.recordset) {
      if (!tables[row.table_name]) tables[row.table_name] = [];
      tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
    }
    
    console.log('Tables and columns:');
    for (const [table, columns] of Object.entries(tables)) {
      console.log(`\nTable: ${table}`);
      console.log('  ' + columns.join(', '));
    }
    process.exit(0);
  } catch (err) {
    console.error('Error checking schema:', err);
    process.exit(1);
  }
}

main();
