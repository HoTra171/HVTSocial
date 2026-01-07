/**
 * SQL Server Database Configuration
 * Native SQL Server syntax
 */
import sql from 'mssql';

const config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  port: parseInt(process.env.SQL_PORT) || 1433,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: process.env.SQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.SQL_TRUST_CERT === 'true',
    useUTC: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

// Create connection pool
const pool = new sql.ConnectionPool(config);

await pool
  .connect()
  .then(() => {
    console.log('✅ Connected to SQL Server');
    console.log('>>> Using Database:', pool.config.database);
  })
  .catch((err) => {
    console.error('❌ SQL Server connection FAILED:', err.message);
    console.error('Please check:');
    console.error('  - SQL Server is running');
    console.error('  - Database exists:', config.database);
    console.error('  - Credentials - User:', config.user);
    console.error('  - Server:', config.server);
    process.exit(1);
  });

/**
 * Unified query interface
 * @param {string} sqlQuery - SQL query (SQL Server syntax)
 * @param {object} params - Parameters object {param1: value1, ...}
 */
async function query(sqlQuery, params = {}) {
  try {
    const request = pool.request();

    // Add parameters
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    const result = await request.query(sqlQuery);
    return {
      rows: result.recordset,
      rowCount: result.rowsAffected[0],
      recordset: result.recordset,
      rowsAffected: result.rowsAffected,
    };
  } catch (error) {
    console.error('SQL Server query error:', error.message);
    console.error('SQL:', sqlQuery.substring(0, 200));
    throw error;
  }
}

/**
 * Get pool instance (for backward compatibility with pool.request())
 */
function getPool() {
  return pool;
}

export default {
  pool,
  query,
  getPool,
  dialect: 'sqlserver',
};
