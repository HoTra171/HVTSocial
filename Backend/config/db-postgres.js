/**
 * PostgreSQL Database Configuration
 * Sử dụng cho Railway, Neon, Supabase deployment
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

/**
 * Sanitize connection string for node-postgres (pg)
 * Strips parameters like channel_binding that cause SCRAM handshake ECONNRESET on node-postgres
 */
export const sanitizeConnectionString = (rawUrl) => {
  if (!rawUrl) return '';
  let url = rawUrl.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  // Remove channel_binding parameter which breaks node-postgres SCRAM negotiation
  url = url.replace(/([?&])channel_binding=[^&]+(&|$)/g, (match, p1, p2) => {
    return p2 === '&' ? p1 : '';
  }).replace(/\?$/, '');
  return url;
};

// PostgreSQL Pool Configuration
const rawUrl = process.env.DATABASE_URL || '';
const connectionString = sanitizeConnectionString(rawUrl);
const isNeon = connectionString.includes('neon.tech');
const requiresSsl = isNeon || process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require');

const poolConfig = {
  connectionString,
  ssl: requiresSsl
    ? {
        rejectUnauthorized: false,
      }
    : false,
  max: 10, // Maximum connections in pool
  min: 0, // Serverless / Neon best practice: don't hold persistent idle connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 15000, // Timeout after 15s to allow cold starts / wakeups
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
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
      // Background idle client errors should not crash the server process
      console.warn('⚠️ PostgreSQL pool idle client error (auto-reconnecting):', err.message);
    });
  }

  return pool;
};

/**
 * Test database connection with retry support for cold starts (Neon scale-to-zero)
 */
export const testConnection = async (maxRetries = 3, delayMs = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const pool = getPool();
      const result = await pool.query('SELECT NOW()');
      console.log('✅ PostgreSQL connection test successful');
      console.log(`>>> Database time: ${result.rows[0].now}`);
      return true;
    } catch (error) {
      console.warn(`⚠️ PostgreSQL connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${delayMs / 1000}s for database compute to be ready before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error('❌ All PostgreSQL connection attempts failed.');
        throw error;
      }
    }
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
  transaction,
};
