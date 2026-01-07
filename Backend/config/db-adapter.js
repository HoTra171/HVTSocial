/**
 * Database Adapter
 * Provides unified interface for both SQL Server and PostgreSQL
 * Automatically converts queries and handles differences
 */

import dotenv from 'dotenv';
dotenv.config();

const usePostgreSQL = !!process.env.DATABASE_URL;

/**
 * Convert SQL Server parameterized query to PostgreSQL format
 * @param {string} query - SQL query with @param style
 * @param {object} inputs - Object with parameter values
 * @returns {object} - { query, values }
 */
function convertQueryToPostgreSQL(query, inputs) {
  if (!inputs || Object.keys(inputs).length === 0) {
    return { query, values: [] };
  }

  let pgQuery = query;
  const values = [];
  let paramIndex = 1;

  // Convert @paramName to $1, $2, etc.
  for (const [key, value] of Object.entries(inputs)) {
    const regex = new RegExp(`@${key}\\b`, 'g');
    pgQuery = pgQuery.replace(regex, `$${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  // Convert SQL Server specific syntax to PostgreSQL
  pgQuery = pgQuery
    .replace(/GETDATE\(\)/gi, 'NOW()')
    .replace(/\bTOP\s+(\d+)\b/gi, '') // Remove TOP, will add LIMIT at end
    .replace(/\bIDENTITY\s*\(\s*\d+\s*,\s*\d+\s*\)/gi, 'SERIAL');

  // Add LIMIT if TOP was found
  const topMatch = query.match(/\bTOP\s+(\d+)\b/i);
  if (topMatch && !pgQuery.includes('LIMIT')) {
    pgQuery += ` LIMIT ${topMatch[1]}`;
  }

  return { query: pgQuery, values };
}

/**
 * Create a request object that mimics SQL Server's request API
 * but works with PostgreSQL
 */
class PostgreSQLRequest {
  constructor(pool) {
    this.pool = pool;
    this.inputs = {};
  }

  input(name, type, value) {
    // In SQL Server: request.input('userId', sql.Int, 123)
    // We only need the value for PostgreSQL
    this.inputs[name] = value;
    return this;
  }

  async query(sqlQuery) {
    const { query: pgQuery, values } = convertQueryToPostgreSQL(sqlQuery, this.inputs);

    console.log('🔍 DB Query Debug:', {
      originalQuery: sqlQuery.substring(0, 50) + '...',
      pgQuery: pgQuery.substring(0, 50) + '...',
      paramValues: values,
      inputs: this.inputs,
    });

    const result = await this.pool.query(pgQuery, values);

    // Mimic SQL Server result structure
    return {
      recordset: result.rows,
      rowsAffected: [result.rowCount],
      recordsets: [result.rows],
    };
  }

  async execute(procedureName) {
    // PostgreSQL doesn't use stored procedures the same way
    // This is a simplified implementation
    throw new Error(
      'Stored procedures not supported in PostgreSQL adapter. Please use query() instead.'
    );
  }
}

/**
 * Get database pool with unified interface
 */
export async function getDatabasePool() {
  if (usePostgreSQL) {
    const dbPostgres = await import('./db-postgres.js');
    const pool = dbPostgres.getPool();

    // Add request() method to PostgreSQL pool
    pool.request = function () {
      return new PostgreSQLRequest(pool);
    };

    return pool;
  } else {
    const { pool } = await import('./db.js');
    return pool;
  }
}

/**
 * Execute a query with automatic conversion
 */
export async function executeQuery(query, inputs = {}) {
  const pool = await getDatabasePool();
  const request = pool.request();

  // Add inputs
  for (const [key, value] of Object.entries(inputs)) {
    request.input(key, null, value);
  }

  return await request.query(query);
}

export default {
  getDatabasePool,
  executeQuery,
};
