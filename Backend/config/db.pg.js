/**
 * PostgreSQL Database Configuration
 * Native PostgreSQL syntax - no conversion needed
 */
import pg from 'pg';
const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connection established');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

// Test initial connection
try {
  const client = await pool.connect();
  const result = await client.query('SELECT NOW() as time');
  console.log('>>> Database time:', result.rows[0].time);
  client.release();
} catch (error) {
  console.error('❌ Failed to connect to PostgreSQL');
  console.error('Check:');
  console.error('  - DATABASE_URL is correct');
  console.error('  - Database is online');
  console.error('  - Network connectivity');
  console.error('Error:', error.message);
  process.exit(1);
}

/**
 * Unified query interface
 * @param {string} sql - SQL query (PostgreSQL syntax)
 * @param {array} params - Parameters array [$1, $2, ...]
 */
async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      recordset: result.rows, // SQL Server compatibility
      rowsAffected: [result.rowCount], // SQL Server compatibility
    };
  } catch (error) {
    console.error('PostgreSQL query error:', error.message);
    console.error('SQL:', sql.substring(0, 200));
    throw error;
  }
}

/**
 * Get pool instance
 */
function getPool() {
  return pool;
}

export default {
  pool,
  query,
  getPool,
  dialect: 'postgres',
};
