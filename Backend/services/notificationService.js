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
   * NOTE: Notification creation functions have been removed
   * These notifications are now handled automatically by database triggers
   * See: Backend/database/create-notification-triggers.sql
   */

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
          CASE WHEN n.is_read = 1 THEN 'read' ELSE 'unread' END AS status,
          n.target_id AS post_id,
          n.created_at,
          u.full_name AS sender_name,
          u.avatar AS sender_avatar,
          u.id AS sender_id
        FROM notifications n
        LEFT JOIN users u ON n.actor_id = u.id
        WHERE n.user_id = @userId
        ORDER BY n.created_at DESC
        OFFSET 0 ROWS
        FETCH NEXT @limit ROWS ONLY
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
          AND is_read = 0
      `);

    return result.recordset[0].unread_count;
  },

  /**
   * 10. ĐÁNH DẤU ĐÃ ĐỌC TẤT CẢ
   */
  async markAllRead(userId) {
    await db.request().input('userId', userId).query(`
        UPDATE notifications
        SET is_read = 1
        WHERE user_id = @userId
          AND is_read = 0
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
        SET is_read = 1
        WHERE id = @notificationId
          AND user_id = @userId
          AND is_read = 0
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
    if (notif.recordset[0]?.status === 0) {
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
