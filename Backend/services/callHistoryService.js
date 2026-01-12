import { pool } from '../config/db.js';
import sql from 'mssql';

export const CallHistoryService = {
  /**
   * Create a new call history record
   * @param {number} callerId - ID of the caller
   * @param {number} receiverId - ID of the receiver
   * @param {string} callType - 'video' or 'voice'
   * @param {string} status - 'completed', 'missed', 'rejected', 'failed'
   * @param {number} duration - Duration in seconds (0 for missed/rejected)
   */
  async createCallHistory(callerId, receiverId, callType, status, duration = 0) {
    const db = await pool;

    const result = await db
      .request()
      .input('callerId', sql.Int, callerId)
      .input('receiverId', sql.Int, receiverId)
      .input('callType', sql.VarChar(10), callType)
      .input('status', sql.VarChar(20), status)
      .input('duration', sql.Int, duration)
      .query(`
        INSERT INTO call_history (caller_id, receiver_id, call_type, status, duration, created_at)
        OUTPUT INSERTED.*
        VALUES (@callerId, @receiverId, @callType, @status, @duration, GETDATE())
      `);

    return result.recordset[0];
  },

  /**
   * Get call history between two users
   * @param {number} userId1 - First user ID
   * @param {number} userId2 - Second user ID
   * @param {number} limit - Number of records to return
   */
  async getCallHistoryBetweenUsers(userId1, userId2, limit = 50) {
    const db = await pool;

    const result = await db
      .request()
      .input('userId1', sql.Int, userId1)
      .input('userId2', sql.Int, userId2)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          ch.id,
          ch.caller_id,
          ch.receiver_id,
          ch.call_type,
          ch.status,
          ch.duration,
          ch.created_at,
          caller.full_name AS caller_name,
          caller.avatar AS caller_avatar,
          receiver.full_name AS receiver_name,
          receiver.avatar AS receiver_avatar
        FROM call_history ch
        LEFT JOIN users caller ON ch.caller_id = caller.id
        LEFT JOIN users receiver ON ch.receiver_id = receiver.id
        WHERE (ch.caller_id = @userId1 AND ch.receiver_id = @userId2)
           OR (ch.caller_id = @userId2 AND ch.receiver_id = @userId1)
        ORDER BY ch.created_at DESC
      `);

    return result.recordset;
  },

  /**
   * Get call history for a user (all calls they were involved in)
   * @param {number} userId - User ID
   * @param {number} limit - Number of records to return
   */
  async getCallHistoryForUser(userId, limit = 100) {
    const db = await pool;

    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          ch.id,
          ch.caller_id,
          ch.receiver_id,
          ch.call_type,
          ch.status,
          ch.duration,
          ch.created_at,
          caller.full_name AS caller_name,
          caller.avatar AS caller_avatar,
          receiver.full_name AS receiver_name,
          receiver.avatar AS receiver_avatar,
          CASE
            WHEN ch.caller_id = @userId THEN 'outgoing'
            ELSE 'incoming'
          END AS direction
        FROM call_history ch
        LEFT JOIN users caller ON ch.caller_id = caller.id
        LEFT JOIN users receiver ON ch.receiver_id = receiver.id
        WHERE ch.caller_id = @userId OR ch.receiver_id = @userId
        ORDER BY ch.created_at DESC
      `);

    return result.recordset;
  },

  /**
   * Get missed calls count for a user
   * @param {number} userId - User ID
   */
  async getMissedCallsCount(userId) {
    const db = await pool;

    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS count
        FROM call_history
        WHERE receiver_id = @userId AND status = 'missed'
      `);

    return result.recordset[0]?.count || 0;
  },

  /**
   * Update call status (e.g., from 'ringing' to 'completed')
   * @param {number} callId - Call history ID
   * @param {string} status - New status
   * @param {number} duration - Duration in seconds
   */
  async updateCallStatus(callId, status, duration) {
    const db = await pool;

    const result = await db
      .request()
      .input('callId', sql.Int, callId)
      .input('status', sql.VarChar(20), status)
      .input('duration', sql.Int, duration)
      .query(`
        UPDATE call_history
        SET status = @status,
            duration = @duration
        OUTPUT INSERTED.*
        WHERE id = @callId
      `);

    return result.recordset[0];
  },
};
