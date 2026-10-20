import sql from 'mssql';
import { pool } from '../config/db.js';

export const SavedPostModel = {
  /**
   * Kiểm tra bài viết đã được lưu chưa
   */
  async findSaved(userId, postId) {
    const db = await pool;
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('postId', sql.Int, postId)
      .query('SELECT * FROM saved_posts WHERE user_id = @userId AND post_id = @postId');
    return result.recordset[0] || null;
  },

  /**
   * Lưu bài viết
   */
  async save(userId, postId) {
    const db = await pool;
    await db
      .request()
      .input('userId', sql.Int, userId)
      .input('postId', sql.Int, postId)
      .query('INSERT INTO saved_posts (user_id, post_id) VALUES (@userId, @postId)');
    return true;
  },

  /**
   * Bỏ lưu bài viết
   */
  async unsave(userId, postId) {
    const db = await pool;
    await db
      .request()
      .input('userId', sql.Int, userId)
      .input('postId', sql.Int, postId)
      .query('DELETE FROM saved_posts WHERE user_id = @userId AND post_id = @postId');
    return true;
  },

  /**
   * Lấy danh sách bài viết đã lưu
   */
  async getSavedPosts(userId, page = 1, limit = 10) {
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
          sp.created_at AS saved_at,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
          (SELECT COUNT(*) FROM shares WHERE post_id = p.id) AS share_count
        FROM saved_posts sp
        JOIN posts p ON p.id = sp.post_id
        JOIN users u ON u.id = p.user_id
        WHERE sp.user_id = @userId
        ORDER BY sp.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);
    return result.recordset || [];
  },
};

export default SavedPostModel;
