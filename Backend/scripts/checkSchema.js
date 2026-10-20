import { pool } from '../config/db.js';

async function main() {
  try {
    const db = await pool;
    const cols = await db.request().query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);
    
    const tables = {};
    for (const row of cols.recordset) {
      if (!tables[row.TABLE_NAME]) tables[row.TABLE_NAME] = [];
      tables[row.TABLE_NAME].push(`${row.COLUMN_NAME} (${row.DATA_TYPE})`);
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
