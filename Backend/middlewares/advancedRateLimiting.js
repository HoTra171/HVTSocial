import rateLimit from 'express-rate-limit';
import sql from 'mssql';
import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Advanced Rate Limiting
 * Per-user rate limiting with database tracking and response headers
 */

const getPool = async () => {
  const db = await pool;
  if (!db) throw new Error('Database connection failed');
  return db;
};

/* ================= PER-USER RATE LIMITING ================= */

/**
 * Create per-user rate limiter
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max requests per window
 * @param {string} options.message - Error message
 * @param {boolean} options.skipSuccessfulRequests - Skip successful requests
 */
export const createUserRateLimiter = (options) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
    endpoint = null,
  } = options;

  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const ipAddress = req.ip;
      const requestEndpoint = endpoint || req.path;

      // If no user, fall back to IP-based limiting
      if (!userId) {
        return ipBasedLimiter(req, res, next);
      }

      const db = await getPool();

      // Get or create rate limit tracking
      const now = new Date();
      const windowStart = new Date(now.getTime() - windowMs);

      // Check existing rate limit record
      const result = await db
        .request()
        .input('userId', sql.Int, userId)
        .input('ipAddress', sql.NVarChar, ipAddress)
        .input('endpoint', sql.NVarChar, requestEndpoint)
        .input('windowStart', sql.DateTime, windowStart).query(`
          SELECT *
          FROM rate_limit_tracking
          WHERE user_id = @userId
            AND endpoint = @endpoint
            AND window_end > NOW()
          ORDER BY window_start DESC
        `);

      let rateLimitRecord = result.recordset[0];

      if (!rateLimitRecord) {
        // Create new rate limit record
        const windowEnd = new Date(now.getTime() + windowMs);

        await db
          .request()
          .input('userId', sql.Int, userId)
          .input('ipAddress', sql.NVarChar, ipAddress)
          .input('endpoint', sql.NVarChar, requestEndpoint)
          .input('requestCount', sql.Int, 1)
          .input('windowStart', sql.DateTime, now)
          .input('windowEnd', sql.DateTime, windowEnd).query(`
            INSERT INTO rate_limit_tracking
              (user_id, ip_address, endpoint, request_count, window_start, window_end)
            VALUES
              (@userId, @ipAddress, @endpoint, @requestCount, @windowStart, @windowEnd)
          `);

        // Set rate limit headers
        setRateLimitHeaders(res, 1, max, windowEnd);

        return next();
      }

      // Check if rate limit exceeded
      if (rateLimitRecord.request_count >= max) {
        logger.warn({
          message: 'Rate limit exceeded',
          userId,
          endpoint: requestEndpoint,
          count: rateLimitRecord.request_count,
          max,
        });

        // Set rate limit headers
        setRateLimitHeaders(
          res,
          rateLimitRecord.request_count,
          max,
          new Date(rateLimitRecord.window_end),
          true
        );

        return res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil((new Date(rateLimitRecord.window_end) - now) / 1000),
          limit: max,
          current: rateLimitRecord.request_count,
        });
      }

      // Increment request count
      await db.request().input('id', sql.Int, rateLimitRecord.id).query(`
          UPDATE rate_limit_tracking
          SET request_count = request_count + 1
          WHERE id = @id
        `);

      // Set rate limit headers
      setRateLimitHeaders(
        res,
        rateLimitRecord.request_count + 1,
        max,
        new Date(rateLimitRecord.window_end)
      );

      next();
    } catch (error) {
      logger.error({
        message: 'Error in user rate limiter',
        error: error.message,
      });

      // Fail open - allow request if rate limiting fails
      next();
    }
  };
};

/**
 * Set rate limit response headers
 */
function setRateLimitHeaders(res, current, limit, resetTime, exceeded = false) {
  res.set({
    'X-RateLimit-Limit': limit,
    'X-RateLimit-Remaining': exceeded ? 0 : Math.max(0, limit - current),
    'X-RateLimit-Reset': Math.ceil(resetTime.getTime() / 1000),
    'X-RateLimit-Used': current,
  });

  if (exceeded) {
    res.set('Retry-After', Math.ceil((resetTime - new Date()) / 1000));
  }
}

/**
 * IP-based rate limiter (fallback for non-authenticated requests)
 */
const ipBasedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      message: 'IP rate limit exceeded',
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

/* ================= ENDPOINT-SPECIFIC RATE LIMITERS ================= */

/**
 * Auth endpoints rate limiter (stricter)
 */
export const authRateLimiter = createUserRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later.',
  endpoint: 'auth',
});

/**
 * API rate limiter (general)
 */
export const apiRateLimiter = createUserRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many API requests, please try again later.',
});

/**
 * Post creation rate limiter
 */
export const postCreationRateLimiter = createUserRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 posts per hour
  message: 'Too many posts created, please wait before posting again.',
  endpoint: 'create_post',
});

/**
 * Comment creation rate limiter
 */
export const commentRateLimiter = createUserRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 comments per 15 minutes
  message: 'Too many comments, please slow down.',
  endpoint: 'create_comment',
});

/**
 * Upload rate limiter
 */
export const uploadRateLimiter = createUserRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: 'Too many uploads, please wait before uploading again.',
  endpoint: 'upload',
});

/**
 * Search rate limiter
 */
export const searchRateLimiter = createUserRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 searches per minute
  message: 'Too many search requests, please wait.',
  endpoint: 'search',
});

/**
 * Friend request rate limiter
 */
export const friendRequestRateLimiter = createUserRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 50, // 50 friend requests per day
  message: 'Too many friend requests sent today.',
  endpoint: 'friend_request',
});

/* ================= ADMIN UTILITIES ================= */

/**
 * Get rate limit status for user
 */
export const getUserRateLimitStatus = async (userId) => {
  const db = await getPool();

  const result = await db.request().input('userId', sql.Int, userId).query(`
      SELECT
        endpoint,
        request_count,
        window_start,
        window_end
      FROM rate_limit_tracking
      WHERE user_id = @userId
        AND window_end > NOW()
      ORDER BY window_start DESC
    `);

  return result.recordset;
};

/**
 * Reset rate limit for user
 */
export const resetUserRateLimit = async (userId, endpoint = null) => {
  const db = await getPool();

  let query = `
    DELETE FROM rate_limit_tracking
    WHERE user_id = @userId
  `;

  const request = db.request().input('userId', sql.Int, userId);

  if (endpoint) {
    query += ' AND endpoint = @endpoint';
    request.input('endpoint', sql.NVarChar, endpoint);
  }

  await request.query(query);

  logger.info({
    message: 'Rate limit reset',
    userId,
    endpoint: endpoint || 'all',
  });

  return {
    success: true,
    message: 'Rate limit reset successfully',
  };
};

/**
 * Clean expired rate limit records
 */
export const cleanExpiredRateLimits = async () => {
  const db = await getPool();

  const result = await db.request().query(`
    DELETE FROM rate_limit_tracking
    WHERE window_end < DATEADD(hour, -1, NOW())
  `);

  logger.info({
    message: 'Expired rate limits cleaned',
    deletedRows: result.rowsAffected[0],
  });

  return {
    deleted: result.rowsAffected[0],
  };
};

/* ================= EXPORTS ================= */

export default {
  createUserRateLimiter,
  authRateLimiter,
  apiRateLimiter,
  postCreationRateLimiter,
  commentRateLimiter,
  uploadRateLimiter,
  searchRateLimiter,
  friendRequestRateLimiter,
  getUserRateLimitStatus,
  resetUserRateLimit,
  cleanExpiredRateLimits,
};
