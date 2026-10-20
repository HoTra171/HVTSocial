import sql from 'mssql';
import { pool } from '../config/db.js';

export const LikeModel = {
  /**
   * Kiểm tra đã like post chưa
   */
  async findPostLike(userId, postId) {
    const db = await pool;
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('postId', sql.Int, postId)
      .query('SELECT id FROM likes WHERE user_id = @userId AND post_id = @postId');
    return result.recordset[0] || null;
  },

  /**
   * Thêm like vào bài viết
   */
  async addPostLike(userId, postId) {
    const db = await pool;
    await db
      .request()
      .input('userId', sql.Int, userId)
      .input('postId', sql.Int, postId)
      .query('INSERT INTO likes (user_id, post_id) VALUES (@userId, @postId)');
    return true;
  },

  /**
   * Xóa like khỏi bài viết
   */
  async removePostLike(userId, postId) {
    const db = await pool;
    await db
      .request()
      .input('userId', sql.Int, userId)
      .input('postId', sql.Int, postId)
      .query('DELETE FROM likes WHERE user_id = @userId AND post_id = @postId');
    return true;
  },

  /**
   * Kiểm tra đã like comment chưa
   */
  async findCommentLike(userId, commentId) {
    const db = await pool;
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('commentId', sql.Int, commentId)
      .query('SELECT id FROM likes WHERE user_id = @userId AND comment_id = @commentId');
    return result.recordset[0] || null;
  },

  /**
   * Thêm like vào comment
   */
  async addCommentLike(userId, commentId) {
    const db = await pool;
    await db
      .request()
      .input('userId', sql.Int, userId)
      .input('commentId', sql.Int, commentId)
      .query('INSERT INTO likes (user_id, comment_id) VALUES (@userId, @commentId)');
    return true;
  },

  /**
   * Xóa like khỏi comment
   */
  async removeCommentLike(userId, commentId) {
    const db = await pool;
    await db
      .request()
      .input('userId', sql.Int, userId)
      .input('commentId', sql.Int, commentId)
      .query('DELETE FROM likes WHERE user_id = @userId AND comment_id = @commentId');
    return true;
  },

  /**
   * Lấy danh sách users đã like post
   */
  async getPostLikes(postId) {
    const db = await pool;
    const result = await db.request().input('postId', sql.Int, postId).query(`
      SELECT 
        u.id,
        u.full_name,
        u.username,
        u.avatar,
        l.created_at
      FROM likes l
      JOIN users u ON u.id = l.user_id
      WHERE l.post_id = @postId
      ORDER BY l.created_at DESC
    `);
    return result.recordset || [];
  },

  /**
   * Lấy danh sách bài viết mà user đã like
   */
  async getLikedPosts(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const db = await pool;
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit).query(`
        SELECT 
          p.id,
          p.content,
          p.media_url AS media,
          p.created_at,
          u.id AS user_id,
          u.full_name,
          u.username,
          u.avatar,
          l.created_at AS liked_at,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
          (SELECT COUNT(*) FROM shares WHERE post_id = p.id) AS share_count
        FROM likes l
        JOIN posts p ON p.id = l.post_id
        JOIN users u ON u.id = p.user_id
        WHERE l.user_id = @userId
        ORDER BY l.created_at DESC
        LIMIT @limit OFFSET @offset
      `);
    return result.recordset || [];
  },
};

export default LikeModel;
