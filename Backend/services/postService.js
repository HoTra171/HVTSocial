import { pool } from '../config/db.js';
import { PostModel } from '../models/postModel.js';
import sql from 'mssql';

// Check if using PostgreSQL
const isPostgres = process.env.DB_DRIVER === 'postgres' || !!process.env.DATABASE_URL;

const formatPost = (row) => {
  let poll = null;
  if (row.poll_data) {
    try {
      poll = typeof row.poll_data === 'string' ? JSON.parse(row.poll_data) : row.poll_data;
    } catch {
      poll = null;
    }
  }

  return {
    id: row.id,
    content: row.content,
    image_urls: row.media_url ? row.media_url.split(';') : [],
    createdAt: row.created_at,
    likes_count: row.likes_count,
    comments_count: row.comments_count,
    status: row.status,
    share_count: row.share_count,
    poll,
    user: {
      id: row.user_id,
      full_name: row.full_name,
      username: row.username,
      profile_picture: row.avatar,
    },
  };
};

export const PostService = {
  async getFeed(cursor = null, limit = 10, viewerId) {
    const rows = await PostModel.getAllPosts(cursor, limit, viewerId);
    const posts = rows.map(formatPost);

    let nextCursor = null;
    if (posts.length === limit) {
      nextCursor = posts[posts.length - 1].createdAt;
    }

    return {
      posts,
      nextCursor,
    };
  },

  async getPostsByUser(userId, viewerId) {
    const rows = await PostModel.getPostsByUser(userId, viewerId);
    return rows.map(formatPost);
  },

  async getPostById(postId, viewerId) {
    const db = await pool;

    const result = await db
      .request()
      .input('postId', sql.Int, postId)
      .input('viewerId', sql.Int, viewerId).query(`
        SELECT
          p.id,
          p.content,
          p.media_url,
          p.created_at,
          p.visibility AS status,
          p.poll_data,
          (SELECT COUNT(*) FROM shares WHERE post_id = p.id) AS share_count,

          u.id        AS user_id,
          u.full_name,
          u.username,
          u.avatar,

          (SELECT COUNT(*) FROM likes WHERE post_id = p.id)     AS likes_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id)  AS comments_count


        FROM posts p
        JOIN users u ON u.id = p.user_id
        WHERE p.id = @postId
      `);

    if (result.recordset.length === 0) {
      throw new Error('Bài viết không tồn tại');
    }

    const row = result.recordset[0];
    const isAuthor = viewerId && Number(row.user_id) === Number(viewerId);

    if (!isAuthor) {
      // 1. Bài viết riêng tư
      if (row.status === 'private') {
        throw new Error('Bài viết này là riêng tư');
      }

      // 2. Bài viết hoặc hồ sơ ở chế độ bạn bè
      if (row.status === 'friends' || row.profile_visibility === 'friends') {
        const friendCheck = await db
          .request()
          .input('authorId', sql.Int, row.user_id)
          .input('viewerId', sql.Int, viewerId)
          .query(`
            SELECT 1 FROM friendships
            WHERE status = 'accepted'
              AND ((user_id = @authorId AND friend_id = @viewerId)
                OR (user_id = @viewerId AND friend_id = @authorId))
          `);

        if (friendCheck.recordset.length === 0) {
          throw new Error('Bài viết này chỉ hiển thị với bạn bè');
        }
      }

      // 3. Hồ sơ người đăng ở chế độ riêng tư
      if (row.profile_visibility === 'private') {
        throw new Error('Tài khoản này là riêng tư');
      }
    }

    return formatPost(row);
  },

  async createPost(userId, content, media, status, pollData = null) {
    const db = await pool;
    const pollJson = pollData ? JSON.stringify(pollData) : null;

    const result = await db
      .request()
      .input('user_id', userId)
      .input('content', content)
      .input('mediaUrl', media)
      .input('status', sql.NVarChar(10), status)
      .input('pollData', sql.NVarChar, pollJson)
      .query(`
        INSERT INTO posts (user_id, content, media_url, visibility, poll_data)
        OUTPUT INSERTED.*
        VALUES (@user_id, @content, @mediaUrl, @status, @pollData)
      `);

    return formatPost(result.recordset[0]);
  },

  async votePoll(postId, userId, optionId) {
    const db = await pool;
    const postRes = await db
      .request()
      .input('postId', sql.Int, postId)
      .query('SELECT id, poll_data FROM posts WHERE id = @postId');

    if (postRes.recordset.length === 0) {
      throw new Error('Bài viết không tồn tại');
    }

    const post = postRes.recordset[0];
    if (!post.poll_data) {
      throw new Error('Bài viết không có cuộc thăm dò ý kiến');
    }

    let poll = typeof post.poll_data === 'string' ? JSON.parse(post.poll_data) : post.poll_data;
    if (!poll || !Array.isArray(poll.options)) {
      throw new Error('Dữ liệu thăm dò không hợp lệ');
    }

    // Xóa vote cũ của user trên tất cả các option
    poll.options.forEach((opt) => {
      if (!Array.isArray(opt.votes)) opt.votes = [];
      opt.votes = opt.votes.filter((id) => Number(id) !== Number(userId));
    });

    // Thêm user vào option được chọn
    const targetOpt = poll.options.find((opt) => String(opt.id) === String(optionId));
    if (targetOpt) {
      targetOpt.votes.push(Number(userId));
    }

    const updatedPollJson = JSON.stringify(poll);

    await db
      .request()
      .input('postId', sql.Int, postId)
      .input('pollData', sql.NVarChar, updatedPollJson)
      .query('UPDATE posts SET poll_data = @pollData WHERE id = @postId');

    return poll;
  },

  async updatePost(postId, userId, { content, media, status }) {
    const safeStatus = ['public', 'friends', 'private'].includes(String(status || '').toLowerCase())
      ? String(status).toLowerCase()
      : 'public';

    if (isPostgres) {
      const client = await pool.connect();
      try {
        const ownResult = await client.query(
          'SELECT id, media_url, visibility, content FROM posts WHERE id = $1 AND user_id = $2',
          [postId, userId]
        );
        if (ownResult.rows.length === 0) {
          throw new Error('Bạn không có quyền chỉnh sửa bài viết này');
        }

        const currentPost = ownResult.rows[0];
        const newContent = content !== undefined ? content : currentPost.content;
        const newMedia = media !== undefined ? media : currentPost.media_url;

        await client.query(
          `UPDATE posts
           SET content = $1,
               media_url = $2,
               visibility = $3,
               updated_at = NOW()
           WHERE id = $4`,
          [newContent, newMedia, safeStatus, postId]
        );

        const fullPostQuery = await client.query(
          `SELECT p.*, p.visibility AS status,
                  u.id AS user_id, u.full_name, u.username, u.avatar
           FROM posts p
           JOIN users u ON u.id = p.user_id
           WHERE p.id = $1`,
          [postId]
        );

        return formatPost(fullPostQuery.rows[0] || { ...currentPost, content: newContent, media_url: newMedia, visibility: safeStatus });
      } finally {
        client.release();
      }
    } else {
      const db = await pool;
      const own = await db
        .request()
        .input('postId', sql.Int, postId)
        .input('userId', sql.Int, userId)
        .query('SELECT id, media_url, visibility, content FROM posts WHERE id = @postId AND user_id = @userId');

      if (own.recordset.length === 0) {
        throw new Error('Bạn không có quyền chỉnh sửa bài viết này');
      }

      const currentPost = own.recordset[0];
      const newContent = content !== undefined ? content : currentPost.content;
      const newMedia = media !== undefined ? media : currentPost.media_url;

      await db
        .request()
        .input('postId', sql.Int, postId)
        .input('content', sql.NVarChar(sql.MAX), newContent)
        .input('mediaUrl', sql.NVarChar(sql.MAX), newMedia)
        .input('visibility', sql.NVarChar(20), safeStatus)
        .query(`
          UPDATE posts
          SET content = @content,
              media_url = @mediaUrl,
              visibility = @visibility,
              updated_at = GETDATE()
          WHERE id = @postId
        `);

      const fullPost = await db
        .request()
        .input('postId', sql.Int, postId)
        .query(`
          SELECT p.*, p.visibility AS status,
                 u.id AS user_id, u.full_name, u.username, u.avatar
          FROM posts p
          JOIN users u ON u.id = p.user_id
          WHERE p.id = @postId
        `);

      return formatPost(fullPost.recordset[0]);
    }
  },

  async deletePost(postId, userId) {
    if (isPostgres) {
      // PostgreSQL version - use native transactions
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Check ownership
        const ownResult = await client.query(
          'SELECT id FROM posts WHERE id = $1 AND user_id = $2',
          [postId, userId]
        );
        if (ownResult.rows.length === 0) {
          throw new Error('Bạn không có quyền xóa bài viết này');
        }

        // Clear shared_post_id references if column exists
        try {
          await client.query('UPDATE posts SET shared_post_id = NULL WHERE shared_post_id = $1', [postId]);
        } catch {
          // Column shared_post_id may not exist, safe to continue
        }

        // Delete related data safely
        try { await client.query('DELETE FROM saved_posts WHERE post_id = $1', [postId]); } catch {}
        try { await client.query('DELETE FROM notifications WHERE post_id = $1', [postId]); } catch {}
        try { await client.query('DELETE FROM likes WHERE post_id = $1', [postId]); } catch {}
        try { await client.query('DELETE FROM comments WHERE post_id = $1', [postId]); } catch {}
        try { await client.query('DELETE FROM post_reactions WHERE post_id = $1', [postId]); } catch {}
        try { await client.query('DELETE FROM post_tags WHERE post_id = $1', [postId]); } catch {}

        // Delete the post
        await client.query('DELETE FROM posts WHERE id = $1', [postId]);

        await client.query('COMMIT');
        return { success: true, message: 'Xóa bài viết thành công' };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      // MSSQL version - use sql.Transaction
      const db = await pool;
      const tx = new sql.Transaction(db);

      await tx.begin();
      try {
        const req = new sql.Request(tx);
        req.input('postId', sql.Int, postId);
        req.input('userId', sql.Int, userId);

        const own = await req.query(`
          SELECT id FROM posts WHERE id = @postId AND user_id = @userId
        `);

        if (own.recordset.length === 0) {
          throw new Error('Bạn không có quyền xóa bài viết này');
        }

        await req.query(`UPDATE posts SET shared_post_id = NULL WHERE shared_post_id = @postId`);
        await req.query(`DELETE FROM saved_posts WHERE post_id = @postId`);
        await req.query(`DELETE FROM post_reactions WHERE post_id = @postId`);
        await req.query(`DELETE FROM post_tags WHERE post_id = @postId`);
        await req.query(`DELETE FROM notifications WHERE post_id = @postId`);
        await req.query(`DELETE FROM likes WHERE post_id = @postId`);
        await req.query(`DELETE FROM comments WHERE post_id = @postId`);
        await req.query(`DELETE FROM posts WHERE id = @postId`);

        await tx.commit();
        return { success: true, message: 'Xóa bài viết thành công' };
      } catch (err) {
        await tx.rollback();
        throw err;
      }
    }
  },
};
