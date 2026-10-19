/**
 * Unified Database Configuration (Backward Compatibility Layer)
 * Re-exports unified database instance from ./db.js
 */
import { pool, db, getPool, query } from './db.js';

export { pool, db, getPool, query };
export default db;
