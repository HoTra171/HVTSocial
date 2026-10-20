import sql from 'mssql';
import { pool } from '../config/db.js';

export const CommentModel = {
  /**
   * Lấy bình luận gốc (top-level) của bài viết
   */
  async getCommentsByPost(postId) {
    const db = await pool;
    const result = await db.request().input('postId', sql.Int, postId).query(`
      SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_comment_id AS comment_parent,
        c.created_at,
        u.full_name,
        u.username,
        u.avatar,
        (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id) AS replies_count,
        (SELECT COUNT(*) FROM likes WHERE comment_id = c.id) AS likes_count
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = @postId AND c.parent_comment_id IS NULL
      ORDER BY c.created_at DESC
    `);
    return result.recordset || [];
  },

  /**
   * Lấy danh sách phản hồi của một bình luận
   */
  async getReplies(commentId) {
    const db = await pool;
    const result = await db.request().input('commentId', sql.Int, commentId).query(`
      SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_comment_id AS comment_parent,
        c.created_at,
        u.full_name,
        u.username,
        u.avatar,
        (SELECT COUNT(*) FROM likes WHERE comment_id = c.id) AS likes_count
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.parent_comment_id = @commentId
      ORDER BY c.created_at ASC
    `);
    return result.recordset || [];
  },

  /**
   * Lấy chi tiết bình luận theo ID
   */
  async getById(commentId) {
    const db = await pool;
    const result = await db.request().input('commentId', sql.Int, commentId).query(`
      SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_comment_id AS comment_parent,
        c.created_at,
        u.full_name,
        u.username,
        u.avatar
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = @commentId
    `);
    return result.recordset[0] || null;
  },

  /**
   * Tạo bình luận mới
   */
  async create({ postId, userId, content, parentCommentId = null }) {
    const db = await pool;
    const result = await db
      .request()
      .input('postId', sql.Int, postId)
      .input('userId', sql.Int, userId)
      .input('content', sql.NVarChar, content)
      .input('parentCommentId', sql.Int, parentCommentId).query(`
        INSERT INTO comments (post_id, user_id, content, parent_comment_id, created_at)
        OUTPUT INSERTED.id
        VALUES (@postId, @userId, @content, @parentCommentId, GETDATE())
      `);

    const newId = result.recordset[0]?.id;
    return this.getById(newId);
  },

  /**
   * Cập nhật nội dung bình luận
   */
  async update(commentId, userId, content) {
    const db = await pool;
    await db
      .request()
      .input('commentId', sql.Int, commentId)
      .input('userId', sql.Int, userId)
      .input('content', sql.NVarChar, content).query(`
        UPDATE comments
        SET content = @content
        WHERE id = @commentId AND user_id = @userId
      `);

    return this.getById(commentId);
  },

  /**
   * Xóa bình luận
   */
  async delete(commentId, userId) {
    const db = await pool;
    const result = await db
      .request()
      .input('commentId', sql.Int, commentId)
      .input('userId', sql.Int, userId).query(`
        DELETE FROM comments
        WHERE id = @commentId AND user_id = @userId
      `);

    return (result.rowsAffected[0] || 0) > 0;
  },
};

export default CommentModel;
