import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis client cho caching
// Support both REDIS_URL (Upstash, Railway) and REDIS_HOST/PORT format
const redisConfig = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    };

export const redisClient = new Redis(redisConfig, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

// Helper functions cho caching
export const cache = {
  /**
   * Get cached value
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set cached value with TTL
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds - Time to live in seconds
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  /**
   * Delete cached value
   * @param {string} key
   */
  async del(key) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern
   */
  async delPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  },

  /**
   * Increment counter
   * @param {string} key
   * @returns {Promise<number>}
   */
  async incr(key) {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  },

  /**
   * Set expiry on existing key
   * @param {string} key
   * @param {number} ttlSeconds
   */
  async expire(key, ttlSeconds) {
    try {
      await redisClient.expire(key, ttlSeconds);
    } catch (error) {
      console.error('Cache expire error:', error);
    }
  },
};

export default redisClient;
