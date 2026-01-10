import { pool } from '../config/db.js';
import sql from 'mssql';

export const LikeService = {
  /**
   * Like/Unlike một bài viết
   */
  async togglePostLike(userId, postId) {
    const db = await pool;

    // Kiểm tra xem đã like chưa
    const checkResult = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('postId', sql.Int, postId).query(`
        SELECT id FROM likes 
        WHERE user_id = @userId AND post_id = @postId
      `);

    if (checkResult.recordset.length > 0) {
      // Đã like -> Unlike
      await db.request().input('userId', sql.Int, userId).input('postId', sql.Int, postId).query(`
          DELETE FROM likes 
          WHERE user_id = @userId AND post_id = @postId
        `);

      return { action: 'unliked', message: 'Đã bỏ thích' };
    } else {
      // Chưa like -> Like
      await db.request().input('userId', sql.Int, userId).input('postId', sql.Int, postId).query(`
          INSERT INTO likes (user_id, post_id)
          VALUES (@userId, @postId)
        `);

      return { action: 'liked', message: 'Đã thích' };
    }
  },

  /**
   * Like/Unlike một comment
   */
  async toggleCommentLike(userId, commentId) {
    const db = await pool;

    const checkResult = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('commentId', sql.Int, commentId).query(`
        SELECT id FROM likes 
        WHERE user_id = @userId AND comment_id = @commentId
      `);

    if (checkResult.recordset.length > 0) {
      // Unlike
      await db.request().input('userId', sql.Int, userId).input('commentId', sql.Int, commentId)
        .query(`
          DELETE FROM likes 
          WHERE user_id = @userId AND comment_id = @commentId
        `);

      return { action: 'unliked', message: 'Đã bỏ thích comment' };
    } else {
      // Like
      await db.request().input('userId', sql.Int, userId).input('commentId', sql.Int, commentId)
        .query(`
          INSERT INTO likes (user_id, comment_id)
          VALUES (@userId, @commentId)
        `);

      return { action: 'liked', message: 'Đã thích comment' };
    }
  },

  /**
   * Lấy danh sách người đã like một post
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

    return result.recordset;
  },

  /**
   * Kiểm tra user đã like post chưa
   */
  async checkUserLikedPost(userId, postId) {
    const db = await pool;

    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('postId', sql.Int, postId).query(`
        SELECT id FROM likes 
        WHERE user_id = @userId AND post_id = @postId
      `);

    return result.recordset.length > 0;
  },

  /**
   * Lấy danh sách bài viết user đã thích
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

    return result.recordset.map((row) => ({
      id: row.id,
      content: row.content,
      image_urls: row.media ? row.media.split(';') : [],
      createdAt: row.created_at,
      likedAt: row.liked_at,
      likes_count: row.likes_count,
      comments_count: row.comments_count,
      share_count: row.share_count,
      user: {
        id: row.user_id,
        full_name: row.full_name,
        username: row.username,
        profile_picture: row.avatar,
      },
    }));
  },
};
