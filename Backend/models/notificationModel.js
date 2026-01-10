import sql from 'mssql';

export const NotificationModel = {
  // Tạo thông báo tin nhắn mới
  async createMessageNotification(pool, data) {
    const { userId, senderId, chatId, content } = data;

    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input('userId', sql.Int, userId);
    req.input('senderId', sql.Int, senderId);
    req.input('content', sql.NVarChar(255), content);

    const query = `
      INSERT INTO notifications
        (user_id, sender_id, content, type, status, created_at)
      OUTPUT INSERTED.*
      VALUES
        (@userId, @senderId, @content, 'message', 'unread', NOW());
    `;

    const result = await req.query(query);
    return result.recordset[0];
  },

  // Đánh dấu thông báo đã đọc
  async markNotificationAsRead(pool, notificationId) {
    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input('notificationId', sql.Int, notificationId);

    const query = `
      UPDATE notifications
      SET status = 'read'
      WHERE id = @notificationId;
    `;

    return req.query(query);
  },

  // Lấy tất cả thông báo của user
  async getUserNotifications(pool, userId) {
    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input('userId', sql.Int, userId);

    const query = `
      SELECT 
        n.id,
        n.user_id,
        n.sender_id,
        n.post_id,
        n.content,
        n.type,
        n.status,
        n.created_at,
        u.full_name AS sender_name,
        u.avatar AS sender_avatar
      FROM notifications n
      LEFT JOIN users u ON u.id = n.sender_id
      WHERE n.user_id = @userId
      ORDER BY n.created_at DESC;
    `;

    const result = await req.query(query);
    return result.recordset;
  },

  // Thông báo tag bài viết
  async createPostTagNotification(pool, data) {
    const { userId, senderId, postId } = data;
    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input('userId', sql.Int, userId);
    req.input('senderId', sql.Int, senderId);
    req.input('postId', sql.Int, postId);
    req.input('content', sql.NVarChar(255), 'đã tag bạn trong một bài viết');

    const query = `
    INSERT INTO notifications (user_id, sender_id, post_id, content, type, status, created_at)
    OUTPUT INSERTED.*
    VALUES (@userId, @senderId, @postId, @content, 'post_tag', 'unread', NOW());
  `;

    const result = await req.query(query);
    return result.recordset[0];
  },

  // Thông báo tag comment
  async createCommentTagNotification(pool, data) {
    const { userId, senderId, postId, commentId } = data;
    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input('userId', sql.Int, userId);
    req.input('senderId', sql.Int, senderId);
    req.input('postId', sql.Int, postId);
    req.input('content', sql.NVarChar(255), 'đã tag bạn trong một bình luận');

    const query = `
    INSERT INTO notifications (user_id, sender_id, post_id, content, type, status, created_at)
    OUTPUT INSERTED.*
    VALUES (@userId, @senderId, @postId, @content, 'comment_tag', 'unread', NOW());
  `;

    const result = await req.query(query);
    return result.recordset[0];
  },

  // Thông báo follow
  async createFollowNotification(pool, data) {
    const { userId, senderId } = data;
    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input('userId', sql.Int, userId);
    req.input('senderId', sql.Int, senderId);
    req.input('content', sql.NVarChar(255), 'đã theo dõi bạn');

    const query = `
    INSERT INTO notifications (user_id, sender_id, content, type, status, created_at)
    OUTPUT INSERTED.*
    VALUES (@userId, @senderId, @content, 'follow', 'unread', NOW());
  `;

    const result = await req.query(query);
    return result.recordset[0];
  },

  // Thông báo xem story
  async createStoryViewNotification(pool, data) {
    const { userId, senderId, storyId } = data;
    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input('userId', sql.Int, userId);
    req.input('senderId', sql.Int, senderId);
    req.input('content', sql.NVarChar(255), 'đã xem story của bạn');

    const query = `
    INSERT INTO notifications (user_id, sender_id, content, type, status, created_at)
    OUTPUT INSERTED.*
    VALUES (@userId, @senderId, @content, 'story_view', 'unread', NOW());
  `;

    const result = await req.query(query);
    return result.recordset[0];
  },

  // Thông báo kiểm duyệt/báo cáo
  async createReportNotification(pool, data) {
    const { userId, content } = data;
    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input('userId', sql.Int, userId);
    req.input('content', sql.NVarChar(255), content);

    const query = `
    INSERT INTO notifications (user_id, content, type, status, created_at)
    OUTPUT INSERTED.*
    VALUES (@userId, @content, 'report', 'unread', NOW());
  `;

    const result = await req.query(query);
    return result.recordset[0];
  },

  // Kiểm tra user có bị chặn không
  async isUserBlocked(pool, userId, senderId) {
    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input('userId', sql.Int, userId);
    req.input('senderId', sql.Int, senderId);

    const query = `
    SELECT COUNT(*) AS is_blocked
    FROM user_blocks
    WHERE user_id = @userId AND blocked_user_id = @senderId;
  `;

    const result = await req.query(query);
    return result.recordset[0].is_blocked > 0;
  },

  // Đếm số thông báo chưa đọc
  async getUnreadNotificationCount(pool, userId) {
    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input('userId', sql.Int, userId);

    const query = `
      SELECT COUNT(*) AS unread_count
      FROM notifications
      WHERE user_id = @userId
        AND status = 'unread';
    `;

    const result = await req.query(query);
    return result.recordset[0].unread_count;
  },
};
