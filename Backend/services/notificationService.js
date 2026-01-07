import { pool } from "../config/db.js";
import sql from "mssql";

export const NotificationService = {
  /**
   * HELPER: Cập nhật notification_unread cho user
   */
  async updateUnreadCount(userId) {
    const db = await pool;

    await db.request()
      .input("userId", sql.Int, userId)
      .query(`
        UPDATE users
        SET notification_unread = (
          SELECT COUNT(*) 
          FROM notifications 
          WHERE user_id = @userId AND status = 'unread'
        )
        WHERE id = @userId
      `);
  },

  /**
   * 1. TẠO THÔNG BÁO TIN NHẮN
   */
  async createMessageNotification(data) {
    const { userId, senderId, chatId, content } = data;
    const db = await pool;

    const result = await db
      .request()
      .input("userId", sql.Int, userId)
      .input("senderId", sql.Int, senderId)
      .input("content", sql.NVarChar, content)
      .query(`
        INSERT INTO notifications
          (user_id, sender_id, content, type, status, created_at)
        OUTPUT INSERTED.*
        VALUES
          (@userId, @senderId, @content, 'message', 'unread', GETDATE())
      `);

    // Cập nhật unread count
    await this.updateUnreadCount(userId);

    return result.recordset[0];
  },

  // Thông báo tag bài viết
  async createPostTagNotification(postId, senderId, userId) {
    const isBlocked = await NotificationModel.isUserBlocked(poolPromise, userId, senderId);
    if (isBlocked) return null;

    return NotificationModel.createPostTagNotification(poolPromise, {
      userId,
      senderId,
      postId,
    });
  },

  // Thông báo tag comment
  async createCommentTagNotification(postId, senderId, userId, commentId) {
    const isBlocked = await NotificationModel.isUserBlocked(poolPromise, userId, senderId);
    if (isBlocked) return null;

    return NotificationModel.createCommentTagNotification(poolPromise, {
      userId,
      senderId,
      postId,
      commentId,
    });
  },

  // Thông báo follow
  async createFollowNotification(userId, senderId) {
    const isBlocked = await NotificationModel.isUserBlocked(poolPromise, userId, senderId);
    if (isBlocked) return null;

    return NotificationModel.createFollowNotification(poolPromise, {
      userId,
      senderId,
    });
  },

  // Thông báo xem story
  async createStoryViewNotification(storyId, senderId, userId) {
    const isBlocked = await NotificationModel.isUserBlocked(poolPromise, userId, senderId);
    if (isBlocked) return null;

    return NotificationModel.createStoryViewNotification(poolPromise, {
      userId,
      senderId,
      storyId,
    });
  },

  // Thông báo từ hệ thống (report/kiểm duyệt)
  async createReportNotification(userId, content) {
    return NotificationModel.createReportNotification(poolPromise, {
      userId,
      content,
    });
  },

  /**
   * 2. TẠO THÔNG BÁO LIKE POST
   */
  async createLikeNotification(postId, likerId, postOwnerId) {
    if (likerId === postOwnerId) return null;

    const db = await pool;

    const result = await db
      .request()
      .input("userId", sql.Int, postOwnerId)
      .input("senderId", sql.Int, likerId)
      .input("postId", sql.Int, postId)
      .input("content", sql.NVarChar, "đã thích bài viết của bạn")
      .query(`
        -- Kiểm tra đã có notification chưa (trong 24h)
        IF NOT EXISTS (
          SELECT 1 FROM notifications
          WHERE user_id = @userId
            AND sender_id = @senderId
            AND post_id = @postId
            AND type = 'like'
            AND created_at > DATEADD(HOUR, -24, GETDATE())
        )
        BEGIN
          INSERT INTO notifications
            (user_id, sender_id, post_id, content, type, status, created_at)
          OUTPUT INSERTED.*
          VALUES
            (@userId, @senderId, @postId, @content, 'like', 'unread', GETDATE())
        END
      `);

    if (result.recordset[0]) {
      // Chỉ update nếu thật sự tạo notification mới
      await this.updateUnreadCount(postOwnerId);
    }

    return result.recordset[0] || null;
  },

  /**
   * 3. TẠO THÔNG BÁO COMMENT
   */
  async createCommentNotification(postId, commenterId, postOwnerId, commentContent) {
    if (commenterId === postOwnerId) return null;

    const db = await pool;

    const content =
      commentContent.length > 50
        ? `đã bình luận: "${commentContent.substring(0, 50)}..."`
        : `đã bình luận: "${commentContent}"`;

    const result = await db
      .request()
      .input("userId", sql.Int, postOwnerId)
      .input("senderId", sql.Int, commenterId)
      .input("postId", sql.Int, postId)
      .input("content", sql.NVarChar, content)
      .query(`
        INSERT INTO notifications
          (user_id, sender_id, post_id, content, type, status, created_at)
        OUTPUT INSERTED.*
        VALUES
          (@userId, @senderId, @postId, @content, 'comment', 'unread', GETDATE())
      `);

    // Cập nhật unread count
    await this.updateUnreadCount(postOwnerId);

    return result.recordset[0];
  },

  /**
   * 4. TẠO THÔNG BÁO COMMENT REPLY
   */
  async createReplyNotification(postId, replierId, parentCommentOwnerId, replyContent) {
    if (replierId === parentCommentOwnerId) return null;

    const db = await pool;

    const content =
      replyContent.length > 50
        ? `đã trả lời bình luận của bạn: "${replyContent.substring(0, 50)}..."`
        : `đã trả lời bình luận của bạn: "${replyContent}"`;

    const result = await db
      .request()
      .input("userId", sql.Int, parentCommentOwnerId)
      .input("senderId", sql.Int, replierId)
      .input("postId", sql.Int, postId)
      .input("content", sql.NVarChar, content)
      .query(`
        INSERT INTO notifications
          (user_id, sender_id, post_id, content, type, status, created_at)
        OUTPUT INSERTED.*
        VALUES
          (@userId, @senderId, @postId, @content, 'reply', 'unread', GETDATE())
      `);

    // Cập nhật unread count
    await this.updateUnreadCount(parentCommentOwnerId);

    return result.recordset[0];
  },

  /**
   * 5. TẠO THÔNG BÁO FRIEND REQUEST
   */
  async createFriendRequestNotification(userId, senderId, content = "đã gửi lời mời kết bạn") {
    const db = await pool;

    const result = await db
      .request()
      .input("userId", sql.Int, userId)
      .input("senderId", sql.Int, senderId)
      .input("content", sql.NVarChar, content)
      .query(`
      INSERT INTO notifications
        (user_id, sender_id, content, type, status, created_at)
      OUTPUT INSERTED.*
      VALUES
        (@userId, @senderId, @content, 'friend_request', 'unread', GETDATE())
    `);

    await this.updateUnreadCount(userId);
    return result.recordset[0];
  },


  /**
   * 6. TẠO THÔNG BÁO ACCEPT FRIEND REQUEST
   */
  async createFriendAcceptNotification(userId, senderId) {
    return this.createFriendRequestNotification(
      userId,
      senderId,
      "đã chấp nhận lời mời kết bạn của bạn"
    );
  },


  /**
 * 7B. TẠO THÔNG BÁO LOẠI OTHER (DÙNG CHO SHARE + CÁC LOẠI KHÁC)
 */
  async createOtherNotification(data) {
    const { userId, senderId, content, postId = null } = data;

    if (senderId === userId) return null;

    const db = await pool;

    const result = await db
      .request()
      .input("userId", sql.Int, userId)
      .input("senderId", sql.Int, senderId)
      .input("postId", postId ? sql.Int : sql.Int, postId) // NULL nếu không có
      .input("content", sql.NVarChar, content)
      .query(`
      INSERT INTO notifications
        (user_id, sender_id, post_id, content, type, status, created_at)
      OUTPUT INSERTED.*
      VALUES
        (@userId, @senderId, @postId, @content, 'other', 'unread', GETDATE())
    `);

    await this.updateUnreadCount(userId);
    return result.recordset[0];
  },

  /**
   * 8. LẤY DANH SÁCH THÔNG BÁO
   */
  async getNotifications(userId, limit = 50) {
    const db = await pool;

    const result = await db
      .request()
      .input("userId", sql.Int, userId)
      .input("limit", sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          n.id,
          n.message AS content,
          n.type,
          n.is_read AS status,
          n.target_id AS post_id,
          n.created_at,
          u.full_name AS sender_name,
          u.avatar AS sender_avatar,
          u.id AS sender_id
        FROM notifications n
        LEFT JOIN users u ON n.actor_id = u.id
        WHERE n.user_id = @userId
        ORDER BY n.created_at DESC
      `);

    return result.recordset;
  },

  /**
   * 9. ĐẾM THÔNG BÁO CHƯA ĐỌC
   */
  async getUnreadCount(userId) {
    const db = await pool;

    const result = await db
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT COUNT(*) AS unread_count
        FROM notifications
        WHERE user_id = @userId
          AND status = 'unread'
      `);

    return result.recordset[0].unread_count;
  },

  /**
   * 10. ĐÁNH DẤU ĐÃ ĐỌC TẤT CẢ
   */
  async markAllRead(userId) {
    const db = await pool;

    await db
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        UPDATE notifications
        SET status = 'read'
        WHERE user_id = @userId
          AND status = 'unread'
      `);

    // Cập nhật unread count về 0
    await this.updateUnreadCount(userId);

    return { success: true };
  },

  /**
   * 11. ĐÁNH DẤU ĐÃ ĐỌC 1 THÔNG BÁO
   */
  async markAsRead(notificationId, userId) {
    const db = await pool;

    await db
      .request()
      .input("notificationId", sql.Int, notificationId)
      .input("userId", sql.Int, userId)
      .query(`
        UPDATE notifications
        SET status = 'read'
        WHERE id = @notificationId
          AND user_id = @userId
          AND status = 'unread'
      `);

    // Cập nhật unread count
    await this.updateUnreadCount(userId);

    return { success: true };
  },

  /**
   * 12. XÓA THÔNG BÁO
   */
  async deleteNotification(notificationId, userId) {
    const db = await pool;

    // Get notification status trước khi xóa
    const notif = await db.request()
      .input("notificationId", sql.Int, notificationId)
      .input("userId", sql.Int, userId)
      .query(`
        SELECT status FROM notifications
        WHERE id = @notificationId AND user_id = @userId
      `);

    await db
      .request()
      .input("notificationId", sql.Int, notificationId)
      .input("userId", sql.Int, userId)
      .query(`
        DELETE FROM notifications
        WHERE id = @notificationId
          AND user_id = @userId
      `);

    // Nếu xóa notification unread thì update count
    if (notif.recordset[0]?.status === 'unread') {
      await this.updateUnreadCount(userId);
    }

    return { success: true };
  },

  /**
   * 13. XÓA TẤT CẢ THÔNG BÁO
   */
  async deleteAllNotifications(userId) {
    const db = await pool;

    await db
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        DELETE FROM notifications
        WHERE user_id = @userId
      `);

    // Cập nhật unread count về 0
    await db.request()
      .input("userId", sql.Int, userId)
      .query(`
        UPDATE users
        SET notification_unread = 0
        WHERE id = @userId
      `);

    return { success: true };
  },
};