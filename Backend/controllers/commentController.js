import { CommentService } from '../services/commentService.js';
import { emitNotification } from '../helpers/notificationHelper.js';
import { PostService } from '../services/postService.js';

/**
 * POST /api/comments
 * Tạo comment hoặc reply
 */
export const createComment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const postId = Number(req.body.post_id);
    const parentIdRaw = req.body.comment_parent;
    const commentParent =
      parentIdRaw === null || parentIdRaw === undefined || parentIdRaw === ''
        ? null
        : Number(parentIdRaw);

    const text = (req.body.content || '').trim();

    // Validate input để tránh bắn lỗi SQL -> 500
    if (!Number.isFinite(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post_id' });
    }
    if (!text) {
      return res.status(400).json({ message: 'Content is required' });
    }
    if (commentParent !== null && (!Number.isFinite(commentParent) || commentParent <= 0)) {
      return res.status(400).json({ message: 'Invalid comment_parent' });
    }

    // Tạo comment trong DB
    const post = await PostService.getPostById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = await CommentService.createComment(postId, userId, text, commentParent);

    // Tạo notification record; nếu có socket thì emit realtime
    const io = req.app.get('io') || null;

    if (commentParent) {
      const parentComment = await CommentService.getCommentById(commentParent);

      if (!parentComment) return res.status(404).json({ message: 'Parent comment not found' });
      const parentOwnerId = parentComment?.user_id; // chủ comment cha

      if (parentOwnerId && parentOwnerId !== userId) {
        await emitNotification(io, {
          userId: parentOwnerId,
          senderId: userId,
          type: 'reply',
          postId,
          content: text,
        });
      }
    } else {
      // Comment -> notify chủ bài viết
      const postOwnerId = post?.user_id ?? post?.user?.id;

      if (postOwnerId && postOwnerId !== userId) {
        await emitNotification(io, {
          userId: postOwnerId,
          senderId: userId,
          type: 'comment',
          postId,
          content: text,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Đã thêm bình luận',
      comment,
    });
  } catch (err) {
    console.error('createComment error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/comments/post/:postId
 * Lấy comment cấp 1 của post
 */
export const getCommentsByPost = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    if (!Number.isFinite(postId) || postId <= 0) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const comments = await CommentService.getCommentsByPost(postId);
    return res.json(comments);
  } catch (err) {
    console.error('getCommentsByPost error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/comments/:id/replies
 * Lấy replies của 1 comment
 */
export const getReplies = async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    if (!Number.isFinite(commentId) || commentId <= 0) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const replies = await CommentService.getReplies(commentId);
    return res.json(replies);
  } catch (err) {
    console.error('getReplies error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/comments/:id
 * Sửa nội dung comment (chỉ chủ comment)
 */
export const updateComment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const commentId = Number(req.params.id);
    const text = (req.body.content || '').trim();

    if (!Number.isFinite(commentId) || commentId <= 0) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }
    if (!text) {
      return res.status(400).json({ message: 'Content is required' });
    }

    await CommentService.updateComment(commentId, userId, text);
    return res.json({ message: 'Comment updated' });
  } catch (err) {
    console.error('updateComment error:', err);
    if (err.message === 'Unauthorized or comment not found') {
      return res.status(403).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/comments/:id
 * Xóa comment (chủ comment hoặc chủ bài viết)
 */
export const deleteComment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const commentId = Number(req.params.id);
    if (!Number.isFinite(commentId) || commentId <= 0) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    await CommentService.deleteComment(commentId, userId);
    return res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('deleteComment error:', err);
    if (err.message === 'Unauthorized or comment not found') {
      return res.status(403).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};
