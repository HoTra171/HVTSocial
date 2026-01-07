import { PostService } from '../services/postService.js';
import { pool } from '../config/db.js';
import sql from 'mssql';

// GET /api/posts
export const getPosts = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const cursor = req.query.cursor || null;

    const viewerId = req.user.id;
    const result = await PostService.getFeed(cursor, limit, viewerId);

    // Result now contains { posts, nextCursor }
    res.json(result);
  } catch (err) {
    console.error('getFeedPosts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/posts/:id
export const getPost = async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const viewerId = req.user.id;
    const post = await PostService.getPostById(postId, viewerId);
    res.json(post);
  } catch (err) {
    console.error('getPost error:', err);

    if (err.message === 'Bài viết không tồn tại') {
      return res.status(404).json({ message: err.message });
    }

    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/posts/user/:userId
export const getPostsByUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const viewerId = req.user.id;
    const posts = await PostService.getPostsByUser(userId, viewerId);
    res.json(posts);
  } catch (err) {
    console.error('getPostsByUser error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/posts
export const createPost = async (req, res) => {
  try {
    console.log('createPost req.user:', req.user);
    const user_id = req.user.id;
    if (!user_id) {
      return res.status(401).json({ success: false, message: 'Không xác định được người dùng.' });
    }
    const { content } = req.body;
    const media = req.body.media || null;

    // Validate status để tránh lỗi CHECK constraint trong DB
    const allowedStatus = new Set(['public', 'friends', 'private']);
    const statusRaw = (req.body.status || 'public').toString().trim();
    const status = allowedStatus.has(statusRaw) ? statusRaw : 'public';

    const newPost = await PostService.createPost(user_id, content, media, status);
    res.json({
      message: 'Đăng bài thành công',
      post: newPost,
    });
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// PUT /api/posts/:id
export const updatePost = async (req, res) => {
  const db = await pool;

  const postId = req.params.id;
  const userId = req.user.id;
  const { content, media, status } = req.body;

  const allowedStatus = new Set(['public', 'friends', 'private']);
  const statusRaw = String(status || 'public')
    .trim()
    .toLowerCase();
  const safeStatus = allowedStatus.has(statusRaw) ? statusRaw : 'public';

  // Kiểm tra quyền sở hữu bài viết
  const checkOwnership = await db
    .request()
    .input('postId', sql.Int, postId)
    .input('userId', sql.Int, userId).query(`
      SELECT id FROM posts 
      WHERE id = @postId AND user_id = @userId
    `);

  if (checkOwnership.recordset.length === 0) {
    return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bài viết này' });
  }

  // Cập nhật bài viết
  const result = await db
    .request()
    .input('postId', sql.Int, postId)
    .input('content', sql.NVarChar(sql.MAX), content)
    .input('mediaUrl', sql.NVarChar(sql.MAX), media)
    .input('visibility', sql.NVarChar(10), safeStatus).query(`
    UPDATE posts
    SET
      content = @content,
      media_url = @mediaUrl,
      visibility = @visibility,
      updated_at = GETDATE()
    OUTPUT INSERTED.*
    WHERE id = @postId
  `);

  return res.json(result.recordset[0]);
};

// DELETE /api/posts/:id

export const deletePost = async (req, res) => {
  try {
    // const postId = Number(req.params.id);
    // const userId = req.user?.id || req.body.user_id;

    const postId = Number(req.params.id);
    const userId = Number(req.user?.id || req.body.user_id);

    const result = await PostService.deletePost(postId, userId);

    res.json(result);
  } catch (err) {
    console.error('deletePost error:', err);

    if (err.message.includes('không có quyền')) {
      return res.status(403).json({ message: err.message });
    }

    res.status(500).json({ message: 'Server error' });
  }
};
