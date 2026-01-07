import dotenv from "dotenv";
dotenv.config();

/**
 * Unified Database Configuration
 * Switch between SQL Server and PostgreSQL based on DB_PROVIDER env variable
 * 
 * Usage:
 *   DB_PROVIDER=postgres → Use PostgreSQL (production)
 *   DB_PROVIDER=sqlserver → Use SQL Server (local dev)
 *   
 * Auto-detect: If DATABASE_URL exists → PostgreSQL, else → SQL Server
 */

const dbProvider = process.env.DB_PROVIDER || (process.env.DATABASE_URL ? 'postgres' : 'sqlserver');

let db;

if (dbProvider === 'postgres') {
  console.log('🐘 Using PostgreSQL database');
  const pgModule = await import('./db.pg.js');
  db = pgModule.default;
} else {
  console.log('🗄️  Using SQL Server database');
  const mssqlModule = await import('./db.mssql.js');
  db = mssqlModule.default;
}

// Export unified interface
export default db;
export const query = db.query;
export const getPool = db.getPool;
export const pool = db.pool;
