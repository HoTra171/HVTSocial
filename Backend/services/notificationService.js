import { db } from '../config/db-wrapper.js';

export const NotificationService = {
  /**
   * HELPER: Cập nhật notification_unread cho user
   */
  async updateUnreadCount(userId) {
    // Column 'notification_unread' does not exist in users table in PostgreSQL schema.
    // Skipping update - frontend will call getUnreadCount() instead
    return;
  },

  /**
   * CREATE NOTIFICATIONS
   */

  /**
   * Create like notification
   */
  async createLikeNotification(postId, senderId, userId) {
    const result = await db
      .request()
      .input('userId', userId)
      .input('actorId', senderId)
      .input('targetId', postId).query(`
        INSERT INTO notifications (user_id, actor_id, type, target_type, target_id, message, is_read)
        VALUES (@userId, @actorId, 'like', 'post', @targetId, 'đã thích bài viết của bạn', false)
        RETURNING *
      `);
    return result.recordset[0];
  },

  /**
   * Create comment notification
   */
  async createCommentNotification(postId, senderId, userId, content) {
    const message = content || 'đã bình luận bài viết của bạn';
    const result = await db
      .request()
      .input('userId', userId)
      .input('actorId', senderId)
      .input('targetId', postId)
      .input('message', message).query(`
        INSERT INTO notifications (user_id, actor_id, type, target_type, target_id, message, is_read)
        VALUES (@userId, @actorId, 'comment', 'post', @targetId, @message, false)
        RETURNING *
      `);
    return result.recordset[0];
  },

  /**
   * Create friend request notification
   */
  async createFriendRequestNotification(userId, senderId, content) {
    const message = content || 'đã gửi lời mời kết bạn';
    const result = await db
      .request()
      .input('userId', userId)
      .input('actorId', senderId)
      .input('message', message).query(`
        INSERT INTO notifications (user_id, actor_id, type, message, is_read)
        VALUES (@userId, @actorId, 'friend_request', @message, false)
        RETURNING *
      `);
    return result.recordset[0];
  },

  /**
   * Create message notification
   */
  async createMessageNotification({ userId, senderId, chatId, content }) {
    const message = content || 'đã gửi tin nhắn cho bạn';
    const result = await db
      .request()
      .input('userId', userId)
      .input('actorId', senderId)
      .input('message', message).query(`
        INSERT INTO notifications (user_id, actor_id, type, message, is_read)
        VALUES (@userId, @actorId, 'message', @message, false)
        RETURNING *
      `);
    return result.recordset[0];
  },

  /**
   * Create other notification
   */
  async createOtherNotification({ userId, senderId, content, postId }) {
    const message = content || 'Bạn có thông báo mới';
    const result = await db
      .request()
      .input('userId', userId)
      .input('actorId', senderId)
      .input('targetId', postId || null)
      .input('message', message).query(`
        INSERT INTO notifications (user_id, actor_id, type, target_type, target_id, message, is_read)
        VALUES (@userId, @actorId, 'share', ${postId ? "'post'" : 'NULL'}, @targetId, @message, false)
        RETURNING *
      `);
    return result.recordset[0];
  },

  /**
   * 8. LẤY DANH SÁCH THÔNG BÁO
   */
  async getNotifications(userId, limit = 50) {
    const result = await db
      .request()
      .input('userId', userId)
      .input('limit', limit).query(`
        SELECT
          n.id,
          n.message AS content,
          n.type,
          CASE WHEN n.is_read THEN 'read' ELSE 'unread' END AS status,
          n.target_id AS post_id,
          n.target_type,
          n.created_at,
          u.full_name AS sender_name,
          u.avatar AS sender_avatar,
          u.id AS sender_id
        FROM notifications n
        LEFT JOIN users u ON n.actor_id = u.id
        WHERE n.user_id = @userId
        ORDER BY n.created_at DESC
        LIMIT @limit
      `);

    return result.recordset;
  },

  /**
   * 9. ĐẾM THÔNG BÁO CHƯA ĐỌC
   */
  async getUnreadCount(userId) {
    const result = await db.request().input('userId', userId).query(`
        SELECT COUNT(*) AS unread_count
        FROM notifications
        WHERE user_id = @userId
          AND is_read = false
      `);

    return result.recordset[0].unread_count;
  },

  /**
   * 10. ĐÁNH DẤU ĐÃ ĐỌC TẤT CẢ
   */
  async markAllRead(userId) {
    await db.request().input('userId', userId).query(`
        UPDATE notifications
        SET is_read = true
        WHERE user_id = @userId
          AND is_read = false
      `);

    // Cập nhật unread count về 0
    await this.updateUnreadCount(userId);

    return { success: true };
  },

  /**
   * 11. ĐÁNH DẤU ĐÃ ĐỌC 1 THÔNG BÁO
   */
  async markAsRead(notificationId, userId) {
    await db
      .request()
      .input('notificationId', notificationId)
      .input('userId', userId).query(`
        UPDATE notifications
        SET is_read = true
        WHERE id = @notificationId
          AND user_id = @userId
          AND is_read = false
      `);

    // Cập nhật unread count
    await this.updateUnreadCount(userId);

    return { success: true };
  },

  /**
   * 12. XÓA THÔNG BÁO
   */
  async deleteNotification(notificationId, userId) {
    // Get notification status trước khi xóa
    const notif = await db
      .request()
      .input('notificationId', notificationId)
      .input('userId', userId).query(`
        SELECT is_read AS status FROM notifications
        WHERE id = @notificationId AND user_id = @userId
      `);

    await db
      .request()
      .input('notificationId', notificationId)
      .input('userId', userId).query(`
        DELETE FROM notifications
        WHERE id = @notificationId
          AND user_id = @userId
      `);

    // Nếu xóa notification unread thì update count
    if (notif.recordset[0]?.status === false) {
      await this.updateUnreadCount(userId);
    }

    return { success: true };
  },

  /**
   * 13. XÓA TẤT CẢ THÔNG BÁO
   */
  async deleteAllNotifications(userId) {
    await db.request().input('userId', userId).query(`
        DELETE FROM notifications
        WHERE user_id = @userId
      `);

    // Cập nhật unread count về 0
    await this.updateUnreadCount(userId);

    return { success: true };
  },
};
