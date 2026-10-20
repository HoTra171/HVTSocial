import sql from 'mssql';
import { pool } from '../config/db.js';

export const FriendshipModel = {
  /**
   * Tìm mối quan hệ giữa 2 user
   */
  async findFriendship(userId, friendId) {
    const db = await pool;
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId).query(`
        SELECT id, user_id, friend_id, status, created_at, updated_at
        FROM friendships
        WHERE (user_id = @userId AND friend_id = @friendId)
           OR (user_id = @friendId AND friend_id = @userId)
      `);
    return result.recordset[0] || null;
  },

  /**
   * Tạo yêu cầu kết bạn
   */
  async createRequest(userId, friendId) {
    const db = await pool;
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId).query(`
        INSERT INTO friendships (user_id, friend_id, status, created_at)
        OUTPUT INSERTED.*
        VALUES (@userId, @friendId, 'pending', NOW())
      `);
    return result.recordset[0];
  },

  /**
   * Chấp nhận lời mời kết bạn
   */
  async acceptRequest(userId, friendId) {
    const db = await pool;
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId).query(`
        UPDATE friendships
        SET status = 'accepted', updated_at = NOW()
        OUTPUT INSERTED.*
        WHERE user_id = @friendId 
          AND friend_id = @userId 
          AND status = 'pending'
      `);
    return result.recordset[0] || null;
  },

  /**
   * Từ chối lời mời kết bạn
   */
  async rejectRequest(userId, friendId) {
    const db = await pool;
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId).query(`
        DELETE FROM friendships
        OUTPUT DELETED.*
        WHERE user_id = @friendId 
          AND friend_id = @userId 
          AND status = 'pending'
      `);
    return (result.recordset || []).length > 0;
  },

  /**
   * Hủy quan hệ bạn bè
   */
  async unfriend(userId, friendId) {
    const db = await pool;
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId).query(`
        DELETE FROM friendships
        WHERE ((user_id = @userId AND friend_id = @friendId)
             OR (user_id = @friendId AND friend_id = @userId))
          AND status = 'accepted'
      `);
    return (result.rowsAffected[0] || 0) > 0;
  },

  /**
   * Lấy danh sách bạn bè
   */
  async getFriendsList(userId) {
    const db = await pool;
    const result = await db.request().input('userId', sql.Int, userId).query(`
      SELECT 
        u.id,
        u.full_name,
        u.username,
        u.avatar,
        u.bio,
        f.updated_at AS friendship_date
      FROM friendships f
      JOIN users u ON (u.id = CASE WHEN f.user_id = @userId THEN f.friend_id ELSE f.user_id END)
      WHERE (f.user_id = @userId OR f.friend_id = @userId)
        AND f.status = 'accepted'
      ORDER BY f.updated_at DESC
    `);
    return result.recordset || [];
  },
};

export default FriendshipModel;
