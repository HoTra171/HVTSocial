import sql from 'mssql';
import { pool } from '../config/db.js';
import logger from '../config/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getPool = async () => {
  const db = await pool;
  if (!db) throw new Error('Database connection failed');
  return db;
};

/**
 * GDPR Compliance Service
 * Handles data export, deletion requests, and privacy compliance
 */

/* ================= DATA EXPORT (Right to Data Portability) ================= */

/**
 * Request data export for user
 */
export const requestDataExport = async (userId) => {
  const db = await getPool();

  try {
    // Check if there's already a pending request
    const existingRequest = await db.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT *
        FROM data_export_requests
        WHERE user_id = @userId
          AND status IN ('pending', 'processing')
          AND requested_at > DATEADD(hour, -24, GETDATE())
      `);

    if (existingRequest.recordset.length > 0) {
      return {
        success: false,
        message: 'A data export request is already in progress',
        requestId: existingRequest.recordset[0].id
      };
    }

    // Create new export request
    const result = await db.request()
      .input('userId', sql.Int, userId)
      .query(`
        INSERT INTO data_export_requests (user_id, status)
        OUTPUT INSERTED.*
        VALUES (@userId, 'pending')
      `);

    const request = result.recordset[0];

    logger.info({
      message: 'Data export requested',
      userId,
      requestId: request.id
    });

    // TODO: Trigger background job to process export
    // For now, process immediately (in production, use Bull queue)
    await processDataExport(request.id);

    return {
      success: true,
      message: 'Data export request created',
      requestId: request.id
    };
  } catch (error) {
    logger.error({
      message: 'Error requesting data export',
      error: error.message,
      userId
    });
    throw error;
  }
};

/**
 * Process data export (collect all user data)
 */
export const processDataExport = async (requestId) => {
  const db = await getPool();

  try {
    // Update status to processing
    await db.request()
      .input('requestId', sql.Int, requestId)
      .query(`
        UPDATE data_export_requests
        SET status = 'processing'
        WHERE id = @requestId
      `);

    // Get request details
    const requestResult = await db.request()
      .input('requestId', sql.Int, requestId)
      .query(`
        SELECT * FROM data_export_requests WHERE id = @requestId
      `);

    const request = requestResult.recordset[0];
    const userId = request.user_id;

    // Collect all user data
    const userData = await collectUserData(userId);

    // Save to JSON file
    const exportDir = path.join(__dirname, '../exports');
    await fs.mkdir(exportDir, { recursive: true });

    const filename = `user_${userId}_export_${Date.now()}.json`;
    const filepath = path.join(exportDir, filename);

    await fs.writeFile(filepath, JSON.stringify(userData, null, 2));

    // Update request with file info
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.request()
      .input('requestId', sql.Int, requestId)
      .input('fileUrl', sql.NVarChar, `/exports/${filename}`)
      .input('expiresAt', sql.DateTime, expiresAt)
      .query(`
        UPDATE data_export_requests
        SET status = 'completed',
            file_url = @fileUrl,
            file_expires_at = @expiresAt,
            completed_at = GETDATE()
        WHERE id = @requestId
      `);

    logger.info({
      message: 'Data export completed',
      userId,
      requestId,
      filename
    });

    return {
      success: true,
      fileUrl: `/exports/${filename}`,
      expiresAt
    };
  } catch (error) {
    // Mark as failed
    await db.request()
      .input('requestId', sql.Int, requestId)
      .input('errorMessage', sql.NVarChar, error.message)
      .query(`
        UPDATE data_export_requests
        SET status = 'failed',
            error_message = @errorMessage
        WHERE id = @requestId
      `);

    logger.error({
      message: 'Data export failed',
      error: error.message,
      requestId
    });

    throw error;
  }
};

/**
 * Collect all user data from database
 */
async function collectUserData(userId) {
  const db = await getPool();

  // User profile
  const profileResult = await db.request()
    .input('userId', sql.Int, userId)
    .query(`SELECT * FROM users WHERE id = @userId`);
  const profile = profileResult.recordset[0];

  // Remove sensitive fields
  delete profile.password;
  delete profile.two_factor_secret;
  delete profile.reset_otp;

  // Posts
  const postsResult = await db.request()
    .input('userId', sql.Int, userId)
    .query(`SELECT * FROM posts WHERE user_id = @userId ORDER BY created_at DESC`);

  // Comments
  const commentsResult = await db.request()
    .input('userId', sql.Int, userId)
    .query(`SELECT * FROM comments WHERE user_id = @userId ORDER BY created_at DESC`);

  // Likes
  const likesResult = await db.request()
    .input('userId', sql.Int, userId)
    .query(`SELECT * FROM likes WHERE user_id = @userId ORDER BY created_at DESC`);

  // Messages
  const messagesResult = await db.request()
    .input('userId', sql.Int, userId)
    .query(`SELECT * FROM messages WHERE sender_id = @userId ORDER BY created_at DESC`);

  // Friendships
  const friendshipsResult = await db.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT * FROM friendships
      WHERE user_id = @userId OR friend_id = @userId
      ORDER BY created_at DESC
    `);

  // Stories
  const storiesResult = await db.request()
    .input('userId', sql.Int, userId)
    .query(`SELECT * FROM stories WHERE user_id = @userId ORDER BY created_at DESC`);

  // Notifications
  const notificationsResult = await db.request()
    .input('userId', sql.Int, userId)
    .query(`SELECT * FROM notifications WHERE user_id = @userId ORDER BY created_at DESC`);

  // Saved posts
  const savedPostsResult = await db.request()
    .input('userId', sql.Int, userId)
    .query(`SELECT * FROM saved_posts WHERE user_id = @userId ORDER BY created_at DESC`);

  return {
    exportedAt: new Date().toISOString(),
    profile,
    posts: postsResult.recordset,
    comments: commentsResult.recordset,
    likes: likesResult.recordset,
    messages: messagesResult.recordset,
    friendships: friendshipsResult.recordset,
    stories: storiesResult.recordset,
    notifications: notificationsResult.recordset,
    savedPosts: savedPostsResult.recordset
  };
}

/**
 * Get export request status
 */
export const getExportStatus = async (userId) => {
  const db = await getPool();

  const result = await db.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        id, status, file_url, file_expires_at,
        requested_at, completed_at, error_message
      FROM data_export_requests
      WHERE user_id = @userId
      ORDER BY requested_at DESC
    `);

  return result.recordset;
};

/* ================= DATA DELETION (Right to be Forgotten) ================= */

/**
 * Request account deletion
 */
export const requestDataDeletion = async (userId, reason = null) => {
  const db = await getPool();

  try {
    // Check for existing pending request
    const existingRequest = await db.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT *
        FROM data_deletion_requests
        WHERE user_id = @userId
          AND status IN ('pending', 'approved')
      `);

    if (existingRequest.recordset.length > 0) {
      return {
        success: false,
        message: 'A deletion request already exists',
        requestId: existingRequest.recordset[0].id
      };
    }

    // Create deletion request
    const result = await db.request()
      .input('userId', sql.Int, userId)
      .input('reason', sql.NVarChar, reason)
      .query(`
        INSERT INTO data_deletion_requests (user_id, reason, status)
        OUTPUT INSERTED.*
        VALUES (@userId, @reason, 'pending')
      `);

    const request = result.recordset[0];

    logger.warn({
      message: 'Data deletion requested',
      userId,
      requestId: request.id
    });

    return {
      success: true,
      message: 'Deletion request submitted',
      requestId: request.id,
      note: 'Request will be reviewed within 30 days'
    };
  } catch (error) {
    logger.error({
      message: 'Error requesting data deletion',
      error: error.message,
      userId
    });
    throw error;
  }
};

/**
 * Approve deletion request (Admin)
 */
export const approveDeletionRequest = async (requestId, reviewedBy) => {
  const db = await getPool();

  try {
    await db.request()
      .input('requestId', sql.Int, requestId)
      .input('reviewedBy', sql.Int, reviewedBy)
      .query(`
        UPDATE data_deletion_requests
        SET status = 'approved',
            reviewed_at = GETDATE(),
            reviewed_by = @reviewedBy
        WHERE id = @requestId AND status = 'pending'
      `);

    logger.warn({
      message: 'Deletion request approved',
      requestId,
      reviewedBy
    });

    // TODO: Schedule actual deletion (30-day grace period)

    return {
      success: true,
      message: 'Deletion request approved'
    };
  } catch (error) {
    logger.error({
      message: 'Error approving deletion request',
      error: error.message,
      requestId
    });
    throw error;
  }
};

/**
 * Reject deletion request (Admin)
 */
export const rejectDeletionRequest = async (requestId, reviewedBy, rejectionReason) => {
  const db = await getPool();

  try {
    await db.request()
      .input('requestId', sql.Int, requestId)
      .input('reviewedBy', sql.Int, reviewedBy)
      .input('rejectionReason', sql.NVarChar, rejectionReason)
      .query(`
        UPDATE data_deletion_requests
        SET status = 'rejected',
            reviewed_at = GETDATE(),
            reviewed_by = @reviewedBy,
            rejection_reason = @rejectionReason
        WHERE id = @requestId AND status = 'pending'
      `);

    logger.info({
      message: 'Deletion request rejected',
      requestId,
      reviewedBy,
      reason: rejectionReason
    });

    return {
      success: true,
      message: 'Deletion request rejected'
    };
  } catch (error) {
    logger.error({
      message: 'Error rejecting deletion request',
      error: error.message,
      requestId
    });
    throw error;
  }
};

/**
 * Process deletion (anonymize or hard delete)
 */
export const processDeletion = async (requestId, method = 'anonymize') => {
  const db = await getPool();

  try {
    // Get request details
    const requestResult = await db.request()
      .input('requestId', sql.Int, requestId)
      .query(`
        SELECT * FROM data_deletion_requests
        WHERE id = @requestId AND status = 'approved'
      `);

    const request = requestResult.recordset[0];
    if (!request) {
      throw new Error('Request not found or not approved');
    }

    const userId = request.user_id;

    // Import accountManagementService (avoid circular dependency)
    const { anonymizeAccount, hardDeleteAccount } = await import('./accountManagementService.js');

    if (method === 'anonymize') {
      await anonymizeAccount(userId);
    } else {
      await hardDeleteAccount(userId);
    }

    // Mark request as completed
    await db.request()
      .input('requestId', sql.Int, requestId)
      .query(`
        UPDATE data_deletion_requests
        SET status = 'completed',
            completed_at = GETDATE()
        WHERE id = @requestId
      `);

    logger.error({
      message: 'Data deletion completed',
      requestId,
      userId,
      method
    });

    return {
      success: true,
      message: `Account ${method === 'anonymize' ? 'anonymized' : 'deleted'} successfully`
    };
  } catch (error) {
    logger.error({
      message: 'Error processing deletion',
      error: error.message,
      requestId
    });
    throw error;
  }
};

/**
 * Get deletion request status
 */
export const getDeletionStatus = async (userId) => {
  const db = await getPool();

  const result = await db.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        id, status, reason, requested_at, reviewed_at,
        reviewed_by, rejection_reason, completed_at
      FROM data_deletion_requests
      WHERE user_id = @userId
      ORDER BY requested_at DESC
    `);

  return result.recordset;
};

/**
 * List all deletion requests (Admin)
 */
export const listDeletionRequests = async (status = 'pending', limit = 50, offset = 0) => {
  const db = await getPool();

  const result = await db.request()
    .input('status', sql.NVarChar, status)
    .input('limit', sql.Int, limit)
    .input('offset', sql.Int, offset)
    .query(`
      SELECT
        dr.id,
        dr.user_id,
        u.username,
        u.email,
        dr.reason,
        dr.status,
        dr.requested_at,
        dr.reviewed_at,
        reviewer.username as reviewed_by_username
      FROM data_deletion_requests dr
      JOIN users u ON dr.user_id = u.id
      LEFT JOIN users reviewer ON dr.reviewed_by = reviewer.id
      WHERE dr.status = @status
      ORDER BY dr.requested_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

  return result.recordset;
};

export const gdprService = {
  requestDataExport,
  processDataExport,
  getExportStatus,
  requestDataDeletion,
  approveDeletionRequest,
  rejectDeletionRequest,
  processDeletion,
  getDeletionStatus,
  listDeletionRequests
};
