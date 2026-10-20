import sql from 'mssql';
import { pool } from '../config/db.js';

export const StoryModel = {
  /**
   * Lấy danh sách stories còn hạn mà user có quyền xem
   */
  async getFeedStories(userId) {
    const db = await pool;
    const result = await db.request().input('userId', sql.Int, userId).query(`
      SELECT 
        s.id AS story_id,
        s.media_type,
        s.media_url,
        s.content AS caption,
        s.background_color,
        s.created_at,
        s.expires_at,
        s.privacy,
        u.id AS user_id,
        u.full_name,
        u.username,
        u.avatar,
        CASE WHEN sv.id IS NOT NULL THEN 1 ELSE 0 END AS is_viewed
      FROM stories s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN story_views sv ON sv.story_id = s.id AND sv.viewer_id = @userId
      WHERE s.expires_at > NOW()
        AND (
          s.privacy = 'public'
          OR s.user_id = @userId
          OR (s.privacy = 'friends' AND EXISTS (
            SELECT 1 FROM friendships f
            WHERE (f.user_id = @userId AND f.friend_id = s.user_id AND f.status = 'accepted')
              OR (f.friend_id = @userId AND f.user_id = s.user_id AND f.status = 'accepted')
          ))
          OR (s.privacy = 'custom' AND EXISTS (
            SELECT 1 FROM story_viewers custom_sv
            WHERE custom_sv.story_id = s.id AND custom_sv.viewer_id = @userId
          ))
        )
      ORDER BY s.user_id, s.created_at
    `);
    return result.recordset || [];
  },

  /**
   * Đánh dấu story đã xem
   */
  async markViewed(storyId, viewerId) {
    const db = await pool;
    const check = await db
      .request()
      .input('storyId', sql.Int, storyId)
      .input('viewerId', sql.Int, viewerId)
      .query('SELECT 1 AS viewed FROM story_views WHERE story_id = @storyId AND viewer_id = @viewerId');

    if (check.recordset.length === 0) {
      await db
        .request()
        .input('storyId', sql.Int, storyId)
        .input('viewerId', sql.Int, viewerId)
        .query('INSERT INTO story_views (story_id, viewer_id, viewed_at) VALUES (@storyId, @viewerId, NOW())');
    }
    return true;
  },

  /**
   * Tạo story mới
   */
  async createStory({
    userId,
    media_type,
    media_url,
    caption,
    background_color,
    privacy,
    expires_in_hours = 24,
    allowed_viewers = [],
  }) {
    const db = await pool;
    const result = await db
      .request()
      .input('userId', sql.Int, userId)
      .input('mediaType', sql.NVarChar, media_type)
      .input('mediaUrl', sql.NVarChar, media_url)
      .input('caption', sql.NVarChar, caption)
      .input('bgColor', sql.NVarChar, background_color)
      .input('privacy', sql.NVarChar, privacy)
      .input('hours', sql.Int, Number(expires_in_hours)).query(`
        INSERT INTO stories (
          user_id, media_type, media_url, content,
          background_color, privacy,
          created_at, expires_at
        )
        OUTPUT INSERTED.*
        VALUES (
          @userId, @mediaType, @mediaUrl, @caption,
          @bgColor, @privacy,
          NOW(), DATEADD(HOUR, @hours, NOW())
        )
      `);

    const story = result.recordset[0];

    if (privacy === 'custom' && Array.isArray(allowed_viewers) && allowed_viewers.length > 0) {
      for (const viewerId of allowed_viewers) {
        await db
          .request()
          .input('storyId', sql.Int, story.id)
          .input('viewerId', sql.Int, viewerId)
          .query('INSERT INTO story_viewers (story_id, viewer_id) VALUES (@storyId, @viewerId)');
      }
    }

    return story;
  },

  /**
   * Xóa story theo ID
   */
  async deleteStory(storyId, userId) {
    const db = await pool;
    const result = await db
      .request()
      .input('storyId', sql.Int, storyId)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM stories WHERE id = @storyId AND user_id = @userId');

    return (result.rowsAffected[0] || 0) > 0;
  },
};

export default StoryModel;
