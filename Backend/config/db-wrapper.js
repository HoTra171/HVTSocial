/**
 * Universal Database Wrapper
 * Provides a unified API for both SQL Server and PostgreSQL
 * Automatically detects which database is being used based on environment
 */

import dotenv from 'dotenv';
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
        rowsAffected: result.rowCount ? [result.rowCount] : [0],
      };
    },

    /**
     * Create a request builder (SQL Server compatible API)
     */
    request() {
      const inputs = {};
      const queryBuilder = {
        input(name, type, value) {
          // Support both 2-param and 3-param syntax
          // .input(name, value) - PostgreSQL style (2 params)
          // .input(name, type, value) - SQL Server style (3 params)
          if (arguments.length === 2) {
            // 2 params: name, value
            inputs[name] = type; // type is actually the value
          } else {
            // 3 params: name, type, value
            inputs[name] = value;
          }
          return this;
        },
        async query(sqlQuery) {
          // Convert SQL Server style @param to PostgreSQL $1, $2...
          // IMPORTANT: Must preserve order of parameters as they appear in query
          let pgQuery = sqlQuery;
          const paramValues = [];
          const paramMap = new Map();

          // Find all @param in query IN ORDER
          const paramMatches = sqlQuery.match(/@\w+/g) || [];
          const seenParams = new Set();

          paramMatches.forEach((match) => {
            const paramName = match.substring(1); // Remove @
            if (!seenParams.has(paramName)) {
              seenParams.add(paramName);
              const index = paramValues.length + 1;
              paramMap.set(paramName, index);
              paramValues.push(inputs[paramName]);
            }
          });

          // Replace all @param with $1, $2, etc.
          paramMap.forEach((index, name) => {
            const regex = new RegExp(`@${name}\\b`, 'g');
            pgQuery = pgQuery.replace(regex, `$${index}`);
          });

          // Debug logging (disabled in production)
          if (process.env.DEBUG_SQL === 'true') {
            console.log('🔍 DB Query Debug:', {
              originalQuery: sqlQuery.substring(0, 150) + (sqlQuery.length > 150 ? '...' : ''),
              pgQuery: pgQuery.substring(0, 150) + (pgQuery.length > 150 ? '...' : ''),
              paramValues: paramValues,
              inputs: inputs,
            });
          }

          const result = await pool.query(pgQuery, paramValues);
          return {
            recordset: result.rows,
            rowsAffected: result.rowCount ? [result.rowCount] : [0],
          };
        },
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
              // Support both 2-param and 3-param syntax
              if (arguments.length === 2) {
                inputs[name] = type; // type is actually the value
              } else {
                inputs[name] = value;
              }
              return this;
            },
            async query(sqlQuery) {
              // Convert SQL Server style @param to PostgreSQL $1, $2...
              // IMPORTANT: Must preserve order of parameters as they appear in query
              let pgQuery = sqlQuery;
              const paramValues = [];
              const paramMap = new Map();

              // Find all @param in query IN ORDER
              const paramMatches = sqlQuery.match(/@\w+/g) || [];
              const seenParams = new Set();

              paramMatches.forEach((match) => {
                const paramName = match.substring(1); // Remove @
                if (!seenParams.has(paramName)) {
                  seenParams.add(paramName);
                  const index = paramValues.length + 1;
                  paramMap.set(paramName, index);
                  paramValues.push(inputs[paramName]);
                }
              });

              // Replace all @param with $1, $2, etc.
              paramMap.forEach((index, name) => {
                const regex = new RegExp(`@${name}\\b`, 'g');
                pgQuery = pgQuery.replace(regex, `$${index}`);
              });

              const result = await client.query(pgQuery, paramValues);
              return {
                recordset: result.rows,
                rowsAffected: result.rowCount ? [result.rowCount] : [0],
              };
            },
          };
        },
        async commit() {
          await client.query('COMMIT');
          client.release();
        },
        async rollback() {
          await client.query('ROLLBACK');
          client.release();
        },
      };
    },
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
    },
  };
}

export const db = dbAdapter;
export const usesPg = usePostgreSQL;

// For backward compatibility
export const getDb = () => dbAdapter;
