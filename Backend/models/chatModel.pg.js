/**
 * Chat Model - PostgreSQL Version
 * Native PostgreSQL syntax with LATERAL JOINs and $1 parameters
 */
import db from "../config/db.unified.js";

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
};
