import { cache } from '../config/redis.js';
import logger from '../config/logger.js';

/**
 * Cache middleware
 * Cache responses để giảm tải database
 */

/**
 * Generic cache middleware
 * @param {number} ttl - Time to live in seconds
 * @param {function} keyGenerator - Function to generate cache key from req
 */
export const cacheResponse = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator
        ? keyGenerator(req)
        : `cache:${req.originalUrl}:user:${req.user?.id || 'guest'}`;

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug({
          message: 'Cache HIT',
          key: cacheKey,
          userId: req.user?.id,
        });

        return res.json(cachedData);
      }

      // Cache MISS - continue to controller
      logger.debug({
        message: 'Cache MISS',
        key: cacheKey,
        userId: req.user?.id,
      });

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode === 200 || res.statusCode === 201) {
          cache.set(cacheKey, data, ttl).catch((err) => {
            logger.error('Failed to cache response:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Continue without cache on error
      next();
    }
  };
};

/**
 * Cache suggested friends
 * Key: suggestions:user:{userId}
 * TTL: 1 hour
 */
export const cacheSuggestedFriends = cacheResponse(
  3600,
  (req) => `suggestions:user:${req.user.id}`
);

/**
 * Cache user profile
 * Key: profile:user:{userId}
 * TTL: 5 minutes
 */
export const cacheUserProfile = cacheResponse(
  300,
  (req) => `profile:user:${req.params.id || req.params.userId}`
);

/**
 * Cache unread notification count
 * Key: unread:notifications:user:{userId}
 * TTL: 30 seconds (short TTL for real-time feel)
 */
export const cacheUnreadCount = cacheResponse(
  30,
  (req) => `unread:notifications:user:${req.user.id}`
);

/**
 * Cache unread message count
 * Key: unread:messages:user:{userId}
 * TTL: 30 seconds
 */
export const cacheUnreadMessages = cacheResponse(
  30,
  (req) => `unread:messages:user:${req.user.id}`
);

/**
 * Cache user's posts
 * Key: posts:user:{userId}:page:{page}
 * TTL: 2 minutes
 */
export const cacheUserPosts = cacheResponse(
  120,
  (req) => `posts:user:${req.params.userId}:page:${req.query.page || 1}`
);

/**
 * Cache post details
 * Key: post:{postId}
 * TTL: 5 minutes
 */
export const cachePostDetails = cacheResponse(
  300,
  (req) => `post:${req.params.id}`
);

/**
 * Cache user's friends list
 * Key: friends:user:{userId}
 * TTL: 10 minutes
 */
export const cacheFriendsList = cacheResponse(
  600,
  (req) => `friends:user:${req.user.id}`
);

/**
 * Cache stories (24h content)
 * Key: stories:user:{userId}
 * TTL: 5 minutes
 */
export const cacheStories = cacheResponse(
  300,
  (req) => `stories:user:${req.user.id}`
);

/**
 * Cache middleware with user-specific invalidation
 * When user updates their data, invalidate their cache
 */
export const invalidateUserCache = async (userId) => {
  try {
    const patterns = [
      `profile:user:${userId}`,
      `posts:user:${userId}:*`,
      `friends:user:${userId}`,
      `suggestions:user:${userId}`,
      `unread:*:user:${userId}`,
    ];

    for (const pattern of patterns) {
      await cache.delPattern(pattern);
    }

    logger.info({
      message: 'User cache invalidated',
      userId,
    });
  } catch (error) {
    logger.error('Failed to invalidate user cache:', error);
  }
};

/**
 * Invalidate post-related cache
 */
export const invalidatePostCache = async (postId, userId) => {
  try {
    await cache.del(`post:${postId}`);
    await cache.delPattern(`posts:user:${userId}:*`);

    logger.info({
      message: 'Post cache invalidated',
      postId,
      userId,
    });
  } catch (error) {
    logger.error('Failed to invalidate post cache:', error);
  }
};

/**
 * Invalidate notification cache
 */
export const invalidateNotificationCache = async (userId) => {
  try {
    await cache.delPattern(`unread:notifications:user:${userId}`);

    logger.debug({
      message: 'Notification cache invalidated',
      userId,
    });
  } catch (error) {
    logger.error('Failed to invalidate notification cache:', error);
  }
};

/**
 * Invalidate message cache
 */
export const invalidateMessageCache = async (userId) => {
  try {
    await cache.delPattern(`unread:messages:user:${userId}`);

    logger.debug({
      message: 'Message cache invalidated',
      userId,
    });
  } catch (error) {
    logger.error('Failed to invalidate message cache:', error);
  }
};

export default {
  cacheResponse,
  cacheSuggestedFriends,
  cacheUserProfile,
  cacheUnreadCount,
  cacheUnreadMessages,
  cacheUserPosts,
  cachePostDetails,
  cacheFriendsList,
  cacheStories,
  invalidateUserCache,
  invalidatePostCache,
  invalidateNotificationCache,
  invalidateMessageCache,
};
