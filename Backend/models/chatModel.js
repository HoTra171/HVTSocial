import sql from "mssql";

export const ChatModel = {
  // Lấy danh sách tất cả chat (1-1 + group) của 1 user
  async getUserChats(pool, userId) {
    // Đảm bảo pool đã connected
    if (!pool.connected) {
      await pool.connect();
    }
    const req = pool.request();
    req.input("userId", sql.Int, userId);

    const query = `WITH MyChats AS (
  SELECT chat_id
  FROM chat_users
  WHERE user_id = @userId
),
Base AS (
  SELECT 
    c.id AS chat_id,
    c.is_group_chat,
    c.name AS chat_name,

    CASE WHEN c.is_group_chat = 0 THEN u.id ELSE NULL END AS target_id,
    CASE WHEN c.is_group_chat = 0 THEN u.full_name ELSE c.name END AS target_name,
    CASE WHEN c.is_group_chat = 0 THEN u.username ELSE NULL END AS target_username,

    CASE 
      WHEN c.is_group_chat = 0 THEN u.avatar
      ELSE uLast.avatar
    END AS avatar,

    lmDetail.content      AS last_message,
    lmDetail.message_type AS last_message_type,
    lmDetail.media_url    AS last_media_url,

    ISNULL(uc.unread_count, 0) AS unread_count,

    COALESCE(lmDetail.created_at, c.updated_at, c.created_at) AS last_time

  FROM chats c
  JOIN MyChats mc
    ON mc.chat_id = c.id

  OUTER APPLY (
    SELECT TOP (1)
      m.sender_id,
      m.content,
      m.message_type,
      m.media_url,
      m.created_at
    FROM messages m
    WHERE m.chat_id = c.id
    ORDER BY m.created_at DESC, m.id DESC
  ) lmDetail ON true

  OUTER APPLY (
    SELECT COUNT(*) AS unread_count
    FROM messages m
    WHERE m.chat_id = c.id
      AND m.sender_id <> @userId
      AND m.status IN ('sent', 'delivered')
  ) uc ON true

  OUTER APPLY (
    SELECT TOP (1) cu.user_id AS other_user_id
    FROM chat_users cu
    WHERE cu.chat_id = c.id
      AND cu.user_id <> @userId
      AND c.is_group_chat = 0
  ) other ON true

  LEFT JOIN users u
    ON u.id = other.other_user_id

  LEFT JOIN users uLast
    ON uLast.id = lmDetail.sender_id
),
Ranked AS (
  SELECT
    *,
    CASE 
      WHEN is_group_chat = 0
        THEN ROW_NUMBER() OVER (PARTITION BY target_id ORDER BY last_time DESC, chat_id DESC)
      ELSE 1
    END AS rn
  FROM Base
)
SELECT *
FROM Ranked
WHERE is_group_chat = 1 OR rn = 1
ORDER BY last_time DESC, chat_id DESC;
`

    const result = await req.query(query);
    return result.recordset;
  },

  // Lấy tổng số tin nhắn chưa đọc của user
  async getUnreadCount(pool, userId) {
    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input("userId", sql.Int, userId);

    const query = `
      SELECT COUNT(*) AS unread_count
      FROM messages m
      JOIN chat_users cu ON cu.chat_id = m.chat_id
      WHERE cu.user_id = @userId
        AND m.sender_id <> @userId
        AND m.status IN ('sent', 'delivered');
    `;

    const result = await req.query(query);
    return result.recordset[0].unread_count;
  },

  // Lấy toàn bộ tin nhắn theo chat_id
  async getMessagesByChat(pool, chatId) {
    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input("chatId", sql.Int, chatId);

    const query = `
      SELECT
        id,
        chat_id,
        sender_id,
        content,
        status,
        message_type,
        media_url,
        duration,
        created_at
      FROM messages
      WHERE chat_id = @chatId
      ORDER BY created_at ASC;
    `;

    return req.query(query);
  },

  // Gửi tin nhắn (text / image / voice / reply)
  async sendMessage(pool, payload) {
    const {
      chatId,
      senderId,
      content,
      message_type,
      media_url,
      duration,
      reply_to_id,
      reply_content,
      reply_type,
      reply_sender,
    } = payload;

    if (!pool.connected) await pool.connect();
    const req = pool.request();

    // Nếu có reply, lưu JSON vào content
    let finalContent = content || "";
    if (reply_to_id) {
      const replyData = {
        reply_to: reply_to_id,
        reply_content: reply_content || "",
        reply_type: reply_type || "text",
        reply_sender: reply_sender || "",
        message: finalContent
      };
      finalContent = JSON.stringify(replyData);
    }

    req.input("chatId", sql.Int, chatId);
    req.input("senderId", sql.Int, senderId);
    req.input("content", sql.NVarChar(sql.MAX), finalContent);
    req.input("message_type", sql.VarChar(20), message_type || "text");
    req.input("media_url", sql.NVarChar(sql.MAX), media_url || null);
    req.input("duration", sql.Int, duration ?? null);

    const query = `
      INSERT INTO messages
        (chat_id, sender_id, content, status, message_type, media_url, duration)
      OUTPUT INSERTED.*
      VALUES
        (@chatId, @senderId, @content, 'sent', @message_type, @media_url, @duration);

      UPDATE chats
      SET updated_at = GETDATE()
      WHERE id = @chatId;
    `;

    return req.query(query);
  },

  // Đánh dấu tin nhắn đã đọc
  async markMessagesRead(pool, chatId, userId) {
    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input("chatId", sql.Int, chatId);
    req.input("userId", sql.Int, userId);

    const query = `
      UPDATE messages
      SET status = 'read'
      WHERE chat_id = @chatId
        AND sender_id <> @userId
        AND status <> 'read';
    `;

    return req.query(query);
  },

  // Thu hồi tin nhắn
  async recallMessage(pool, messageId) {
    if (!pool.connected) await pool.connect();
    const request = pool.request();

    request.input("messageId", sql.Int, messageId);

    const query = `
      UPDATE Messages
      SET 
        content = N'[recalled]',
        media_url = NULL,
        message_type = 'recalled'
      WHERE id = @messageId;
    `;

    return request.query(query);
  },

  // Chỉnh sửa tin nhắn
  async editMessage(pool, messageId, newContent) {
    if (!pool.connected) await pool.connect();
    const request = pool.request();

    request.input("messageId", sql.Int, messageId);
    request.input("newContent", sql.NVarChar(sql.MAX), newContent);

    const query = `
      UPDATE Messages
      SET content = @newContent
      WHERE id = @messageId;
    `;

    return request.query(query);
  },

  // lấy chat_id và sender_id của tin nhắn để check quyền + emit đúng room
  async getMessageMeta(pool, messageId) {
    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input("messageId", sql.Int, messageId);

    const query = `
    SELECT id, chat_id, sender_id
    FROM messages
    WHERE id = @messageId;
  `;
    const result = await req.query(query);
    return result.recordset[0] || null;
  },


  // Lấy danh sách users trong 1 chat (dùng cho notification)
  async getChatUsers(pool, chatId) {
    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input("chatId", sql.Int, chatId);

    const query = `
      SELECT cu.user_id
      FROM chat_users cu
      WHERE cu.chat_id = @chatId;
    `;

    const result = await req.query(query);
    return result.recordset;
  },

  // gửi tin nhắn với người chưa từng nhắn tin
  async getOrCreateDm(pool, userA, userB) {
    if (!pool.connected) await pool.connect();

    const low = Math.min(userA, userB);
    const high = Math.max(userA, userB);

    const tx = new sql.Transaction(pool);
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      // lock theo cặp user để không tạo trùng
      const lockReq = tx.request();
      lockReq.input("lockKey", sql.NVarChar(100), `dm:${low}:${high}`);
      await lockReq.query(`
      DECLARE @res int;
      EXEC @res = sp_getapplock
        @Resource = @lockKey,
        @LockMode = 'Exclusive',
        @LockOwner = 'Transaction',
        @LockTimeout = 10000;
      IF (@res < 0) THROW 51000, 'applock_failed', 1;
    `);

      // tìm chat 1-1 đã tồn tại
      const findReq = tx.request();
      findReq.input("userA", sql.Int, userA);
      findReq.input("userB", sql.Int, userB);

      const existing = await findReq.query(`
      SELECT TOP 1 c.id AS chat_id
      FROM chats c
      WHERE c.is_group_chat = 0
        AND EXISTS (SELECT 1 FROM chat_users cu WHERE cu.chat_id = c.id AND cu.user_id = @userA)
        AND EXISTS (SELECT 1 FROM chat_users cu WHERE cu.chat_id = c.id AND cu.user_id = @userB)
        AND NOT EXISTS (
          SELECT 1 FROM chat_users cu
          WHERE cu.chat_id = c.id
            AND cu.user_id NOT IN (@userA, @userB)
        )
      ORDER BY c.id DESC;
    `);

      if (existing.recordset?.length) {
        await tx.commit();
        return existing.recordset[0].chat_id;
      }

      // tạo chat mới
      const createReq = tx.request();
      createReq.input("name", sql.NVarChar(100), `Chat 1-1: U${low} & U${high}`);

      const created = await createReq.query(`
      INSERT INTO chats (name, is_group_chat, created_at, updated_at)
      OUTPUT INSERTED.id AS chat_id
      VALUES (@name, 0, GETDATE(), GETDATE());
    `);

      const chatId = created.recordset[0].chat_id;

      // add 2 user vào chat_users
      const insReq = tx.request();
      insReq.input("chatId", sql.Int, chatId);
      insReq.input("userA", sql.Int, userA);
      insReq.input("userB", sql.Int, userB);

      await insReq.query(`
      INSERT INTO chat_users (chat_id, user_id, is_admin) VALUES (@chatId, @userA, 0);
      INSERT INTO chat_users (chat_id, user_id, is_admin) VALUES (@chatId, @userB, 0);
    `);

      await tx.commit();
      return chatId;
    } catch (e) {
      try { await tx.rollback(); } catch { }
      throw e;
    }
  },


};