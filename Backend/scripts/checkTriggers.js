import { pool } from '../config/db.js';

async function main() {
  const db = await pool;
  const res = await db.request().query(`
    SELECT 
      t.name AS trigger_name,
      OBJECT_NAME(t.parent_id) AS table_name,
      t.is_disabled
    FROM sys.triggers t
  `);
  console.log('Triggers found:', res.recordset);
  process.exit(0);
}

main();
