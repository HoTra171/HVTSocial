/**
 * PostgreSQL Database Configuration
 * Sử dụng cho Railway, Neon, Supabase deployment
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL Pool Configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Required for Railway/Render
  } : false,
  max: 20, // Maximum connections in pool
  min: 2,  // Minimum connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Timeout after 10s
};

let pool = null;

/**
 * Get PostgreSQL connection pool
 */
export const getPool = () => {
  if (!pool) {
    pool = new Pool(poolConfig);

    pool.on('connect', () => {
      console.log('✅ PostgreSQL connection established');
    });

    pool.on('error', (err) => {
      console.error('❌ PostgreSQL pool error:', err);
    });
  }

  return pool;
};

/**
 * Test database connection
 */
export const testConnection = async () => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection test successful');
    console.log(`>>> Database time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
};

/**
 * Close all connections
 */
export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 PostgreSQL pool closed');
  }
};

/**
 * Execute query with automatic reconnection
 */
export const query = async (text, params) => {
  const pool = getPool();
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

/**
 * Transaction helper
 */
export const transaction = async (callback) => {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  getPool,
  testConnection,
  closePool,
  query,
  transaction
};
