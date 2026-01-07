import { pool } from "../config/db.js";
import sql from "mssql";

/* ================= GET STORIES - VỚI PRIVACY ================= */
export const getStories = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const db = await pool;

    // CHỈ LẤY STORIES MÀ USER CÓ QUYỀN XEM
    const result = await db.request()
      .input("userId", sql.Int, currentUserId)
      .query(`
        SELECT 
          s.id AS story_id,
          s.media_type,
          s.media_url,
          s.content AS caption,
          s.background_color,
          s.created_at,
          s.expires_at,
          u.id AS user_id,
          u.full_name,
          u.username,
          u.avatar
        FROM stories s
        JOIN users u ON u.id = s.user_id
        WHERE s.expires_at > GETDATE()
          AND (
            s.privacy = 'public'
            OR s.user_id = @userId
            OR (s.privacy = 'friends' AND EXISTS (
              SELECT 1 FROM friendships f
              WHERE (f.requester_id = @userId AND f.receiver_id = s.user_id AND f.status = 'accepted')
                OR (f.receiver_id = @userId AND f.requester_id = s.user_id AND f.status = 'accepted')
            ))
            OR (s.privacy = 'custom' AND EXISTS (
              SELECT 1 FROM story_viewers sv
              WHERE sv.story_id = s.id AND sv.viewer_id = @userId
            ))
          )
        ORDER BY s.user_id, s.created_at
      `);

    // Group by user
    const map = {};
    for (const row of result.recordset) {
      if (!map[row.user_id]) {
        map[row.user_id] = {
          user: {
            id: row.user_id,
            full_name: row.full_name,
            username: row.username,
            avatar: row.avatar,
          },
          stories: [],
        };
      }

      map[row.user_id].stories.push({
        id: row.story_id,
        media_type: row.media_type,
        media_url: row.media_url,
        music_url: row.music_url,
        caption: row.caption,
        background_color: row.background_color,
        text_color: row.text_color,
        font_size: row.font_size,
        text_position: row.text_position,
        show_frame: row.show_frame,
        sticker: row.sticker,
        sticker_position: row.sticker_position,
        privacy: row.privacy,
        created_at: row.created_at,
        expires_at: row.expires_at,
      });
    }

    res.json(Object.values(map));
  } catch (err) {
    console.error("getStories error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VIEW STORY ================= */
export const viewStory = async (req, res) => {
  try {
    const viewerId = req.user.id;
    const storyId = Number(req.params.id);

    const db = await pool;

    const check = await db.request()
      .input("storyId", sql.Int, storyId)
      .input("viewerId", sql.Int, viewerId)
      .query(`
        SELECT 1 AS viewed
        FROM story_views
        WHERE story_id = @storyId AND viewer_id = @viewerId
      `);

    if (check.recordset.length === 0) {
      await db.request()
        .input("storyId", sql.Int, storyId)
        .input("viewerId", sql.Int, viewerId)
        .query(`
          INSERT INTO story_views (story_id, viewer_id, viewed_at)
          VALUES (@storyId, @viewerId, GETDATE())
        `);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("viewStory error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

/* ================= CREATE STORY - VỚI PRIVACY + STICKER ================= */
export const createStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      media_type = "text",
      media_url = null,
      music_url = null,
      caption = "",
      background_color = null,
      text_color = "#FFFFFF",
      font_size = 24,
      text_position = null,
      show_frame = true,
      sticker = null,
      sticker_position = null,
      privacy = "public", // public, friends, custom
      allowed_viewers = null, // Array of user IDs for custom privacy
      expires_in_hours = 24,
    } = req.body;

    // Validate
    const allowedTypes = ["text", "image", "video"];
    if (!allowedTypes.includes(media_type)) {
      return res.status(400).json({
        success: false,
        message: "media_type không hợp lệ"
      });
    }

    if (media_type !== "text" && !media_url) {
      return res.status(400).json({
        success: false,
        message: "Thiếu media_url cho image/video"
      });
    }

    if (media_type === "text" && !caption) {
      return res.status(400).json({
        success: false,
        message: "Text story phải có caption"
      });
    }

    const db = await pool;

    // INSERT STORY
    const result = await db
      .request()
      .input("userId", sql.Int, userId)
      .input("mediaType", sql.NVarChar, media_type)
      .input("mediaUrl", sql.NVarChar, media_url)
      .input("musicUrl", sql.NVarChar, music_url)
      .input("caption", sql.NVarChar, caption)
      .input("bgColor", sql.NVarChar, background_color)
      .input("textColor", sql.NVarChar, text_color)
      .input("fontSize", sql.Int, Number(font_size))
      .input("textPos", sql.NVarChar, text_position)
      .input("showFrame", sql.Bit, show_frame ? 1 : 0)
      .input("sticker", sql.NVarChar, sticker)
      .input("stickerPos", sql.NVarChar, sticker_position)
      .input("privacy", sql.NVarChar, privacy)
      .input("hours", sql.Int, Number(expires_in_hours))
      .query(`
        INSERT INTO stories (
          user_id, media_type, media_url, music_url, caption, 
          background_color, text_color, font_size, text_position, show_frame,
          sticker, sticker_position, privacy,
          created_at, expires_at
        )
        VALUES (
          @userId, @mediaType, @mediaUrl, @musicUrl, @caption,
          @bgColor, @textColor, @fontSize, @textPos, @showFrame,
          @sticker, @stickerPos, @privacy,
          GETDATE(), DATEADD(HOUR, @hours, GETDATE())
        )
      `);

    const story = result.recordset[0];

    // CUSTOM PRIVACY - INSERT ALLOWED VIEWERS
    if (privacy === 'custom' && allowed_viewers && Array.isArray(allowed_viewers)) {
      for (const viewerId of allowed_viewers) {
        await db.request()
          .input("storyId", sql.Int, story.id)
          .input("viewerId", sql.Int, Number(viewerId))
          .query(`
            INSERT INTO story_viewers (story_id, viewer_id)
            VALUES (@storyId, @viewerId)
          `);
      }
    }

    res.json({
      success: true,
      story
    });
  } catch (err) {
    console.error("createStory error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

/* ================= DELETE STORY ================= */
export const deleteStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const storyId = Number(req.params.id);

    const db = await pool;

    const check = await db.request()
      .input("storyId", sql.Int, storyId)
      .input("userId", sql.Int, userId)
      .query(`
        SELECT id FROM stories
        WHERE id = @storyId AND user_id = @userId
      `);

    if (check.recordset.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa story này"
      });
    }

    await db.request()
      .input("storyId", sql.Int, storyId)
      .query(`DELETE FROM stories WHERE id = @storyId`);

    res.json({ success: true });
  } catch (err) {
    console.error("deleteStory error:", err);
    res.status(500).json({ message: "Server error" });
  }
};