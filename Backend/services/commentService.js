import { pool } from '../config/db.js';
import sql from 'mssql';

export const CommentService = {
  /**
   * Lấy comment cấp 1 của post (comment_parent IS NULL)
   */
  async getCommentsByPost(postId, sort = 'newest') {
    const db = await pool;

    const isRelevant = sort === 'relevant';
    const orderByClause = isRelevant
      ? 'ORDER BY replies_count DESC, likes_count DESC, c.created_at DESC'
      : 'ORDER BY c.created_at DESC';

    const result = await db.request().input('postId', sql.Int, postId).query(`
        SELECT 
          c.id,
          c.post_id,
          c.user_id,
          c.content,
          c.image_url,
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
        ${orderByClause}
      `);

    return result.recordset.map((row) => ({
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      content: row.content,
      image_url: row.image_url,
      comment_parent: row.comment_parent,
      created_at: row.created_at,
      replies_count: Number(row.replies_count || 0),
      likes_count: Number(row.likes_count || 0),
      user: {
        id: row.user_id,
        full_name: row.full_name,
        username: row.username,
        avatar: row.avatar,
      },
    }));
  },

  /**
   * Lấy replies của 1 comment
   */
  async getReplies(commentId) {
    const db = await pool;

    const result = await db.request().input('commentId', sql.Int, commentId).query(`
        SELECT 
          c.id,
          c.post_id,
          c.user_id,
          c.content,
          c.image_url,
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

    return result.recordset.map((row) => ({
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      content: row.content,
      image_url: row.image_url,
      comment_parent: row.comment_parent,
      created_at: row.created_at,
      likes_count: Number(row.likes_count || 0),
      user: {
        id: row.user_id,
        full_name: row.full_name,
        username: row.username,
        avatar: row.avatar,
      },
    }));
  },

  /**
   * Tạo comment (comment hoặc reply, kèm ảnh nếu có)
   */
  async createComment(postId, userId, content, commentParent = null, imageUrl = null) {
    const db = await pool;

    const result = await db
      .request()
      .input('postId', sql.Int, postId)
      .input('userId', sql.Int, userId)
      .input('content', sql.NVarChar(sql.MAX), content || '')
      .input('commentParent', sql.Int, commentParent)
      .input('imageUrl', sql.NVarChar(sql.MAX), imageUrl).query(`
        INSERT INTO comments (post_id, user_id, content, parent_comment_id, image_url, created_at)
        OUTPUT INSERTED.*
        VALUES (@postId, @userId, @content, @commentParent, @imageUrl, NOW())
      `);

    const newComment = result.recordset[0];

    // Lấy thông tin user để frontend render ngay
    const userResult = await db.request().input('userId', sql.Int, userId).query(`
        SELECT id, full_name, username, avatar
        FROM users
        WHERE id = @userId
      `);

    const user = userResult.recordset[0];

    return {
      id: newComment.id,
      post_id: newComment.post_id,
      user_id: newComment.user_id,
      content: newComment.content,
      image_url: newComment.image_url,
      comment_parent: newComment.parent_comment_id,
      created_at: newComment.created_at,
      likes_count: 0,
      replies_count: 0,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        avatar: user.avatar,
      },
    };
  },

  /**
   * Sửa comment (chỉ chủ comment)
   */
  async updateComment(commentId, userId, content) {
    const db = await pool;

    const checkResult = await db
      .request()
      .input('commentId', sql.Int, commentId)
      .input('userId', sql.Int, userId).query(`
        SELECT id
        FROM comments
        WHERE id = @commentId AND user_id = @userId
      `);

    if (checkResult.recordset.length === 0) {
      throw new Error('Unauthorized or comment not found');
    }

    await db
      .request()
      .input('commentId', sql.Int, commentId)
      // FIX: NVARCHAR(MAX) + updated_at
      .input('content', sql.NVarChar(sql.MAX), content).query(`
        UPDATE comments
        SET content = @content, updated_at = NOW()
        WHERE id = @commentId
      `);

    return { success: true };
  },

  /**
   * Xóa comment (chủ comment hoặc chủ bài viết)
   * - Xóa likes trước
   * - Xóa toàn bộ cây replies (nhiều cấp) để tránh lỗi FK
   */
  async deleteComment(commentId, userId) {
    const db = await pool;

    const meta = await db.request().input('commentId', sql.Int, commentId).query(`
        SELECT c.id, c.user_id AS comment_owner_id, p.user_id AS post_owner_id
        FROM comments c
        JOIN posts p ON p.id = c.post_id
        WHERE c.id = @commentId
      `);

    if (meta.recordset.length === 0) {
      throw new Error('Unauthorized or comment not found');
    }

    const { comment_owner_id, post_owner_id } = meta.recordset[0];
    if (userId !== comment_owner_id && userId !== post_owner_id) {
      throw new Error('Unauthorized or comment not found');
    }

    if (process.env.DATABASE_URL) {
      // PostgreSQL: Sử dụng tính năng ON DELETE CASCADE đã được định nghĩa trong schema
      // Tự động xóa likes và replies (đệ quy)
      await db
        .request()
        .input('commentId', sql.Int, commentId)
        .query(`DELETE FROM comments WHERE id = @commentId`);
    } else {
      // MSSQL: Xử lý xóa thủ công đệ quy (do giới hạn cycles hoặc chưa setup cascade)
      await db.request().input('commentId', sql.Int, commentId).query(`
          ;WITH tree AS (
            SELECT id FROM comments WHERE id = @commentId
            UNION ALL
            SELECT c.id
            FROM comments c
            JOIN tree t ON c.parent_comment_id = t.id
          )
          DELETE FROM likes
          WHERE comment_id IN (SELECT id FROM tree)
          OPTION (MAXRECURSION 1000);

          ;WITH tree AS (
            SELECT id FROM comments WHERE id = @commentId
            UNION ALL
            SELECT c.id
            FROM comments c
            JOIN tree t ON c.parent_comment_id = t.id
          )
          DELETE FROM comments
          WHERE id IN (SELECT id FROM tree)
          OPTION (MAXRECURSION 1000);
        `);
    }

    return { success: true };
  },

  /**
   * Lấy 1 comment theo id (phục vụ notify reply)
   */
  async getCommentById(commentId) {
    const db = await pool;

    const result = await db.request().input('commentId', sql.Int, commentId).query(`
        SELECT id, post_id, user_id, parent_comment_id AS comment_parent, content, created_at
        FROM comments
        WHERE id = @commentId
      `);

    return result.recordset[0] || null;
  },
};
