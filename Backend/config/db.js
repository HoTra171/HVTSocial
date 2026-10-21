import dotenv from 'dotenv';
dotenv.config();

/**
 * Smart Database Configuration
 * Auto-detects PostgreSQL (via DATABASE_URL) or SQL Server
 */

// Check DB_DRIVER or fallback to DATABASE_URL detection
const dbDriver = process.env.DB_DRIVER || (process.env.DATABASE_URL ? 'postgres' : 'mssql');
const usePostgreSQL = dbDriver === 'postgres';

console.log(`🔧 DB Configuration: Driver=${dbDriver}`);

let pool;

if (usePostgreSQL) {
  // Use PostgreSQL (Railway, Neon, Supabase, etc.)
  console.log('Using PostgreSQL database');

  // Import PostgreSQL pool and test connection
  const dbPostgres = await import('./db-postgres.js');
  pool = dbPostgres.getPool();

  // Test connection immediately
  try {
    await dbPostgres.testConnection();
  } catch (error) {
    console.error('âŒ Failed to connect to PostgreSQL');
    console.error('Check:');
    console.error('  - DATABASE_URL is correct');
    console.error('  - Railway/Render database is online');
    console.error('  - Network connectivity');
    process.exit(1);
  }
} else {
  // Use SQL Server (local development)
  console.log('ðŸ—„ï¸  Using SQL Server database');

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

  // Táº¡o pool vÃ  káº¿t ná»‘i
  const poolConnection = new sql.ConnectionPool(config);

  await poolConnection
    .connect()
    .then(() => {
      console.log('Connected to SQL Server');
      console.log('>>> Using Database:', poolConnection.config.database);
    })
    .catch((err) => {
      console.error('SQL Server connection FAILED:', err.message);
      console.error('Please check:');
      console.error('  - SQL Server is running (check services: SQL Server (MSSQLSERVER))');
      console.error('  - Database exists:', config.database);
      console.error('  - Credentials - User:', config.user);
      console.error('  - Server:', config.server);
      console.error('  - Port:', config.port);
      process.exit(1);
    });

  pool = poolConnection;
}

// Ensure PostgreSQL query returns compatible recordset and rowsAffected
if (usePostgreSQL && pool && pool.query) {
  const origQuery = pool.query.bind(pool);
  pool.query = async function (text, params) {
    let sanitizedText = text;
    if (typeof sanitizedText === 'string') {
      sanitizedText = sanitizedText
        .replace(/\b(\w+\.)?(is_\w+|has_\w+)\s*=\s*0\b/gi, '$1$2 = false')
        .replace(/\b(\w+\.)?(is_\w+|has_\w+)\s*=\s*1\b/gi, '$1$2 = true');
    }
    const res = await origQuery(sanitizedText, params);
    if (res && res.rows && !res.recordset) {
      res.recordset = res.rows;
      res.rowsAffected = [res.rowCount || 0];
      res.recordsets = [res.rows];
    }
    return res;
  };
}

// Ensure SQL Server request handles RETURNING clause automatically if written in query
if (!usePostgreSQL) {
  const sqlModule = (await import('mssql')).default;
  const sanitizeMSSQL = (command) => {
    if (typeof command !== 'string') return command;
    let sqlCmd = command;
    // Replace NOW() with GETDATE()
    sqlCmd = sqlCmd.replace(/\bNOW\(\)/gi, 'GETDATE()');

    // Automatically convert LIMIT @limit OFFSET @offset to MSSQL OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    sqlCmd = sqlCmd.replace(/LIMIT\s+@(\w+)\s+OFFSET\s+@(\w+)/gi, 'OFFSET @$2 ROWS FETCH NEXT @$1 ROWS ONLY');
    sqlCmd = sqlCmd.replace(/OFFSET\s+@(\w+)\s+LIMIT\s+@(\w+)/gi, 'OFFSET @$1 ROWS FETCH NEXT @$2 ROWS ONLY');

    // Convert boolean false/true to 0/1 for MSSQL BIT columns
    sqlCmd = sqlCmd
      .replace(/\b(\w+\.)?(is_\w+|has_\w+)\s*=\s*false\b/gi, '$1$2 = 0')
      .replace(/\b(\w+\.)?(is_\w+|has_\w+)\s*=\s*true\b/gi, '$1$2 = 1');

    if (/RETURNING\s+/i.test(sqlCmd) && !/OUTPUT\s+INSERTED/i.test(sqlCmd)) {
      if (/INSERT\s+INTO\s+[^\(]+\s*\([^\)]+\)\s*VALUES/i.test(sqlCmd)) {
        sqlCmd = sqlCmd
          .replace(/(INSERT\s+INTO\s+[^\(]+\s*\([^\)]+\))\s*VALUES/i, '$1 OUTPUT INSERTED.* VALUES')
          .replace(/RETURNING\s+[^;]+/gi, '');
      } else if (/UPDATE\s+.+WHERE\s+.+RETURNING/is.test(sqlCmd)) {
        sqlCmd = sqlCmd.replace(
          /(UPDATE\s+.+SET\s+[^W]+)\s+WHERE\s+(.+)\s+RETURNING\s+[^;]+/is,
          '$1 OUTPUT INSERTED.* WHERE $2'
        );
      }
    }
    return sqlCmd;
  };

  if (sqlModule && sqlModule.Request && sqlModule.Request.prototype) {
    const origSqlReqQuery = sqlModule.Request.prototype.query;
    sqlModule.Request.prototype.query = function (command, ...args) {
      return origSqlReqQuery.call(this, sanitizeMSSQL(command), ...args);
    };
  }

  if (pool && pool.request) {
    const origRequest = pool.request.bind(pool);
    pool.request = function () {
      const req = origRequest();
      const origQuery = req.query.bind(req);
      req.query = async function (command) {
        return origQuery(sanitizeMSSQL(command));
      };
      return req;
    };
  }

  if (pool && pool.query) {
    const origPoolQuery = pool.query.bind(pool);
    pool.query = async function (command, ...args) {
      return origPoolQuery(sanitizeMSSQL(command), ...args);
    };
  }
}

// Export unified pool and db instances
const db = pool;
export { pool, db };
export const getPool = () => pool;
export const query = (...args) => pool.query(...args);
export default pool;

// Add unified request() method for both databases
if (usePostgreSQL) {
  // PostgreSQL: Add request() method that converts to PostgreSQL syntax
  pool.request = function () {
    const inputs = {};

    return {
      input(name, type, value) {
        if (value === undefined) {
          inputs[name] = type;
        } else {
          inputs[name] = value;
        }
        return this;
      },

      async query(sqlQuery) {
        // Convert @param to $1, $2, etc.
        let pgQuery = sqlQuery;
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(inputs)) {
          const regex = new RegExp(`@${key}\\b`, 'g');
          if (pgQuery.match(regex)) {
            pgQuery = pgQuery.replace(regex, `$${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }

        // Convert SQL Server syntax to PostgreSQL
        pgQuery = pgQuery
          .replace(/GETDATE\(\)/gi, 'NOW()')
          .replace(/\[dbo\]\./gi, '')
          .replace(/\[(\w+)\]/g, '$1')
          .replace(/ISNULL\(/gi, 'COALESCE(') // SQL Server ISNULL -> PostgreSQL COALESCE
          .replace(
            /DATEADD\(HOUR,\s*(-?\d+),\s*GETDATE\(\)\)/gi,
            (match, hours) => `NOW() + INTERVAL '${hours} hours'`
          ) // DATEADD(HOUR, n, GETDATE())
          .replace(/DATEADD\(HOUR,\s*\$\d+,\s*NOW\(\)\)/gi, (match) => {
            // DATEADD(HOUR, $1, NOW()) - keep parameter
            const paramMatch = match.match(/\$(\d+)/);
            return `NOW() + ($${paramMatch[1]} || ' hours')::INTERVAL`;
          })
          .replace(
            /DATEADD\(DAY,\s*(-?\d+),\s*GETDATE\(\)\)/gi,
            (match, days) => `NOW() + INTERVAL '${days} days'`
          ) // DATEADD(DAY, -30, GETDATE())
          .replace(
            /DATEADD\(DAY,\s*(-?\d+),\s*NOW\(\)\)/gi,
            (match, days) => `NOW() + INTERVAL '${days} days'`
          ) // After GETDATE conversion
          .replace(
            /OFFSET\s+\$(\d+)\s+ROWS\s+FETCH\s+NEXT\s+\$(\d+)\s+ROWS\s+ONLY/gi,
            'OFFSET $$$1 LIMIT $$$2'
          ) // OFFSET/FETCH NEXT -> OFFSET/LIMIT
          .replace(/\b(\w+\.)?(is_\w+|has_\w+)\s*=\s*0\b/gi, '$1$2 = false')
          .replace(/\b(\w+\.)?(is_\w+|has_\w+)\s*=\s*1\b/gi, '$1$2 = true');

        // Handle OUTPUT clause (SQL Server) -> RETURNING clause (PostgreSQL)
        // 1. Remove OUTPUT INSERTED.* / OUTPUT DELETED.* from the middle
        if (pgQuery.match(/OUTPUT\s+(INSERTED|DELETED)\.\*/i)) {
          pgQuery = pgQuery.replace(/OUTPUT\s+(INSERTED|DELETED)\.\*/gi, '');

          // 2. Add RETURNING * at the end
          if (pgQuery.trim().endsWith(';')) {
            pgQuery = pgQuery.replace(/;\s*$/, ' RETURNING *;');
          } else {
            pgQuery += ' RETURNING *';
          }
        }

        // Handle TOP clause with parameter: SELECT TOP ($1) -> SELECT ... LIMIT $1
        const topMatch = pgQuery.match(/SELECT\s+TOP\s*\(\$(\d+)\)/i);
        if (topMatch) {
          pgQuery = pgQuery.replace(topMatch[0], 'SELECT');
          if (!pgQuery.includes('LIMIT')) {
            if (pgQuery.trim().endsWith(';')) {
              pgQuery = pgQuery.replace(/;\s*$/, ` LIMIT $${topMatch[1]};`);
            } else {
              pgQuery += ` LIMIT $${topMatch[1]}`;
            }
          }
        }

        // Handle TOP clause in subqueries: SELECT TOP (n) ... ORDER BY -> SELECT ... ORDER BY LIMIT n
        pgQuery = pgQuery.replace(
          /SELECT\s+TOP\s*\((\d+)\)([^]*?)(ORDER BY[^)]+)/gi,
          (match, limit, middle, orderBy) => {
            return `SELECT${middle}${orderBy} LIMIT ${limit}`;
          }
        );

        // Handle main query TOP clause
        const mainTopMatch = sqlQuery.match(/^SELECT\s+TOP\s*\((\d+)\)/i);
        if (mainTopMatch && pgQuery.includes('SELECT TOP')) {
          pgQuery = pgQuery.replace(/^SELECT\s+TOP\s*\(\d+\)/i, 'SELECT');
          if (!pgQuery.includes('LIMIT')) {
            if (pgQuery.trim().endsWith(';')) {
              pgQuery = pgQuery.replace(/;\s*$/, ` LIMIT ${mainTopMatch[1]};`);
            } else {
              pgQuery += ` LIMIT ${mainTopMatch[1]}`;
            }
          }
        }

        // Convert OUTER APPLY to LEFT JOIN LATERAL (SQL Server -> PostgreSQL)
        // Pattern: OUTER APPLY (subquery) alias
        pgQuery = pgQuery.replace(/OUTER\s+APPLY\s*\(/gi, 'LEFT JOIN LATERAL (');

        // Convert CROSS APPLY to INNER JOIN LATERAL
        pgQuery = pgQuery.replace(/CROSS\s+APPLY\s*\(/gi, 'INNER JOIN LATERAL (');

        // Add ON true after LATERAL JOIN subquery aliases
        pgQuery = pgQuery.replace(/\) (lmDetail|uc|other)(?!\s+ON)/gi, ') $1 ON true');

        // Debug: Log converted query (uncomment for debugging)
        // console.log('🔍 DB Query Debug:', {
        //   originalQuery: sqlQuery.substring(0, 100) + '...',
        //   pgQuery: pgQuery.substring(0, 100) + '...',
        //   paramValues: values,
        //   inputs: inputs
        // });

        const result = await pool.query(pgQuery, values);

        // Return SQL Server compatible result structure
        return {
          recordset: result.rows,
          rowsAffected: [result.rowCount],
          recordsets: [result.rows],
        };
      },
    };
  };
}
