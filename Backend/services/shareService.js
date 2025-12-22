import { pool } from "../config/db.js";
import sql from "mssql";

export const ShareService = {
  /**
   * Chia sẻ một bài viết
   */
  async sharePost(userId, postId, content = null) {
    const db = await pool;

    // Kiểm tra bài viết gốc có tồn tại không
    const checkPost = await db
      .request()
      .input("postId", sql.Int, postId)
      .query(`
        SELECT id FROM posts WHERE id = @postId
      `);

    if (checkPost.recordset.length === 0) {
      throw new Error("Bài viết không tồn tại");
    }

    // Tạo bài share mới
    const result = await db
      .request()
      .input("userId", sql.Int, userId)
      .input("postId", sql.Int, postId)
      .input("content", sql.NVarChar(sql.MAX), content)
      .query(`
        INSERT INTO posts (user_id, content, shared_post_id)
        OUTPUT INSERTED.*
        VALUES (@userId, @content, @postId)
      `);

    return result.recordset[0];
  },

  /**
   * Lấy bài viết được share (với thông tin bài gốc)
   */
  async getSharedPost(shareId) {
    const db = await pool;

    const result = await db
      .request()
      .input("shareId", sql.Int, shareId)
      .query(`
        SELECT 
          -- Bài share
          p.id,
          p.content,
          p.created_at,
          
          -- User share
          u.id AS user_id,
          u.full_name,
          u.username,
          u.avatar,
          
          -- Bài gốc
          op.id AS original_post_id,
          op.content AS original_content,
          op.media AS original_media,
          op.created_at AS original_created_at,
          
          -- User bài gốc
          ou.id AS original_user_id,
          ou.full_name AS original_full_name,
          ou.username AS original_username,
          ou.avatar AS original_avatar,
          
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
          
        FROM posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN posts op ON op.id = p.shared_post_id
        LEFT JOIN users ou ON ou.id = op.user_id
        WHERE p.id = @shareId
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const row = result.recordset[0];

    return {
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      likes_count: row.likes_count,
      comments_count: row.comments_count,
      user: {
        id: row.user_id,
        full_name: row.full_name,
        username: row.username,
        profile_picture: row.avatar,
      },
      originalPost: row.original_post_id
        ? {
            id: row.original_post_id,
            content: row.original_content,
            image_urls: row.original_media
              ? row.original_media.split(";")
              : [],
            createdAt: row.original_created_at,
            user: {
              id: row.original_user_id,
              full_name: row.original_full_name,
              username: row.original_username,
              profile_picture: row.original_avatar,
            },
          }
        : null,
    };
  },

  /**
   * Lấy danh sách người đã share một bài viết
   */
  async getPostShares(postId) {
    const db = await pool;

    const result = await db
      .request()
      .input("postId", sql.Int, postId)
      .query(`
        SELECT 
          p.id AS share_id,
          p.content AS share_content,
          p.created_at AS shared_at,
          
          u.id AS user_id,
          u.full_name,
          u.username,
          u.avatar
          
        FROM posts p
        JOIN users u ON u.id = p.user_id
        WHERE p.shared_post_id = @postId
        ORDER BY p.created_at DESC
      `);

    return result.recordset;
  },

  /**
   * Xóa bài share
   */
  async deleteShare(shareId, userId) {
    const db = await pool;

    // Kiểm tra quyền sở hữu
    const checkOwnership = await db
      .request()
      .input("shareId", sql.Int, shareId)
      .input("userId", sql.Int, userId)
      .query(`
        SELECT id FROM posts 
        WHERE id = @shareId AND user_id = @userId AND shared_post_id IS NOT NULL
      `);

    if (checkOwnership.recordset.length === 0) {
      throw new Error("Bạn không có quyền xóa bài share này");
    }

    await db
      .request()
      .input("shareId", sql.Int, shareId)
      .query(`
        DELETE FROM posts WHERE id = @shareId
      `);

    return { success: true, message: "Đã xóa bài share" };
  },
};
