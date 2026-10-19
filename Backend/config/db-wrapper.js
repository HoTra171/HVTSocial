/**
 * Universal Database Wrapper (Backward Compatibility Layer)
 * Re-exports unified database instance from ./db.js
 */
import { pool, db, getPool, query } from './db.js';

export const usesPg = process.env.DB_DRIVER === 'postgres' || !!process.env.DATABASE_URL;
export const getDb = () => db;
export { pool, db, getPool, query };
export default db;
