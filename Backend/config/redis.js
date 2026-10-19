import Redis from 'ioredis';
import dotenv from 'dotenv';
import EventEmitter from 'events';

dotenv.config();

// In-Memory Cache Fallback khi không có Redis hoặc Redis bị ngắt kết nối
class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expires && item.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttlSeconds = 300) {
    const expires = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expires });
  }

  async del(key) {
    this.store.delete(key);
  }

  async delPattern(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  async incr(key) {
    const current = await this.get(key);
    const nextVal = (Number(current) || 0) + 1;
    await this.set(key, nextVal, 300);
    return nextVal;
  }

  async expire(key, ttlSeconds) {
    const item = this.store.get(key);
    if (item) {
      item.expires = Date.now() + ttlSeconds * 1000;
    }
  }
}

export const memoryCache = new MemoryCache();

// Kiểm tra xem có cấu hình Redis hay không
const hasExplicitRedis = Boolean(process.env.REDIS_URL || (process.env.REDIS_HOST && process.env.REDIS_HOST !== 'localhost'));
const isLocalDevWithRedis = process.env.REDIS_HOST === 'localhost';
const shouldAttemptRedis = hasExplicitRedis || (isLocalDevWithRedis && process.env.NODE_ENV !== 'production');

let isRedisConnected = false;
let clientInstance = null;

if (shouldAttemptRedis) {
  const redisConfig = process.env.REDIS_URL
    ? process.env.REDIS_URL
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      };

  const isUpstashOrTls = typeof redisConfig === 'string' && redisConfig.startsWith('rediss://');

  const redisOptions = {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    enableReadyCheck: true,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('⚠️ [Redis] Không thể kết nối sau 3 lần thử. Chuyển sang dùng bộ nhớ đệm In-Memory fallback.');
        return null; // Dừng retry để tránh treo và spam lỗi
      }
      return Math.min(times * 1000, 3000);
    },
  };

  if (isUpstashOrTls) {
    redisOptions.tls = { rejectUnauthorized: false };
  }

  try {
    clientInstance = new Redis(redisConfig, redisOptions);

    clientInstance.on('connect', () => {
      isRedisConnected = true;
      console.log('✅ Redis connected successfully');
    });

    clientInstance.on('ready', () => {
      isRedisConnected = true;
    });

    clientInstance.on('close', () => {
      isRedisConnected = false;
    });

    clientInstance.on('error', (err) => {
      isRedisConnected = false;
      console.warn('⚠️ [Redis Warning]:', err.message || 'Connection error. Using In-Memory fallback.');
    });
  } catch (err) {
    console.warn('⚠️ [Redis Init Error]:', err.message, '- Using In-Memory cache fallback.');
    clientInstance = null;
  }
} else {
  console.log('ℹ️ [Redis] Không có cấu hình REDIS_URL/REDIS_HOST. Tự động dùng In-Memory Cache (không cần cài Redis).');
}

// Tạo Dummy Redis Client nếu không có Redis thật
const createDummyClient = () => {
  const dummy = new EventEmitter();
  dummy.get = async (k) => memoryCache.get(k);
  dummy.set = async (k, v) => memoryCache.set(k, v);
  dummy.setex = async (k, ttl, v) => memoryCache.set(k, v, ttl);
  dummy.del = async (...keys) => {
    for (const k of keys) memoryCache.del(k);
  };
  dummy.keys = async (pat) => {
    const regex = new RegExp('^' + pat.replace(/\*/g, '.*') + '$');
    const matched = [];
    for (const k of memoryCache.store.keys()) {
      if (regex.test(k)) matched.push(k);
    }
    return matched;
  };
  dummy.incr = async (k) => memoryCache.incr(k);
  dummy.expire = async (k, ttl) => memoryCache.expire(k, ttl);
  dummy.disconnect = () => {};
  dummy.quit = async () => {};
  return dummy;
};

export const redisClient = clientInstance || createDummyClient();

// Helper functions cho caching với fallback mượt mà
export const cache = {
  /**
   * Get cached value
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    if (isRedisConnected && clientInstance) {
      try {
        const value = await clientInstance.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.warn('Cache get error, using fallback:', error.message);
      }
    }
    return await memoryCache.get(key);
  },

  /**
   * Set cached value with TTL
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds - Time to live in seconds
   */
  async set(key, value, ttlSeconds = 300) {
    if (isRedisConnected && clientInstance) {
      try {
        await clientInstance.setex(key, ttlSeconds, JSON.stringify(value));
        return;
      } catch (error) {
        console.warn('Cache set error, using fallback:', error.message);
      }
    }
    await memoryCache.set(key, value, ttlSeconds);
  },

  /**
   * Delete cached value
   * @param {string} key
   */
  async del(key) {
    if (isRedisConnected && clientInstance) {
      try {
        await clientInstance.del(key);
        return;
      } catch (error) {
        console.warn('Cache del error, using fallback:', error.message);
      }
    }
    await memoryCache.del(key);
  },

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern
   */
  async delPattern(pattern) {
    if (isRedisConnected && clientInstance) {
      try {
        const keys = await clientInstance.keys(pattern);
        if (keys && keys.length > 0) {
          await clientInstance.del(...keys);
        }
        return;
      } catch (error) {
        console.warn('Cache delPattern error, using fallback:', error.message);
      }
    }
    await memoryCache.delPattern(pattern);
  },

  /**
   * Increment counter
   * @param {string} key
   * @returns {Promise<number>}
   */
  async incr(key) {
    if (isRedisConnected && clientInstance) {
      try {
        return await clientInstance.incr(key);
      } catch (error) {
        console.warn('Cache incr error, using fallback:', error.message);
      }
    }
    return await memoryCache.incr(key);
  },

  /**
   * Set expiry on existing key
   * @param {string} key
   * @param {number} ttlSeconds
   */
  async expire(key, ttlSeconds) {
    if (isRedisConnected && clientInstance) {
      try {
        await clientInstance.expire(key, ttlSeconds);
        return;
      } catch (error) {
        console.warn('Cache expire error, using fallback:', error.message);
      }
    }
    await memoryCache.expire(key, ttlSeconds);
  },
};

export default redisClient;
