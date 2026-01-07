import dotenv from "dotenv";
dotenv.config();

/**
 * Smart Database Configuration
 * Auto-detects PostgreSQL (via DATABASE_URL) or SQL Server
 */

// Check if DATABASE_URL exists (PostgreSQL for production)
const usePostgreSQL = !!process.env.DATABASE_URL;

let pool;

if (usePostgreSQL) {
  // Use PostgreSQL (Railway, Neon, Supabase, etc.)
  console.log('🐘 Using PostgreSQL database');
  
  // Import PostgreSQL pool and test connection
  const dbPostgres = await import('./db-postgres.js');
  pool = dbPostgres.getPool();
  
  // Test connection immediately
  try {
    await dbPostgres.testConnection();
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL');
    console.error('Check:');
    console.error('  - DATABASE_URL is correct');
    console.error('  - Railway/Render database is online');
    console.error('  - Network connectivity');
    process.exit(1);
  }
  
} else {
  // Use SQL Server (local development)
  console.log('🗄️  Using SQL Server database');
  
  const sql = (await import('mssql')).default;
  
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

  // Tạo pool và kết nối
  const poolConnection = new sql.ConnectionPool(config);

  await poolConnection.connect()
    .then(() => {
      console.log("✅ Connected to SQL Server");
      console.log(">>> Using Database:", poolConnection.config.database);
    })
    .catch((err) => {
      console.error("❌ SQL Server connection FAILED:", err.message);
      console.error("Please check:");
      console.error("  - SQL Server is running (check services: SQL Server (MSSQLSERVER))");
      console.error("  - Database exists:", config.database);
      console.error("  - Credentials - User:", config.user);
      console.error("  - Server:", config.server);
      console.error("  - Port:", config.port);
      process.exit(1);
    });

  pool = poolConnection;
}

// Export pool (works for both PostgreSQL and SQL Server)
export { pool };
export const getPool = () => pool;

// Add unified request() method for both databases
if (usePostgreSQL) {
  // PostgreSQL: Add request() method that converts to PostgreSQL syntax
  pool.request = function() {
    const inputs = {};
    
    return {
      input(name, type, value) {
        inputs[name] = value;
        return this;
      },
      
      async query(sqlQuery) {
        // Convert @param to $1, $2, etc.
        let pgQuery = sqlQuery;
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(inputs)) {
          const regex = new RegExp(`@${key}\\b`, 'g');
          pgQuery = pgQuery.replace(regex, `$${paramIndex}`);
          values.push(value);
          paramIndex++;
        }

        // Convert SQL Server syntax to PostgreSQL
        pgQuery = pgQuery
          .replace(/GETDATE\(\)/gi, 'NOW()')
          .replace(/\[dbo\]\./gi, '')
          .replace(/\[(\w+)\]/g, '$1');

        // Handle TOP clause
        const topMatch = sqlQuery.match(/SELECT\s+TOP\s+(\d+)/i);
        if (topMatch) {
          pgQuery = pgQuery.replace(/SELECT\s+TOP\s+\d+/i, 'SELECT');
          if (!pgQuery.includes('LIMIT')) {
            pgQuery += ` LIMIT ${topMatch[1]}`;
          }
        }

        // Convert OUTER APPLY to LEFT JOIN LATERAL (SQL Server -> PostgreSQL)
        // Pattern: OUTER APPLY (subquery) alias
        pgQuery = pgQuery.replace(/OUTER\s+APPLY\s*\(/gi, 'LEFT JOIN LATERAL (');
        
        // Convert CROSS APPLY to INNER JOIN LATERAL
        pgQuery = pgQuery.replace(/CROSS\s+APPLY\s*\(/gi, 'INNER JOIN LATERAL (');

        const result = await pool.query(pgQuery, values);
        
        // Return SQL Server compatible result structure
        return {
          recordset: result.rows,
          rowsAffected: [result.rowCount],
          recordsets: [result.rows]
        };
      }
    };
  };
}
