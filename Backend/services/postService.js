import { pool } from "../config/db.js";
import { PostModel } from "../models/postModel.js";
import sql from "mssql";

const formatPost = (row) => ({
  id: row.id,
  content: row.content,
  image_urls: row.media ? row.media.split(";") : [],
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
  async getFeed(page, limit, viewerId) {
    const rows = await PostModel.getAllPosts(page, limit, viewerId);
    return rows.map(formatPost);
  },

  async getPostsByUser(userId, viewerId) {
    const rows = await PostModel.getPostsByUser(userId, viewerId);
    return rows.map(formatPost);
  },

  async getPostById(postId, viewerId) {
    const db = await pool;

    const result = await db
      .request()
      .input("postId", sql.Int, postId)
      .input("viewerId", sql.Int, viewerId)
      .query(`
        SELECT
          p.id,
          p.content,
          p.media_url AS media,
          p.created_at,
          p.status,
          p.shared_post_id,

          u.id        AS user_id,
          u.full_name,
          u.username,
          u.avatar,

          (SELECT COUNT(*) FROM likes WHERE post_id = p.id)     AS likes_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id)  AS comments_count,
          (SELECT COUNT(*) FROM posts sp WHERE sp.shared_post_id = p.id) AS share_count

        FROM posts p
        JOIN users u ON u.id = p.user_id
        WHERE p.id = @postId
      `);

    if (result.recordset.length === 0) {
      throw new Error("Bài viết không tồn tại");
    }

    return formatPost(result.recordset[0]);
  },

  async createPost(userId, content, media, status) {
    const db = await pool;
    const result = await db
      .request()
      .input("user_id", userId)
      .input("content", content)
      .input("mediaUrl", media)
      .input("status", sql.NVarChar(10), status)
      .query(`
        INSERT INTO posts (user_id, content, media_url, status)
        OUTPUT INSERTED.*
        VALUES (@user_id, @content, @mediaUrl, @status)
      `);

    return result.recordset[0];
  },

  // postService.js
  async deletePost(postId, userId) {
    const db = await pool;
    const tx = new sql.Transaction(db);

    await tx.begin();
    try {
      const req = new sql.Request(tx);
      req.input("postId", sql.Int, postId);
      req.input("userId", sql.Int, userId);

      // check quyền sở hữu
      const own = await req.query(`
      SELECT id FROM posts
      WHERE id = @postId AND user_id = @userId
    `);

      if (own.recordset.length === 0) {
        throw new Error("Bạn không có quyền xóa bài viết này");
      }

      // gỡ các post share đang trỏ tới post này (FK NO ACTION)
      await req.query(`
      UPDATE posts
      SET shared_post_id = NULL
      WHERE shared_post_id = @postId
    `);

      // dọn các bảng FK NO ACTION trước
      await req.query(`DELETE FROM saved_posts     WHERE post_id = @postId`);
      await req.query(`DELETE FROM post_reactions  WHERE post_id = @postId`);
      await req.query(`DELETE FROM post_tags       WHERE post_id = @postId`);
      await req.query(`DELETE FROM notifications   WHERE post_id = @postId`);

      // likes/comments đang CASCADE theo schema nên không bắt buộc,
      // nhưng để chắc chắn vẫn có thể xóa tay:
      await req.query(`DELETE FROM likes    WHERE post_id = @postId`);
      await req.query(`DELETE FROM comments WHERE post_id = @postId`);

      // xóa post
      await req.query(`DELETE FROM posts WHERE id = @postId`);

      await tx.commit();
      return { success: true, message: "Xóa bài viết thành công" };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

};
