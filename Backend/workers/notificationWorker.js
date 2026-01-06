import { notificationQueue } from '../config/queue.js';
import * as notificationService from '../services/notificationService.js';
import logger from '../config/logger.js';

// Note: io instance sẽ được set từ server.js
let io = null;

export const setSocketIO = (ioInstance) => {
  io = ioInstance;
};

/**
 * Notification Worker
 * Xử lý việc tạo notifications không đồng bộ
 * Tránh block requests khi tạo notification
 */

/**
 * Process notification jobs
 */
notificationQueue.process(async (job) => {
  const { type, data } = job.data;

  logger.info({
    message: 'Processing notification job',
    jobId: job.id,
    type,
    userId: data.userId,
  });

  try {
    let notification;

    switch (type) {
      case 'like':
        // User A liked user B's post
        notification = await notificationService.createNotification({
          user_id: data.postOwnerId,
          sender_id: data.likerId,
          type: 'like',
          post_id: data.postId,
        });
        break;

      case 'comment':
        // User A commented on user B's post
        notification = await notificationService.createNotification({
          user_id: data.postOwnerId,
          sender_id: data.commenterId,
          type: 'comment',
          post_id: data.postId,
          comment_id: data.commentId,
        });
        break;

      case 'reply':
        // User A replied to user B's comment
        notification = await notificationService.createNotification({
          user_id: data.commentOwnerId,
          sender_id: data.replierId,
          type: 'reply',
          post_id: data.postId,
          comment_id: data.replyId,
        });
        break;

      case 'friend_request':
        // User A sent friend request to user B
        notification = await notificationService.createNotification({
          user_id: data.recipientId,
          sender_id: data.senderId,
          type: 'friend_request',
        });
        break;

      case 'friend_accept':
        // User A accepted user B's friend request
        notification = await notificationService.createNotification({
          user_id: data.requesterId,
          sender_id: data.accepterId,
          type: 'friend_accept',
        });
        break;

      case 'message':
        // User A sent message to user B
        notification = await notificationService.createNotification({
          user_id: data.recipientId,
          sender_id: data.senderId,
          type: 'message',
          message_id: data.messageId,
        });
        break;

      case 'mention':
        // User A mentioned user B in a post/comment
        notification = await notificationService.createNotification({
          user_id: data.mentionedUserId,
          sender_id: data.mentionerId,
          type: 'mention',
          post_id: data.postId,
          comment_id: data.commentId,
        });
        break;

      case 'share':
        // User A shared user B's post
        notification = await notificationService.createNotification({
          user_id: data.originalPostOwnerId,
          sender_id: data.sharerId,
          type: 'share',
          post_id: data.postId,
        });
        break;

      case 'tag':
        // User A tagged user B in a post
        notification = await notificationService.createNotification({
          user_id: data.taggedUserId,
          sender_id: data.taggerId,
          type: 'tag',
          post_id: data.postId,
        });
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Emit real-time notification via Socket.IO (if connected)
    if (notification && io) {
      io.to(`user_${data.userId || notification.user_id}`).emit('newNotification', notification);

      logger.info({
        message: 'Real-time notification sent',
        userId: notification.user_id,
        type: notification.type,
      });
    }

    return {
      success: true,
      notificationId: notification?.id,
      type,
    };
  } catch (error) {
    logger.error({
      message: 'Notification job failed',
      jobId: job.id,
      type,
      error: error.message,
    });

    throw error; // Will trigger retry
  }
});

/**
 * Helper functions to queue notifications
 */

export const queueLikeNotification = async (postOwnerId, likerId, postId) => {
  // Don't notify if user likes their own post
  if (postOwnerId === likerId) return null;

  return await notificationQueue.add({
    type: 'like',
    data: { postOwnerId, likerId, postId },
  });
};

export const queueCommentNotification = async (postOwnerId, commenterId, postId, commentId) => {
  // Don't notify if user comments on their own post
  if (postOwnerId === commenterId) return null;

  return await notificationQueue.add({
    type: 'comment',
    data: { postOwnerId, commenterId, postId, commentId },
  });
};

export const queueReplyNotification = async (commentOwnerId, replierId, postId, replyId) => {
  // Don't notify if user replies to their own comment
  if (commentOwnerId === replierId) return null;

  return await notificationQueue.add({
    type: 'reply',
    data: { commentOwnerId, replierId, postId, replyId },
  });
};

export const queueFriendRequestNotification = async (recipientId, senderId) => {
  return await notificationQueue.add({
    type: 'friend_request',
    data: { recipientId, senderId },
  });
};

export const queueFriendAcceptNotification = async (requesterId, accepterId) => {
  return await notificationQueue.add({
    type: 'friend_accept',
    data: { requesterId, accepterId },
  });
};

export const queueMessageNotification = async (recipientId, senderId, messageId) => {
  return await notificationQueue.add({
    type: 'message',
    data: { recipientId, senderId, messageId },
  });
};

export const queueMentionNotification = async (mentionedUserId, mentionerId, postId, commentId = null) => {
  return await notificationQueue.add({
    type: 'mention',
    data: { mentionedUserId, mentionerId, postId, commentId },
  });
};

export const queueShareNotification = async (originalPostOwnerId, sharerId, postId) => {
  // Don't notify if user shares their own post
  if (originalPostOwnerId === sharerId) return null;

  return await notificationQueue.add({
    type: 'share',
    data: { originalPostOwnerId, sharerId, postId },
  });
};

export const queueTagNotification = async (taggedUserId, taggerId, postId) => {
  return await notificationQueue.add({
    type: 'tag',
    data: { taggedUserId, taggerId, postId },
  });
};

logger.info('Notification worker started and listening for jobs');

export default {
  queueLikeNotification,
  queueCommentNotification,
  queueReplyNotification,
  queueFriendRequestNotification,
  queueFriendAcceptNotification,
  queueMessageNotification,
  queueMentionNotification,
  queueShareNotification,
  queueTagNotification,
};
