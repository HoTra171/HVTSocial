import { pool } from "../config/db.js";
import sql from "mssql";

export const SavedPostService = {
  /**
   * Lưu/Bỏ lưu một bài viết
   */
  async toggleSavePost(userId, postId) {
    const db = await pool;

    // Kiểm tra xem đã lưu chưa
    const checkResult = await db
      .request()
      .input("userId", sql.Int, userId)
      .input("postId", sql.Int, postId)
      .query(`
        SELECT * FROM saved_posts 
        WHERE user_id = @userId AND post_id = @postId
      `);

    if (checkResult.recordset.length > 0) {
      // Đã lưu -> Bỏ lưu
      await db
        .request()
        .input("userId", sql.Int, userId)
        .input("postId", sql.Int, postId)
        .query(`
          DELETE FROM saved_posts 
          WHERE user_id = @userId AND post_id = @postId
        `);

      return { action: "unsaved", message: "Đã bỏ lưu bài viết" };
    } else {
      // Chưa lưu -> Lưu
      await db
        .request()
        .input("userId", sql.Int, userId)
        .input("postId", sql.Int, postId)
        .query(`
          INSERT INTO saved_posts (user_id, post_id)
          VALUES (@userId, @postId)
        `);

      return { action: "saved", message: "Đã lưu bài viết" };
    }
  },

  /**
   * Lấy danh sách bài viết đã lưu của user
   */
  async getSavedPosts(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const db = await pool;

    const result = await db
      .request()
      .input("userId", sql.Int, userId)
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit)
      .query(`
        SELECT 
          p.id,
          p.content,
          p.media_url AS media,
          p.created_at,
          
          u.id AS user_id,
          u.full_name,
          u.username,
          u.avatar,
          
          sp.saved_at,
          
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
          (SELECT COUNT(*) FROM shares WHERE post_id = p.id) AS share_count
          
        FROM saved_posts sp
        JOIN posts p ON p.id = sp.post_id
        JOIN users u ON u.id = p.user_id
        WHERE sp.user_id = @userId
        ORDER BY sp.saved_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    return result.recordset.map((row) => ({
      id: row.id,
      content: row.content,
      image_urls: row.media ? row.media.split(";") : [],
      createdAt: row.created_at,
      savedAt: row.saved_at,
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

  /**
   * Kiểm tra user đã lưu post chưa
   */
  async checkUserSavedPost(userId, postId) {
    const db = await pool;

    const result = await db
      .request()
      .input("userId", sql.Int, userId)
      .input("postId", sql.Int, postId)
      .query(`
        SELECT * FROM saved_posts 
        WHERE user_id = @userId AND post_id = @postId
      `);

    return result.recordset.length > 0;
  },
};
