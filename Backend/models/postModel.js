// models/postModel.js
import { pool } from '../config/db.js';
import sql from 'mssql';

export const PostModel = {
  // FEED POSTS - Cursor-based pagination
  async getAllPosts(cursor, limit = 10, viewerId) {
    const db = await pool;
    const request = db.request();

    request.input('limit', sql.Int, limit);
    request.input('viewerId', sql.Int, viewerId);

    // Build WHERE clause dynamically
    let cursorCondition = '';
    if (cursor) {
      request.input('cursor', sql.DateTime, new Date(cursor));
      cursorCondition = 'p.created_at < @cursor AND';
    }

    const result = await request.query(`
      SELECT TOP (@limit)
        p.id,
        p.content,
        p.media_url,
        p.media_type,
        p.created_at,
        p.visibility AS status,

        u.id        AS user_id,
        u.full_name,
        u.username,
        u.avatar,

        (SELECT COUNT(*) FROM likes WHERE post_id = p.id)     AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id)  AS comments_count,
        0 AS share_count

      FROM posts p
      JOIN users u ON u.id = p.user_id

      WHERE
        ${cursorCondition}
        (
          p.visibility = 'public'
          OR p.user_id = @viewerId
          OR (
            p.visibility = 'friends'
            AND EXISTS (
              SELECT 1
              FROM friendships f
              WHERE f.status = 'accepted'
              AND (
                (f.user_id = @viewerId AND f.friend_id = p.user_id)
                OR
                (f.friend_id = @viewerId AND f.user_id = p.user_id)
              )
            )
          )
        )

      ORDER BY p.created_at DESC
    `);

    return result.recordset;
  },

  //  POSTS BY USER (PROFILE)
  async getPostsByUser(userId, viewerId) {
    const db = await pool;

    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('viewerId', sql.Int, viewerId)
      .query(`
      SELECT
        p.id,
        p.content,
        p.media_url,
        p.media_type,
        p.created_at,
        p.visibility AS status,

        u.id        AS user_id,
        u.full_name,
        u.username,
        u.avatar,

        (SELECT COUNT(*) FROM likes WHERE post_id = p.id)     AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id)  AS comments_count,
        0 AS share_count

      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE
        p.user_id = @userId
        AND (
          p.visibility = 'public'
          OR p.user_id = @viewerId
          OR (
            p.visibility = 'friends'
            AND EXISTS (
              SELECT 1
              FROM friendships f
              WHERE f.status = 'accepted'
                AND (
                  (f.user_id = @viewerId AND f.friend_id = p.user_id)
                  OR
                  (f.friend_id = @viewerId AND f.user_id = p.user_id)
                )
            )
          )
        )
      ORDER BY p.created_at DESC
    `);

    return result.recordset;
  },
};
