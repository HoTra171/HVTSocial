import sql from 'mssql';
import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

const getPool = async () => {
  const db = await pool;
  if (!db) throw new Error('Database connection failed');
  return db;
};

/**
 * Account Management Service
 * Handles account suspension, deactivation, and deletion
 */

/* ================= ACCOUNT SUSPENSION ================= */

/**
 * Suspend user account
 * @param {number} userId - User to suspend
 * @param {string} reason - Suspension reason
 * @param {Date} until - Suspension end date (null = permanent)
 * @param {number} suspendedBy - Admin/Moderator user ID
 */
export const suspendAccount = async (userId, reason, until = null, suspendedBy = null) => {
  const db = await getPool();

  try {
    await db
      .request()
      .input('userId', sql.Int, userId)
      .input('reason', sql.NVarChar, reason)
      .input('until', sql.DateTime, until)
      .input('suspendedBy', sql.Int, suspendedBy).query(`
        UPDATE users
        SET account_status = 'suspended',
            suspended_at = GETDATE(),
            suspended_until = @until,
            suspension_reason = @reason,
            suspended_by = @suspendedBy,
            updated_at = GETDATE()
        WHERE id = @userId
      `);

    logger.warn({
      message: 'Account suspended',
      userId,
      reason,
      suspendedUntil: until,
      suspendedBy,
    });

    return {
      success: true,
      message: 'Account suspended successfully',
      suspendedUntil: until,
      reason,
    };
  } catch (error) {
    logger.error({
      message: 'Error suspending account',
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Unsuspend user account
 */
export const unsuspendAccount = async (userId, unsuspendedBy = null) => {
  const db = await getPool();

  try {
    await db.request().input('userId', sql.Int, userId).query(`
        UPDATE users
        SET account_status = 'active',
            suspended_at = NULL,
            suspended_until = NULL,
            suspension_reason = NULL,
            suspended_by = NULL,
            updated_at = GETDATE()
        WHERE id = @userId
      `);

    logger.info({
      message: 'Account unsuspended',
      userId,
      unsuspendedBy,
    });

    return {
      success: true,
      message: 'Account unsuspended successfully',
    };
  } catch (error) {
    logger.error({
      message: 'Error unsuspending account',
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Check if account suspension has expired and auto-unsuspend
 */
export const checkSuspensionExpiry = async (userId) => {
  const db = await getPool();

  const result = await db.request().input('userId', sql.Int, userId).query(`
      SELECT account_status, suspended_until
      FROM users
      WHERE id = @userId
    `);

  const user = result.recordset[0];

  if (user?.account_status === 'suspended' && user.suspended_until) {
    const now = new Date();
    const suspendedUntil = new Date(user.suspended_until);

    if (now > suspendedUntil) {
      // Suspension expired, auto-unsuspend
      await unsuspendAccount(userId);
      return { expired: true, unsuspended: true };
    }
  }

  return { expired: false };
};

/**
 * Get suspension details
 */
export const getSuspensionDetails = async (userId) => {
  const db = await getPool();

  const result = await db.request().input('userId', sql.Int, userId).query(`
      SELECT
        u.account_status,
        u.suspended_at,
        u.suspended_until,
        u.suspension_reason,
        u.suspended_by,
        admin.username as suspended_by_username
      FROM users u
      LEFT JOIN users admin ON u.suspended_by = admin.id
      WHERE u.id = @userId
    `);

  return result.recordset[0];
};

/* ================= ACCOUNT DEACTIVATION ================= */

/**
 * Deactivate account (user-initiated, reversible)
 */
export const deactivateAccount = async (userId, reason = null) => {
  const db = await getPool();

  try {
    await db.request().input('userId', sql.Int, userId).input('reason', sql.NVarChar, reason)
      .query(`
        UPDATE users
        SET account_status = 'deactivated',
            suspension_reason = @reason,
            updated_at = GETDATE()
        WHERE id = @userId
      `);

    logger.info({
      message: 'Account deactivated by user',
      userId,
      reason,
    });

    return {
      success: true,
      message: 'Account deactivated successfully',
    };
  } catch (error) {
    logger.error({
      message: 'Error deactivating account',
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Reactivate deactivated account
 */
export const reactivateAccount = async (userId) => {
  const db = await getPool();

  try {
    await db.request().input('userId', sql.Int, userId).query(`
        UPDATE users
        SET account_status = 'active',
            suspension_reason = NULL,
            updated_at = GETDATE()
        WHERE id = @userId AND account_status = 'deactivated'
      `);

    logger.info({
      message: 'Account reactivated',
      userId,
    });

    return {
      success: true,
      message: 'Account reactivated successfully',
    };
  } catch (error) {
    logger.error({
      message: 'Error reactivating account',
      error: error.message,
      userId,
    });
    throw error;
  }
};

/* ================= ACCOUNT DELETION ================= */

/**
 * Soft delete account (mark as deleted, keep data)
 */
export const softDeleteAccount = async (userId, reason = null) => {
  const db = await getPool();

  try {
    await db.request().input('userId', sql.Int, userId).input('reason', sql.NVarChar, reason)
      .query(`
        UPDATE users
        SET account_status = 'deleted',
            suspension_reason = @reason,
            updated_at = GETDATE()
        WHERE id = @userId
      `);

    logger.warn({
      message: 'Account soft deleted',
      userId,
      reason,
    });

    return {
      success: true,
      message: 'Account marked as deleted',
    };
  } catch (error) {
    logger.error({
      message: 'Error soft deleting account',
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Anonymize user data (GDPR compliance)
 * Keep record but remove PII
 */
export const anonymizeAccount = async (userId) => {
  const db = await getPool();

  try {
    const anonymousEmail = `deleted_${userId}@anonymous.com`;
    const anonymousName = `Deleted User ${userId}`;

    await db
      .request()
      .input('userId', sql.Int, userId)
      .input('email', sql.NVarChar, anonymousEmail)
      .input('name', sql.NVarChar, anonymousName).query(`
        UPDATE users
        SET account_status = 'deleted',
            email = @email,
            full_name = @name,
            username = @email,
            password = 'DELETED',
            avatar = NULL,
            background = NULL,
            bio = NULL,
            address = NULL,
            date_of_birth = NULL,
            phone_number = NULL,
            two_factor_secret = NULL,
            two_factor_backup_codes = NULL,
            updated_at = GETDATE()
        WHERE id = @userId
      `);

    // Also delete related sensitive data
    await db.request().input('userId', sql.Int, userId).query(`
        -- Delete messages
        DELETE FROM messages WHERE sender_id = @userId;

        -- Delete notifications
        DELETE FROM notifications WHERE user_id = @userId OR sender_id = @userId;

        -- Delete stories
        DELETE FROM stories WHERE user_id = @userId;

        -- Anonymize posts (keep for data integrity but mark as deleted user)
        UPDATE posts
        SET content = '[Content removed by user]',
            media = NULL
        WHERE user_id = @userId;

        -- Anonymize comments
        UPDATE comments
        SET content = '[Comment removed by user]',
            media = NULL
        WHERE user_id = @userId;
      `);

    logger.warn({
      message: 'Account anonymized (GDPR)',
      userId,
    });

    return {
      success: true,
      message: 'Account anonymized successfully',
    };
  } catch (error) {
    logger.error({
      message: 'Error anonymizing account',
      error: error.message,
      userId,
    });
    throw error;
  }
};

/**
 * Hard delete account (permanent, removes all data)
 * Use with extreme caution!
 */
export const hardDeleteAccount = async (userId) => {
  const db = await getPool();

  try {
    // This will cascade delete most related data
    await db.request().input('userId', sql.Int, userId).query(`
        DELETE FROM users WHERE id = @userId
      `);

    logger.error({
      message: 'Account hard deleted (PERMANENT)',
      userId,
    });

    return {
      success: true,
      message: 'Account permanently deleted',
    };
  } catch (error) {
    logger.error({
      message: 'Error hard deleting account',
      error: error.message,
      userId,
    });
    throw error;
  }
};

/* ================= ACCOUNT STATUS CHECKS ================= */

/**
 * Get account status
 */
export const getAccountStatus = async (userId) => {
  const db = await getPool();

  const result = await db.request().input('userId', sql.Int, userId).query(`
      SELECT
        account_status,
        suspended_at,
        suspended_until,
        suspension_reason,
        email_verified,
        phone_verified,
        two_factor_enabled
      FROM users
      WHERE id = @userId
    `);

  return result.recordset[0];
};

/**
 * Check if account is active
 */
export const isAccountActive = async (userId) => {
  const status = await getAccountStatus(userId);
  return status?.account_status === 'active';
};

/**
 * List all suspended accounts (admin)
 */
export const listSuspendedAccounts = async (limit = 50, offset = 0) => {
  const db = await getPool();

  const result = await db.request().input('limit', sql.Int, limit).input('offset', sql.Int, offset)
    .query(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.suspended_at,
        u.suspended_until,
        u.suspension_reason,
        admin.username as suspended_by_username
      FROM users u
      LEFT JOIN users admin ON u.suspended_by = admin.id
      WHERE u.account_status = 'suspended'
      ORDER BY u.suspended_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

  return result.recordset;
};

export const accountManagementService = {
  suspendAccount,
  unsuspendAccount,
  checkSuspensionExpiry,
  getSuspensionDetails,
  deactivateAccount,
  reactivateAccount,
  softDeleteAccount,
  anonymizeAccount,
  hardDeleteAccount,
  getAccountStatus,
  isAccountActive,
  listSuspendedAccounts,
};
