/**
 * Chat Model - PostgreSQL Version
 * Native PostgreSQL syntax with LATERAL JOINs and $1 parameters
 */
import db from '../config/db.js';

export const ChatModelPG = {
  // Get user's chats with last message and unread count
  async getUserChats(userId) {
    const query = `
WITH MyChats AS (
  SELECT chat_id
  FROM chat_users
  WHERE user_id = $1
),
Base AS (
  SELECT 
    c.id AS chat_id,
    c.is_group_chat,
    c.name AS chat_name,

    CASE WHEN c.is_group_chat = false THEN u.id ELSE NULL END AS target_id,
    CASE WHEN c.is_group_chat = false THEN u.full_name ELSE c.name END AS target_name,
    CASE WHEN c.is_group_chat = false THEN u.username ELSE NULL END AS target_username,

    CASE 
      WHEN c.is_group_chat = false THEN u.avatar
      ELSE uLast.avatar
    END AS avatar,

    lmDetail.content      AS last_message,
    lmDetail.message_type AS last_message_type,
    lmDetail.media_url    AS last_media_url,

    COALESCE(uc.unread_count, 0) AS unread_count,

    COALESCE(lmDetail.created_at, c.updated_at, c.created_at) AS last_time

  FROM chats c
  JOIN MyChats mc ON mc.chat_id = c.id

  LEFT JOIN LATERAL (
    SELECT
      m.sender_id,
      m.content,
      m.message_type,
      m.media_url,
      m.created_at
    FROM messages m
    WHERE m.chat_id = c.id
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT 1
  ) lmDetail ON true

  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS unread_count
    FROM messages m
    WHERE m.chat_id = c.id
      AND m.sender_id <> $1
      AND m.status IN ('sent', 'delivered')
  ) uc ON true

  LEFT JOIN LATERAL (
    SELECT cu.user_id AS other_user_id
    FROM chat_users cu
    WHERE cu.chat_id = c.id
      AND cu.user_id <> $1
      AND c.is_group_chat = false
    LIMIT 1
  ) other ON true

  LEFT JOIN users u ON u.id = other.other_user_id
  LEFT JOIN users uLast ON uLast.id = lmDetail.sender_id
),
Ranked AS (
  SELECT
    *,
    CASE 
      WHEN is_group_chat = false
        THEN ROW_NUMBER() OVER (PARTITION BY target_id ORDER BY last_time DESC, chat_id DESC)
      ELSE 1
    END AS rn
  FROM Base
)
SELECT *
FROM Ranked
WHERE is_group_chat = true OR rn = 1
ORDER BY last_time DESC, chat_id DESC;
`;

    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // Get unread count
  async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) AS unread_count
      FROM messages m
      JOIN chat_users cu ON cu.chat_id = m.chat_id
      WHERE cu.user_id = $1
        AND m.sender_id <> $1
        AND m.status IN ('sent', 'delivered');
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0].unread_count;
  },

  // Get messages by chat
  async getMessagesByChat(chatId) {
    const query = `
      SELECT 
        m.id,
        m.chat_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.media_url,
        m.status,
        m.created_at,
        m.reply_to_id,
        m.reply_content,
        m.reply_type,
        m.reply_sender,
        u.full_name AS sender_name,
        u.avatar AS sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC;
    `;

    const result = await db.query(query, [chatId]);
    // Return SQL Server compatible format
    return { recordset: result.rows };
  },

  // Check if user has access to chat
  async checkChatAccess(userId, chatId) {
    const query = `SELECT 1 FROM chat_users WHERE user_id = $1 AND chat_id = $2`;
    const result = await db.query(query, [userId, chatId]);
    return result.rows.length > 0;
  },

  // Send message
  async sendMessage(payload) {
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
      reply_sender
    } = payload;

    const query = `
      INSERT INTO messages (
        chat_id, sender_id, content, message_type, media_url, duration, 
        reply_to_id, reply_content, reply_type, reply_sender
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const values = [
      chatId,
      senderId,
      content,
      message_type,
      media_url,
      duration,
      reply_to_id,
      reply_content,
      reply_type,
      reply_sender
    ];

    const result = await db.query(query, values);
    return { recordset: result.rows };
  },

  // Tạo nhóm chat mới
  async createGroupChat(creatorId, name, memberIds = [], avatar = null) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1. Tạo chat
      const chatRes = await client.query(
        `INSERT INTO chats (name, is_group_chat, avatar, created_by, created_at, updated_at)
         VALUES ($1, true, $2, $3, NOW(), NOW())
         RETURNING id, name, is_group_chat, avatar, created_by, created_at, updated_at;`,
        [name, avatar, creatorId]
      );
      const newChat = chatRes.rows[0];
      const chatId = newChat.id;

      // 2. Thêm người tạo làm admin
      await client.query(
        `INSERT INTO chat_users (chat_id, user_id, is_admin, joined_at)
         VALUES ($1, $2, true, NOW())
         ON CONFLICT (chat_id, user_id) DO NOTHING;`,
        [chatId, creatorId]
      );

      // 3. Thêm các thành viên khác
      const uniqueMembers = Array.from(new Set(memberIds.map(Number))).filter(
        (id) => id && id !== creatorId
      );

      for (const mId of uniqueMembers) {
        await client.query(
          `INSERT INTO chat_users (chat_id, user_id, is_admin, joined_at)
           VALUES ($1, $2, false, NOW())
           ON CONFLICT (chat_id, user_id) DO NOTHING;`,
          [chatId, mId]
        );
      }

      // 4. Lấy tên người tạo để ghi tin nhắn hệ thống
      const userRes = await client.query('SELECT full_name FROM users WHERE id = $1', [creatorId]);
      const creatorName = userRes.rows[0]?.full_name || 'Người dùng';

      await client.query(
        `INSERT INTO messages (chat_id, sender_id, content, message_type, status, created_at)
         VALUES ($1, $2, $3, 'system', 'delivered', NOW());`,
        [chatId, creatorId, `${creatorName} đã tạo nhóm "${name}"`]
      );

      await client.query('COMMIT');
      return newChat;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  // Lấy chi tiết nhóm và thành viên
  async getGroupDetails(chatId) {
    const chatRes = await db.query(
      `SELECT c.id, c.name, c.avatar, c.is_group_chat, c.created_by, c.created_at,
              u.full_name AS creator_name
       FROM chats c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = $1;`,
      [chatId]
    );

    if (chatRes.rows.length === 0) return null;

    const membersRes = await db.query(
      `SELECT u.id, u.full_name, u.username, u.avatar, cu.is_admin, cu.joined_at
       FROM chat_users cu
       JOIN users u ON u.id = cu.user_id
       WHERE cu.chat_id = $1
       ORDER BY cu.is_admin DESC, u.full_name ASC;`,
      [chatId]
    );

    return {
      ...chatRes.rows[0],
      members: membersRes.rows,
    };
  },

  // Thêm thành viên vào nhóm
  async addGroupMembers(chatId, memberIds = [], actorId) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const addedUsers = [];
      for (const uId of memberIds) {
        const id = Number(uId);
        if (!id) continue;
        const res = await client.query(
          `INSERT INTO chat_users (chat_id, user_id, is_admin, joined_at)
           VALUES ($1, $2, false, NOW())
           ON CONFLICT (chat_id, user_id) DO NOTHING
           RETURNING user_id;`,
          [chatId, id]
        );
        if (res.rows.length > 0) {
          const userRow = await client.query('SELECT full_name FROM users WHERE id = $1', [id]);
          if (userRow.rows[0]) addedUsers.push(userRow.rows[0].full_name);
        }
      }

      if (addedUsers.length > 0) {
        const actorRes = await client.query('SELECT full_name FROM users WHERE id = $1', [actorId]);
        const actorName = actorRes.rows[0]?.full_name || 'Người dùng';
        const content = `${actorName} đã thêm ${addedUsers.join(', ')} vào nhóm`;

        await client.query(
          `INSERT INTO messages (chat_id, sender_id, content, message_type, status, created_at)
           VALUES ($1, $2, $3, 'system', 'delivered', NOW());`,
          [chatId, actorId, content]
        );
        await client.query('UPDATE chats SET updated_at = NOW() WHERE id = $1', [chatId]);
      }

      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  // Xóa thành viên hoặc Rời nhóm
  async removeGroupMember(chatId, userId, actorId) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const targetRes = await client.query('SELECT full_name FROM users WHERE id = $1', [userId]);
      const targetName = targetRes.rows[0]?.full_name || 'Người dùng';

      const actorRes = await client.query('SELECT full_name FROM users WHERE id = $1', [actorId]);
      const actorName = actorRes.rows[0]?.full_name || 'Người dùng';

      await client.query('DELETE FROM chat_users WHERE chat_id = $1 AND user_id = $2', [
        chatId,
        userId,
      ]);

      const content =
        Number(userId) === Number(actorId)
          ? `${targetName} đã rời khỏi nhóm`
          : `${actorName} đã xóa ${targetName} khỏi nhóm`;

      await client.query(
        `INSERT INTO messages (chat_id, sender_id, content, message_type, status, created_at)
         VALUES ($1, $2, $3, 'system', 'delivered', NOW());`,
        [chatId, actorId, content]
      );
      await client.query('UPDATE chats SET updated_at = NOW() WHERE id = $1', [chatId]);

      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  // Cập nhật tên nhóm / avatar nhóm
  async updateGroupInfo(chatId, actorId, { name, avatar }) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const updates = [];
      const values = [];
      let idx = 1;

      if (name !== undefined) {
        updates.push(`name = $${idx++}`);
        values.push(name);
      }
      if (avatar !== undefined) {
        updates.push(`avatar = $${idx++}`);
        values.push(avatar);
      }

      updates.push(`updated_at = NOW()`);
      values.push(chatId);

      await client.query(`UPDATE chats SET ${updates.join(', ')} WHERE id = $${idx}`, values);

      if (name) {
        const actorRes = await client.query('SELECT full_name FROM users WHERE id = $1', [actorId]);
        const actorName = actorRes.rows[0]?.full_name || 'Người dùng';

        await client.query(
          `INSERT INTO messages (chat_id, sender_id, content, message_type, status, created_at)
           VALUES ($1, $2, $3, 'system', 'delivered', NOW());`,
          [chatId, actorId, `${actorName} đã đổi tên nhóm thành "${name}"`]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
};
