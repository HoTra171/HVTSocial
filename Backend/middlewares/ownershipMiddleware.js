import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Ownership & Permission Middleware
 * Kiểm tra quyền sở hữu và quyền truy cập resources
 */

/**
 * Check if user owns the post
 */
export const checkPostOwnership = async (req, res, next) => {
  try {
    const postId = req.params.id || req.params.postId;
    const userId = req.user.id;

    const result = await pool
      .request()
      .input('postId', postId)
      .query('SELECT user_id FROM posts WHERE id = @postId AND deleted_at IS NULL');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const post = result.recordset[0];

    if (post.user_id !== userId) {
      logger.warn({
        message: 'Unauthorized post modification attempt',
        userId,
        postId,
        ownerId: post.user_id,
      });

      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this post',
      });
    }

    // Store post owner in request for later use
    req.postOwnerId = post.user_id;
    next();
  } catch (error) {
    logger.error('Check post ownership error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Check if user owns the comment
 */
export const checkCommentOwnership = async (req, res, next) => {
  try {
    const commentId = req.params.id || req.params.commentId;
    const userId = req.user.id;

    const result = await pool
      .request()
      .input('commentId', commentId)
      .query('SELECT user_id FROM comments WHERE id = @commentId');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const comment = result.recordset[0];

    if (comment.user_id !== userId) {
      logger.warn({
        message: 'Unauthorized comment modification attempt',
        userId,
        commentId,
        ownerId: comment.user_id,
      });

      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this comment',
      });
    }

    req.commentOwnerId = comment.user_id;
    next();
  } catch (error) {
    logger.error('Check comment ownership error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Check if user can view the post (based on privacy settings)
 */
export const checkPostAccess = async (req, res, next) => {
  try {
    const postId = req.params.id || req.params.postId;
    const userId = req.user.id;

    // Get post with privacy info
    const postResult = await pool
      .request()
      .input('postId', postId)
      .query(`
        SELECT user_id, privacy
        FROM posts
        WHERE id = @postId AND deleted_at IS NULL
      `);

    if (postResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const post = postResult.recordset[0];

    // Owner can always view their own post
    if (post.user_id === userId) {
      return next();
    }

    // Public posts can be viewed by anyone
    if (post.privacy === 'public') {
      return next();
    }

    // Private posts can only be viewed by owner
    if (post.privacy === 'private') {
      logger.warn({
        message: 'Unauthorized private post access attempt',
        userId,
        postId,
        ownerId: post.user_id,
      });

      return res.status(403).json({
        success: false,
        message: 'This post is private',
      });
    }

    // Friends-only posts require friendship check
    if (post.privacy === 'friends') {
      const friendshipResult = await pool
        .request()
        .input('userId1', userId)
        .input('userId2', post.user_id)
        .query(`
          SELECT id
          FROM friendships
          WHERE (
            (user_id = @userId1 AND friend_id = @userId2) OR
            (user_id = @userId2 AND friend_id = @userId1)
          )
          AND status = 'accepted'
        `);

      if (friendshipResult.recordset.length === 0) {
        logger.warn({
          message: 'Unauthorized friends-only post access attempt',
          userId,
          postId,
          ownerId: post.user_id,
        });

        return res.status(403).json({
          success: false,
          message: 'This post is only visible to friends',
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Check post access error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Check if user is part of the chat
 */
export const checkChatAccess = async (req, res, next) => {
  try {
    const chatId = req.params.id || req.params.chatId;
    const userId = req.user.id;

    const result = await pool
      .request()
      .input('chatId', chatId)
      .input('userId', userId)
      .query(`
        SELECT id
        FROM chats
        WHERE id = @chatId
        AND (user_a_id = @userId OR user_b_id = @userId)
      `);

    if (result.recordset.length === 0) {
      logger.warn({
        message: 'Unauthorized chat access attempt',
        userId,
        chatId,
      });

      return res.status(403).json({
        success: false,
        error: 'forbidden',
        message: 'You do not have access to this chat',
      });
    }

    next();
  } catch (error) {
    logger.error('Check chat access error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Check if user owns the message
 */
export const checkMessageOwnership = async (req, res, next) => {
  try {
    const messageId = req.params.id || req.params.messageId;
    const userId = req.user.id;

    const result = await pool
      .request()
      .input('messageId', messageId)
      .query('SELECT sender_id FROM messages WHERE id = @messageId');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    const message = result.recordset[0];

    if (message.sender_id !== userId) {
      logger.warn({
        message: 'Unauthorized message modification attempt',
        userId,
        messageId,
        senderId: message.sender_id,
      });

      return res.status(403).json({
        success: false,
        message: 'You can only edit/delete your own messages',
      });
    }

    next();
  } catch (error) {
    logger.error('Check message ownership error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Check if user can modify profile (self only)
 */
export const checkProfileOwnership = (req, res, next) => {
  const targetUserId = parseInt(req.params.id || req.params.userId);
  const currentUserId = req.user.id;

  if (targetUserId !== currentUserId) {
    logger.warn({
      message: 'Unauthorized profile modification attempt',
      currentUserId,
      targetUserId,
    });

    return res.status(403).json({
      success: false,
      message: 'You can only modify your own profile',
    });
  }

  next();
};

/**
 * Check admin role (for future use)
 */
export const checkAdminRole = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn({
      message: 'Unauthorized admin action attempt',
      userId: req.user?.id,
    });

    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
};

/**
 * Check if user can perform action (rate limiting by action type)
 */
export const checkActionLimit = (actionType, maxPerHour = 100) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const key = `action:${actionType}:user:${userId}`;

      const { cache } = await import('../config/redis.js');
      const count = await cache.incr(key);

      if (count === 1) {
        // First action, set TTL
        await cache.expire(key, 3600); // 1 hour
      }

      if (count > maxPerHour) {
        logger.warn({
          message: 'Action rate limit exceeded',
          userId,
          actionType,
          count,
          maxPerHour,
        });

        return res.status(429).json({
          success: false,
          message: `Too many ${actionType} actions. Please try again later.`,
        });
      }

      next();
    } catch (error) {
      logger.error('Check action limit error:', error);
      // Continue without rate limit on error
      next();
    }
  };
};

export default {
  checkPostOwnership,
  checkCommentOwnership,
  checkPostAccess,
  checkChatAccess,
  checkMessageOwnership,
  checkProfileOwnership,
  checkAdminRole,
  checkActionLimit,
};
