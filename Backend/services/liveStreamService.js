import { pool } from '../config/db.js';
import sql from 'mssql';

const isPostgres = process.env.DB_DRIVER === 'postgres' || !!process.env.DATABASE_URL;

export const LiveStreamService = {
  /**
   * Tạo và bắt đầu một buổi Live Stream mới
   */
  async createStream(userId, { title, description = '', thumbnail_url = null }) {
    const db = await pool;

    // 1. Tự động kết thúc bất kỳ luồng live cũ nào đang chạy của user này
    if (isPostgres) {
      await db.query(
        `UPDATE livestreams SET status = 'ended', ended_at = NOW() WHERE user_id = $1 AND status = 'live'`,
        [userId]
      );

      const res = await db.query(
        `INSERT INTO livestreams (user_id, title, description, thumbnail_url, status, started_at)
         VALUES ($1, $2, $3, $4, 'live', NOW())
         RETURNING *`,
        [userId, title, description, thumbnail_url]
      );
      const stream = res.rows[0];

      // Lấy thông tin host
      const userRes = await db.query(
        `SELECT id, full_name, username, avatar FROM users WHERE id = $1`,
        [userId]
      );
      stream.user = userRes.rows[0];
      return stream;
    } else {
      await db.request().input('userId', sql.Int, userId).query(`
        UPDATE livestreams SET status = 'ended', ended_at = GETDATE()
        WHERE user_id = @userId AND status = 'live';
      `);

      const res = await db
        .request()
        .input('userId', sql.Int, userId)
        .input('title', sql.NVarChar, title)
        .input('description', sql.NVarChar, description || '')
        .input('thumbnailUrl', sql.NVarChar, thumbnail_url)
        .query(`
          INSERT INTO livestreams (user_id, title, description, thumbnail_url, status, started_at)
          OUTPUT INSERTED.*
          VALUES (@userId, @title, @description, @thumbnailUrl, 'live', GETDATE());
        `);
      const stream = res.recordset[0];

      const userRes = await db
        .request()
        .input('userId', sql.Int, userId)
        .query('SELECT id, full_name, username, avatar FROM users WHERE id = @userId');
      stream.user = userRes.recordset[0];
      return stream;
    }
  },

  /**
   * Lấy danh sách tất cả các buổi Live Stream đang trực tiếp
   */
  async getActiveStreams() {
    const db = await pool;
    const query = `
      SELECT 
        l.id,
        l.user_id,
        l.title,
        l.description,
        l.thumbnail_url,
        l.status,
        l.viewer_count,
        l.peak_viewers,
        l.total_reactions,
        l.started_at,
        u.full_name,
        u.username,
        u.avatar
      FROM livestreams l
      JOIN users u ON u.id = l.user_id
      WHERE l.status = 'live'
      ORDER BY l.started_at DESC
    `;

    if (isPostgres) {
      const res = await db.query(query);
      return res.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        thumbnail_url: row.thumbnail_url,
        status: row.status,
        viewer_count: row.viewer_count,
        peak_viewers: row.peak_viewers,
        total_reactions: row.total_reactions,
        started_at: row.started_at,
        user: {
          id: row.user_id,
          full_name: row.full_name,
          username: row.username,
          avatar: row.avatar,
        },
      }));
    } else {
      const res = await db.request().query(query);
      return res.recordset.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        thumbnail_url: row.thumbnail_url,
        status: row.status,
        viewer_count: row.viewer_count,
        peak_viewers: row.peak_viewers,
        total_reactions: row.total_reactions,
        started_at: row.started_at,
        user: {
          id: row.user_id,
          full_name: row.full_name,
          username: row.username,
          avatar: row.avatar,
        },
      }));
    }
  },

  /**
   * Lấy chi tiết buổi Live Stream theo ID
   */
  async getStreamById(streamId) {
    const db = await pool;
    const query = `
      SELECT 
        l.id,
        l.user_id,
        l.title,
        l.description,
        l.thumbnail_url,
        l.status,
        l.viewer_count,
        l.peak_viewers,
        l.total_reactions,
        l.started_at,
        l.ended_at,
        u.full_name,
        u.username,
        u.avatar
      FROM livestreams l
      JOIN users u ON u.id = l.user_id
      WHERE l.id = ${isPostgres ? '$1' : '@streamId'}
    `;

    let row = null;
    if (isPostgres) {
      const res = await db.query(query, [streamId]);
      row = res.rows[0];
    } else {
      const res = await db.request().input('streamId', sql.Int, streamId).query(query);
      row = res.recordset[0];
    }

    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail_url: row.thumbnail_url,
      status: row.status,
      viewer_count: row.viewer_count,
      peak_viewers: row.peak_viewers,
      total_reactions: row.total_reactions,
      started_at: row.started_at,
      ended_at: row.ended_at,
      user: {
        id: row.user_id,
        full_name: row.full_name,
        username: row.username,
        avatar: row.avatar,
      },
    };
  },

  /**
   * Kiểm tra user có đang phát trực tiếp không
   */
  async getActiveStreamByUser(userId) {
    const db = await pool;
    const query = `
      SELECT id, title, started_at, viewer_count, status
      FROM livestreams
      WHERE user_id = ${isPostgres ? '$1' : '@userId'} AND status = 'live'
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (isPostgres) {
      const res = await db.query(query, [userId]);
      return res.rows[0] || null;
    } else {
      const res = await db
        .request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT TOP 1 id, title, started_at, viewer_count, status
          FROM livestreams
          WHERE user_id = @userId AND status = 'live'
          ORDER BY started_at DESC
        `);
      return res.recordset[0] || null;
    }
  },

  /**
   * Kết thúc buổi phát trực tiếp
   */
  async endStream(streamId, userId) {
    const db = await pool;
    const query = `
      UPDATE livestreams
      SET status = 'ended', ended_at = ${isPostgres ? 'NOW()' : 'GETDATE()'}
      WHERE id = ${isPostgres ? '$1' : '@streamId'} AND user_id = ${isPostgres ? '$2' : '@userId'}
    `;

    if (isPostgres) {
      await db.query(query, [streamId, userId]);
    } else {
      await db
        .request()
        .input('streamId', sql.Int, streamId)
        .input('userId', sql.Int, userId)
        .query(query);
    }
    return true;
  },

  /**
   * Cập nhật số lượng người xem
   */
  async updateViewerCount(streamId, count) {
    const db = await pool;
    const query = isPostgres
      ? `UPDATE livestreams
         SET viewer_count = $1, peak_viewers = GREATEST(peak_viewers, $1)
         WHERE id = $2`
      : `UPDATE livestreams
         SET viewer_count = @count,
             peak_viewers = CASE WHEN @count > peak_viewers THEN @count ELSE peak_viewers END
         WHERE id = @streamId`;

    if (isPostgres) {
      await db.query(query, [count, streamId]);
    } else {
      await db
        .request()
        .input('count', sql.Int, count)
        .input('streamId', sql.Int, streamId)
        .query(query);
    }
  },

  /**
   * Thêm bình luận vào buổi Live
   */
  async addComment(streamId, userId, content) {
    const db = await pool;
    if (isPostgres) {
      const res = await db.query(
        `INSERT INTO livestream_comments (livestream_id, user_id, content, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [streamId, userId, content]
      );
      const comment = res.rows[0];
      const userRes = await db.query(
        `SELECT id, full_name, username, avatar FROM users WHERE id = $1`,
        [userId]
      );
      comment.user = userRes.rows[0];
      return comment;
    } else {
      const res = await db
        .request()
        .input('streamId', sql.Int, streamId)
        .input('userId', sql.Int, userId)
        .input('content', sql.NVarChar, content)
        .query(`
          INSERT INTO livestream_comments (livestream_id, user_id, content, created_at)
          OUTPUT INSERTED.*
          VALUES (@streamId, @userId, @content, GETDATE());
        `);
      const comment = res.recordset[0];
      const userRes = await db
        .request()
        .input('userId', sql.Int, userId)
        .query('SELECT id, full_name, username, avatar FROM users WHERE id = @userId');
      comment.user = userRes.recordset[0];
      return comment;
    }
  },

  /**
   * Lấy danh sách bình luận của buổi Live
   */
  async getComments(streamId, limit = 50) {
    const db = await pool;
    const query = `
      SELECT 
        c.id,
        c.livestream_id,
        c.user_id,
        c.content,
        c.created_at,
        u.full_name,
        u.username,
        u.avatar
      FROM livestream_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.livestream_id = ${isPostgres ? '$1' : '@streamId'}
      ORDER BY c.created_at ASC
    `;

    if (isPostgres) {
      const res = await db.query(query, [streamId]);
      return res.rows.map((r) => ({
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        user: {
          id: r.user_id,
          full_name: r.full_name,
          username: r.username,
          avatar: r.avatar,
        },
      }));
    } else {
      const res = await db.request().input('streamId', sql.Int, streamId).query(query);
      return res.recordset.map((r) => ({
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        user: {
          id: r.user_id,
          full_name: r.full_name,
          username: r.username,
          avatar: r.avatar,
        },
      }));
    }
  },
};

export default LiveStreamService;
