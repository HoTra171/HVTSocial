import { pool } from '../config/db.js';
import sql from 'mssql';

export const FriendshipService = {
  /**
   * 1. GỬI LỜI MỜI KẾT BẠN
   * Tạo record với status = 'pending'
   */
  async sendFriendRequest(userId, friendId) {
    const db = await pool;

    // Kiểm tra đã có request chưa
    const checkResult = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId).query(`
        SELECT id, status FROM friendships
        WHERE (user_id = @userId AND friend_id = @friendId)
           OR (user_id = @friendId AND friend_id = @userId)
      `);

    if (checkResult.recordset.length > 0) {
      const existing = checkResult.recordset[0];
      if (existing.status === 'accepted') {
        throw new Error('Đã là bạn bè');
      }
      if (existing.status === 'pending') {
        throw new Error('Lời mời đã tồn tại');
      }
      if (existing.status === 'blocked') {
        throw new Error('Không thể gửi lời mời');
      }
    }

    // Tạo friendship mới
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId).query(`
        INSERT INTO friendships (user_id, friend_id, status, created_at)
        OUTPUT INSERTED.*
        VALUES (@userId, @friendId, 'pending', GETDATE())
      `);

    return result.recordset[0];
  },

  // chấp nhận lời mời kết bạn
  async acceptFriendRequest(userId, friendId) {
    const db = await pool;

    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId).query(`
      UPDATE friendships
      SET status = 'accepted',
          updated_at = GETDATE()
      WHERE user_id = @friendId 
        AND friend_id = @userId 
        AND status = 'pending';

      SELECT TOP 1 *
      FROM friendships
      WHERE user_id = @friendId 
        AND friend_id = @userId;
    `);

    if (result.recordset.length === 0) {
      throw new Error('Không tìm thấy lời mời kết bạn');
    }

    return result.recordset[0];
  },

  /**
   * 3. TỪ CHỐI LỜI MỜI KẾT BẠN
   * Xóa record có status = 'pending'
   */
  async rejectFriendRequest(userId, friendId) {
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

    if (result.recordset.length === 0) {
      throw new Error('Không tìm thấy lời mời kết bạn');
    }

    return { success: true, message: 'Đã từ chối lời mời' };
  },

  /**
   * 4. HỦY KẾT BẠN
   * Xóa record có status = 'accepted'
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

    if (result.rowsAffected[0] === 0) {
      throw new Error('Không tìm thấy mối quan hệ bạn bè');
    }

    return { success: true, message: 'Đã hủy kết bạn' };
  },

  /**
   * 5. HỦY LỜI MỜI ĐÃ GỬI
   * Xóa request mà mình đã gửi (user_id = userId, status = pending)
   */
  async cancelFriendRequest(userId, friendId) {
    const db = await pool;

    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId).query(`
        DELETE FROM friendships
        OUTPUT DELETED.*
        WHERE user_id = @userId 
          AND friend_id = @friendId 
          AND status = 'pending'
      `);

    if (result.recordset.length === 0) {
      throw new Error('Không tìm thấy lời mời');
    }

    return { success: true, message: 'Đã hủy lời mời' };
  },

  /**
   * 6. KIỂM TRA TRẠNG THÁI BẠN BÈ
   * Trả về: null, 'pending_sent', 'pending_received', 'accepted', 'blocked'
   */
  async getFriendshipStatus(userId, friendId) {
    const db = await pool;

    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('friendId', sql.Int, friendId).query(`
        SELECT user_id, friend_id, status
        FROM friendships
        WHERE (user_id = @userId AND friend_id = @friendId)
           OR (user_id = @friendId AND friend_id = @userId)
      `);

    if (result.recordset.length === 0) {
      return { status: null, canSendRequest: true };
    }

    const record = result.recordset[0];

    if (record.status === 'accepted') {
      return { status: 'friends', isFriend: true };
    }

    if (record.status === 'blocked') {
      return { status: 'blocked', canSendRequest: false };
    }

    if (record.status === 'pending') {
      if (record.user_id === userId) {
        // Mình đã gửi request
        return { status: 'pending_sent', canCancel: true };
      } else {
        // Người kia gửi request cho mình
        return { status: 'pending_received', canAccept: true, canReject: true };
      }
    }

    return { status: null };
  },

  /**
   * 7. LẤY DANH SÁCH BẠN BÈ
   * Lấy tất cả user có status = 'accepted'
   */
  // Trả về user có quan hệ 'accepted' với @userId (có phân trang)
  async getFriends(userId, page = 1, limit = 20) {
    const db = await pool; // luôn cần
    const offset = (page - 1) * limit;

    const sqlText = `
    WITH friends AS (
      -- Trường hợp mình là user_id, bạn là friend_id
      SELECT
        u.id,
        u.full_name,
        u.username,
        u.avatar,
        u.bio,
        u.location,
        f.created_at AS friend_since
      FROM friendships f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = @userId AND f.status = 'accepted'

      UNION ALL

      -- Trường hợp mình là friend_id, bạn là user_id
      SELECT
        u.id,
        u.full_name,
        u.username,
        u.avatar,
        u.bio,
        u.location,
        f.created_at AS friend_since
      FROM friendships f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = @userId AND f.status = 'accepted'
    )
    SELECT *
    FROM friends
    ORDER BY friend_since DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `;

    const rs = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(sqlText);

    return rs.recordset;
  },

  /**
   * 8. LẤY LỜI MỜI ĐANG CHỜ (người khác gửi cho mình)
   */
  async getPendingRequests(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const db = await pool;

    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit).query(`
        SELECT 
          u.id,
          u.full_name,
          u.username,
          u.avatar,
          u.bio,
          f.created_at AS request_date
        FROM friendships f
        JOIN users u ON u.id = f.user_id
        WHERE f.friend_id = @userId 
          AND f.status = 'pending'
        ORDER BY f.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    return result.recordset;
  },

  /**
   * 9. LẤY LỜI MỜI ĐÃ GỬI (mình gửi cho người khác)
   */
  async getSentRequests(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const db = await pool;

    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit).query(`
        SELECT 
          u.id,
          u.full_name,
          u.username,
          u.avatar,
          u.bio,
          f.created_at AS request_date
        FROM friendships f
        JOIN users u ON u.id = f.friend_id
        WHERE f.user_id = @userId 
          AND f.status = 'pending'
        ORDER BY f.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    return result.recordset;
  },

  /**
   * 10. GỢI Ý BẠN BÈ (mutual friends)
   */
  async getSuggestedFriends(userId, limit = 10) {
    const db = await pool;

    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('limit', sql.Int, limit).query(`
      WITH accepted_edges AS (
        SELECT user_id AS a, friend_id AS b
        FROM friendships
        WHERE status = 'accepted'
        UNION 
        SELECT friend_id AS a, user_id AS b
        FROM friendships
        WHERE status = 'accepted'
      ),
      my_friends AS (
        SELECT DISTINCT b AS friend_id
        FROM accepted_edges
        WHERE a = @userId
      ),
      me AS (
        SELECT id, location
        FROM users
        WHERE id = @userId
      )
      SELECT TOP (@limit)
        u.id,
        u.full_name,
        u.username,
        u.avatar,
        u.bio,

        -- mutual friends
        (
          SELECT COUNT(*)
          FROM my_friends mf
          JOIN accepted_edges ae
            ON ae.a = u.id AND ae.b = mf.friend_id
        ) AS mutual_friends_count,

        -- mutual follow (disabled - follows table not in schema)
        0 AS mutual_follow,

        -- same location (using location field instead of address)
        CASE WHEN (SELECT location FROM me) IS NOT NULL
               AND u.location IS NOT NULL
               AND u.location = (SELECT location FROM me)
        THEN 1 ELSE 0 END AS same_location,

        -- score (simplified - based on mutual friends and location)
        (
          (
            SELECT COUNT(*)
            FROM my_friends mf
            JOIN accepted_edges ae
              ON ae.a = u.id AND ae.b = mf.friend_id
          ) * 10
          +
          (CASE WHEN (SELECT location FROM me) IS NOT NULL
                 AND u.location IS NOT NULL
                 AND u.location = (SELECT location FROM me)
           THEN 1 ELSE 0 END) * 2
        ) AS score

      FROM users u
      WHERE u.id <> @userId

        -- loại trừ mọi quan hệ trong friendships (pending/accepted/blocked...)
        AND NOT EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.user_id = @userId AND f.friend_id = u.id)
             OR (f.user_id = u.id AND f.friend_id = @userId)
        )

      ORDER BY score DESC, mutual_friends_count DESC, u.created_at DESC;
    `);

    return result.recordset;
  },

  /**
   * 10. ĐẾM SỐ LƯỢNG LỜI MỜI KẾT BẠN ĐANG CHỜ
   */
  async getPendingRequestsCount(userId) {
    const db = await pool;

    const result = await db
      .request()
      .input('userId', sql.Int, userId).query(`
        SELECT COUNT(*) AS count
        FROM friendships
        WHERE friend_id = @userId
          AND status = 'pending'
      `);

    return result.recordset[0]?.count || 0;
  },
};
