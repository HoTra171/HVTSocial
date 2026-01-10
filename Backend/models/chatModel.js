import sql from 'mssql';

// Check if using PostgreSQL
const isPostgres = process.env.DB_DRIVER === 'postgres' || !!process.env.DATABASE_URL;

export const ChatModel = {
  // Get user chats
  async getUserChats(pool, userId) {
    if (isPostgres) {
      // PostgreSQL version - simplified query
      const result = await pool.query(`
        WITH MyChats AS (
          SELECT chat_id FROM chat_users WHERE user_id = $1
        )
        SELECT 
          c.id AS chat_id,
          c.is_group_chat,
          c.name AS chat_name,
          CASE WHEN c.is_group_chat = false THEN u.id ELSE NULL END AS target_id,
          CASE WHEN c.is_group_chat = false THEN u.full_name ELSE c.name END AS target_name,
          CASE WHEN c.is_group_chat = false THEN u.avatar ELSE NULL END AS avatar,
          lm.content AS last_message,
          lm.created_at AS last_time,
          COALESCE(uc.unread_count, 0) AS unread_count
        FROM chats c
        JOIN MyChats mc ON mc.chat_id = c.id
        LEFT JOIN LATERAL (
          SELECT m.content, m.created_at
          FROM messages m
          WHERE m.chat_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) lm ON true
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
        ORDER BY last_time DESC NULLS LAST
      `, [userId]);
      return result.rows;
    }

    // MSSQL version
    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input('userId', sql.Int, userId);

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
    CASE WHEN c.is_group_chat = 0 THEN u.avatar ELSE NULL END AS avatar,
    lmDetail.content AS last_message,
    ISNULL(uc.unread_count, 0) AS unread_count,
    COALESCE(lmDetail.created_at, c.updated_at) AS last_time
  FROM chats c
  JOIN MyChats mc ON mc.chat_id = c.id
  OUTER APPLY (
    SELECT TOP (1) m.content, m.created_at
    FROM messages m
    WHERE m.chat_id = c.id
    ORDER BY m.created_at DESC
  ) lmDetail
  OUTER APPLY (
    SELECT COUNT(*) AS unread_count
    FROM messages m
    WHERE m.chat_id = c.id
      AND m.sender_id <> @userId
      AND m.status IN ('sent', 'delivered')
  ) uc
  OUTER APPLY (
    SELECT TOP (1) cu.user_id AS other_user_id
    FROM chat_users cu
    WHERE cu.chat_id = c.id
      AND cu.user_id <> @userId
      AND c.is_group_chat = 0
  ) other
  LEFT JOIN users u ON u.id = other.other_user_id
)
SELECT * FROM Base ORDER BY last_time DESC;`;

    const result = await req.query(query);
    return result.recordset;
  },

  async getUnreadCount(pool, userId) {
    if (isPostgres) {
      const result = await pool.query(`
        SELECT COUNT(*) AS unread_count
        FROM messages m
        JOIN chat_users cu ON cu.chat_id = m.chat_id
        WHERE cu.user_id = $1
          AND m.sender_id <> $1
          AND m.status IN ('sent', 'delivered')
      `, [userId]);
      return parseInt(result.rows[0].unread_count);
    }

    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input('userId', sql.Int, userId);
    const result = await req.query(`
      SELECT COUNT(*) AS unread_count
      FROM messages m
      JOIN chat_users cu ON cu.chat_id = m.chat_id
      WHERE cu.user_id = @userId
        AND m.sender_id <> @userId
        AND m.status IN ('sent', 'delivered')
    `);
    return result.recordset[0].unread_count;
  },

  async getMessagesByChat(pool, chatId) {
    if (isPostgres) {
      const result = await pool.query(`
        SELECT id, chat_id, sender_id, content, status, message_type, media_url, duration, created_at
        FROM messages WHERE chat_id = $1 ORDER BY created_at ASC
      `, [chatId]);
      return { recordset: result.rows };
    }

    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input('chatId', sql.Int, chatId);
    return req.query(`
      SELECT id, chat_id, sender_id, content, status, message_type, media_url, duration, created_at
      FROM messages WHERE chat_id = @chatId ORDER BY created_at ASC
    `);
  },

  async sendMessage(pool, payload) {
    const { chatId, senderId, content, message_type, media_url, duration, reply_to_id, reply_content, reply_type, reply_sender } = payload;

    let finalContent = content || '';
    if (reply_to_id) {
      finalContent = JSON.stringify({
        reply_to: reply_to_id, reply_content: reply_content || '', reply_type: reply_type || 'text', reply_sender: reply_sender || '', message: finalContent
      });
    }

    if (isPostgres) {
      const result = await pool.query(`
        INSERT INTO messages (chat_id, sender_id, content, status, message_type, media_url, duration)
        VALUES ($1, $2, $3, 'sent', $4, $5, $6)
        RETURNING *
      `, [chatId, senderId, finalContent, message_type || 'text', media_url || null, duration || null]);
      await pool.query('UPDATE chats SET updated_at = NOW() WHERE id = $1', [chatId]);
      return { recordset: result.rows };
    }

    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input('chatId', sql.Int, chatId);
    req.input('senderId', sql.Int, senderId);
    req.input('content', sql.NVarChar(sql.MAX), finalContent);
    req.input('message_type', sql.VarChar(20), message_type || 'text');
    req.input('media_url', sql.NVarChar(sql.MAX), media_url || null);
    req.input('duration', sql.Int, duration ?? null);

    return req.query(`
      INSERT INTO messages (chat_id, sender_id, content, status, message_type, media_url, duration)
      OUTPUT INSERTED.*
      VALUES (@chatId, @senderId, @content, 'sent', @message_type, @media_url, @duration);
      UPDATE chats SET updated_at = NOW() WHERE id = @chatId;
    `);
  },

  async markMessagesRead(pool, chatId, userId) {
    if (isPostgres) {
      await pool.query(`
        UPDATE messages SET status = 'read'
        WHERE chat_id = $1 AND sender_id <> $2 AND status <> 'read'
      `, [chatId, userId]);
      return { recordset: [] };
    }

    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input('chatId', sql.Int, chatId);
    req.input('userId', sql.Int, userId);
    return req.query(`
      UPDATE messages SET status = 'read'
      WHERE chat_id = @chatId AND sender_id <> @userId AND status <> 'read'
    `);
  },

  async recallMessage(pool, messageId) {
    if (isPostgres) {
      await pool.query(`
        UPDATE messages SET content = '[recalled]', media_url = NULL, message_type = 'recalled'
        WHERE id = $1
      `, [messageId]);
      return { recordset: [] };
    }

    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input('messageId', sql.Int, messageId);
    return req.query(`
      UPDATE messages SET content = N'[recalled]', media_url = NULL, message_type = 'recalled'
      WHERE id = @messageId
    `);
  },

  async editMessage(pool, messageId, newContent) {
    if (isPostgres) {
      await pool.query('UPDATE messages SET content = $1 WHERE id = $2', [newContent, messageId]);
      return { recordset: [] };
    }

    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input('messageId', sql.Int, messageId);
    req.input('newContent', sql.NVarChar(sql.MAX), newContent);
    return req.query('UPDATE messages SET content = @newContent WHERE id = @messageId');
  },

  async getMessageMeta(pool, messageId) {
    if (isPostgres) {
      const result = await pool.query('SELECT id, chat_id, sender_id FROM messages WHERE id = $1', [messageId]);
      return result.rows[0] || null;
    }

    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input('messageId', sql.Int, messageId);
    const result = await req.query('SELECT id, chat_id, sender_id FROM messages WHERE id = @messageId');
    return result.recordset[0] || null;
  },

  async getChatUsers(pool, chatId) {
    if (isPostgres) {
      const result = await pool.query('SELECT user_id FROM chat_users WHERE chat_id = $1', [chatId]);
      return result.rows;
    }

    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input('chatId', sql.Int, chatId);
    const result = await req.query('SELECT user_id FROM chat_users WHERE chat_id = @chatId');
    return result.recordset;
  },

  async getOrCreateDm(pool, userA, userB) {
    const low = Math.min(userA, userB);
    const high = Math.max(userA, userB);

    if (isPostgres) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Find existing DM
        const existing = await client.query(`
          SELECT c.id AS chat_id
          FROM chats c
          WHERE c.is_group_chat = false
            AND EXISTS (SELECT 1 FROM chat_users cu WHERE cu.chat_id = c.id AND cu.user_id = $1)
            AND EXISTS (SELECT 1 FROM chat_users cu WHERE cu.chat_id = c.id AND cu.user_id = $2)
          LIMIT 1
        `, [userA, userB]);

        if (existing.rows.length > 0) {
          await client.query('COMMIT');
          return existing.rows[0].chat_id;
        }

        // Create new chat
        const created = await client.query(`
          INSERT INTO chats (name, is_group_chat, created_at, updated_at)
          VALUES ($1, false, NOW(), NOW())
          RETURNING id AS chat_id
        `, [`Chat 1-1: U${low} & U${high}`]);

        const chatId = created.rows[0].chat_id;

        await client.query('INSERT INTO chat_users (chat_id, user_id, is_admin) VALUES ($1, $2, false)', [chatId, userA]);
        await client.query('INSERT INTO chat_users (chat_id, user_id, is_admin) VALUES ($1, $2, false)', [chatId, userB]);

        await client.query('COMMIT');
        return chatId;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    // MSSQL version
    if (!pool.connected) await pool.connect();
    const tx = new sql.Transaction(pool);
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      const findReq = tx.request();
      findReq.input('userA', sql.Int, userA);
      findReq.input('userB', sql.Int, userB);

      const existing = await findReq.query(`
        SELECT TOP 1 c.id AS chat_id
        FROM chats c
        WHERE c.is_group_chat = 0
          AND EXISTS (SELECT 1 FROM chat_users cu WHERE cu.chat_id = c.id AND cu.user_id = @userA)
          AND EXISTS (SELECT 1 FROM chat_users cu WHERE cu.chat_id = c.id AND cu.user_id = @userB)
        ORDER BY c.id DESC
      `);

      if (existing.recordset?.length) {
        await tx.commit();
        return existing.recordset[0].chat_id;
      }

      const createReq = tx.request();
      createReq.input('name', sql.NVarChar(100), `Chat 1-1: U${low} & U${high}`);

      const created = await createReq.query(`
        INSERT INTO chats (name, is_group_chat, created_at, updated_at)
        OUTPUT INSERTED.id AS chat_id
        VALUES (@name, 0, NOW(), NOW())
      `);

      const chatId = created.recordset[0].chat_id;

      const insReq = tx.request();
      insReq.input('chatId', sql.Int, chatId);
      insReq.input('userA', sql.Int, userA);
      insReq.input('userB', sql.Int, userB);

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
