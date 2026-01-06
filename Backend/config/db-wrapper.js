/**
 * Universal Database Wrapper
 * Provides a unified API for both SQL Server and PostgreSQL
 * Automatically detects which database is being used based on environment
 */

import dotenv from "dotenv";
dotenv.config();

const usePostgreSQL = !!process.env.DATABASE_URL;

let dbAdapter;

if (usePostgreSQL) {
  // PostgreSQL adapter
  const { getPool } = await import('./db-postgres.js');
  const pool = getPool();

  dbAdapter = {
    /**
     * Execute a parameterized query
     * @param {string} query - SQL query with $1, $2... placeholders for PostgreSQL
     * @param {Array} params - Array of parameter values
     */
    async query(query, params = []) {
      const result = await pool.query(query, params);
      return {
        recordset: result.rows,
        rowsAffected: result.rowCount ? [result.rowCount] : [0]
      };
    },

    /**
     * Create a request builder (SQL Server compatible API)
     */
    request() {
      const inputs = {};
      const queryBuilder = {
        input(name, type, value) {
          inputs[name] = value;
          return this;
        },
        async query(sqlQuery) {
          // Convert SQL Server style @param to PostgreSQL $1, $2...
          let pgQuery = sqlQuery;
          const paramNames = Object.keys(inputs);
          const paramValues = [];

          paramNames.forEach((name, index) => {
            const regex = new RegExp(`@${name}\\b`, 'g');
            pgQuery = pgQuery.replace(regex, `$${index + 1}`);
            paramValues.push(inputs[name]);
          });

          // Convert GETDATE() to CURRENT_TIMESTAMP (already handled by user)
          // Note: RETURNING is already PostgreSQL syntax, no conversion needed

          const result = await pool.query(pgQuery, paramValues);
          return {
            recordset: result.rows,
            rowsAffected: result.rowCount ? [result.rowCount] : [0]
          };
        }
      };
      return queryBuilder;
    },

    /**
     * Begin a transaction
     */
    async transaction() {
      const client = await pool.connect();
      await client.query('BEGIN');

      return {
        request() {
          const inputs = {};
          return {
            input(name, type, value) {
              inputs[name] = value;
              return this;
            },
            async query(sqlQuery) {
              // Convert SQL Server style @param to PostgreSQL $1, $2...
              let pgQuery = sqlQuery;
              const paramNames = Object.keys(inputs);
              const paramValues = [];

              paramNames.forEach((name, index) => {
                const regex = new RegExp(`@${name}\\b`, 'g');
                pgQuery = pgQuery.replace(regex, `$${index + 1}`);
                paramValues.push(inputs[name]);
              });

              const result = await client.query(pgQuery, paramValues);
              return {
                recordset: result.rows,
                rowsAffected: result.rowCount ? [result.rowCount] : [0]
              };
            }
          };
        },
        async commit() {
          await client.query('COMMIT');
          client.release();
        },
        async rollback() {
          await client.query('ROLLBACK');
          client.release();
        }
      };
    }
  };

} else {
  // SQL Server adapter - use as is
  const sql = (await import('mssql')).default;
  const { pool } = await import('./db.js');

  dbAdapter = {
    async query(query, params = []) {
      const request = pool.request();
      params.forEach((value, index) => {
        request.input(`param${index}`, value);
      });
      return await request.query(query);
    },

    request() {
      return pool.request();
    },

    async transaction() {
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      return transaction;
    }
  };
}

export const db = dbAdapter;
export const usesPg = usePostgreSQL;

// For backward compatibility
export const getDb = () => dbAdapter;
