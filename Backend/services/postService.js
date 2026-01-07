import { pool } from '../config/db.js';
import { PostModel } from '../models/postModel.js';
import sql from 'mssql';

// Check if using PostgreSQL
const isPostgres = process.env.DB_DRIVER === 'postgres' || !!process.env.DATABASE_URL;

const formatPost = (row) => ({
  id: row.id,
  content: row.content,
  image_urls: row.media_url ? row.media_url.split(';') : [],
  createdAt: row.created_at,
  likes_count: row.likes_count,
  comments_count: row.comments_count,
  status: row.status,
  share_count: row.share_count,
  user: {
    id: row.user_id,
    full_name: row.full_name,
    username: row.username,
    profile_picture: row.avatar,
  },
});

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

    return formatPost(result.recordset[0]);
  },

  async createPost(userId, content, media, status) {
    const db = await pool;
    const result = await db
      .request()
      .input('user_id', userId)
      .input('content', content)
      .input('mediaUrl', media)
      .input('status', sql.NVarChar(10), status).query(`
        INSERT INTO posts (user_id, content, media_url, visibility)
        OUTPUT INSERTED.*
        VALUES (@user_id, @content, @mediaUrl, @status)
      `);

    return result.recordset[0];
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

        // Clear shared_post_id references
        await client.query('UPDATE posts SET shared_post_id = NULL WHERE shared_post_id = $1', [postId]);

        // Delete related data
        await client.query('DELETE FROM saved_posts WHERE post_id = $1', [postId]);
        await client.query('DELETE FROM notifications WHERE post_id = $1', [postId]);
        await client.query('DELETE FROM likes WHERE post_id = $1', [postId]);
        await client.query('DELETE FROM comments WHERE post_id = $1', [postId]);

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
