import Bull from 'bull';
import EventEmitter from 'events';
import logger from '../utils/logger.js';

/**
 * Bull Queue Configuration & Fallback
 * Setup background job queues with Redis or In-Memory fallback
 */

// In-Memory Queue Fallback cho môi trường không có Redis (Render free tier, local không cài Redis)
class SimpleMemoryQueue extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.handler = null;
    this.jobCounter = 1;
  }

  process(arg1, arg2) {
    this.handler = typeof arg1 === 'function' ? arg1 : arg2;
    return this;
  }

  async add(arg1, arg2, arg3) {
    let data = arg1;
    let options = arg2 || {};
    if (typeof arg1 === 'string') {
      data = arg2;
      options = arg3 || {};
    }

    const job = {
      id: String(this.jobCounter++),
      data: data || {},
      opts: options,
      attemptsMade: 0,
      timestamp: Date.now(),
    };

    // Chạy bất đồng bộ để không block request chính
    setImmediate(async () => {
      if (!this.handler) return;
      try {
        const result = await this.handler(job);
        this.emit('completed', job, result);
      } catch (err) {
        job.attemptsMade++;
        this.emit('failed', job, err);
        logger.error({
          message: `Memory Queue job [${this.name}] failed`,
          jobId: job.id,
          error: err.message,
        });
      }
    });

    return job;
  }

  async getWaitingCount() { return 0; }
  async getActiveCount() { return 0; }
  async getCompletedCount() { return 0; }
  async getFailedCount() { return 0; }
  async getDelayedCount() { return 0; }
  async clean() { return []; }
  async pause() {}
  async resume() {}
  async close() {}
}

const hasExplicitRedis = Boolean(process.env.REDIS_URL || (process.env.REDIS_HOST && process.env.REDIS_HOST !== 'localhost'));
const isLocalDevWithRedis = process.env.REDIS_HOST === 'localhost';
const shouldAttemptRedis = hasExplicitRedis || (isLocalDevWithRedis && process.env.NODE_ENV !== 'production');

const getBullOptions = () => {
  if (process.env.REDIS_URL) {
    const isUpstashOrTls = process.env.REDIS_URL.startsWith('rediss://');
    if (isUpstashOrTls) {
      return {
        redis: process.env.REDIS_URL,
        settings: {
          tls: { rejectUnauthorized: false },
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
          retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 1000, 3000);
          },
        },
      };
    }
    return {
      redis: process.env.REDIS_URL,
      settings: {
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 1000, 3000);
        },
      },
    };
  }

  return {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 1000, 3000);
      },
    },
  };
};

const createQueue = (name, defaultJobOptions = {}) => {
  if (!shouldAttemptRedis) {
    return new SimpleMemoryQueue(name);
  }

  try {
    const bullOpts = getBullOptions();
    const queue = new Bull(name, {
      ...bullOpts,
      defaultJobOptions,
    });

    // Bắt buộc lắng nghe sự kiện error để tránh Node.js bị crash do Unhandled 'error' event
    queue.on('error', (err) => {
      logger.warn(`⚠️ Queue [${name}] Redis connection warning: ${err.message || 'Cannot reach Redis'}`);
    });

    return queue;
  } catch (err) {
    logger.warn(`⚠️ Khởi tạo Bull queue [${name}] thất bại, dùng In-Memory Queue:`, err.message);
    return new SimpleMemoryQueue(name);
  }
};

/**
 * Khởi tạo các Queue
 */
export const emailQueue = createQueue('email', {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
});

export const dataExportQueue = createQueue('data-export', {
  attempts: 2,
  timeout: 300000,
  removeOnComplete: 100,
  removeOnFail: false,
});

export const moderationQueue = createQueue('moderation', {
  attempts: 2,
  timeout: 60000,
  removeOnComplete: true,
  removeOnFail: false,
});

export const notificationQueue = createQueue('notification', {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
});

export const cleanupQueue = createQueue('cleanup', {
  attempts: 1,
  removeOnComplete: true,
  removeOnFail: false,
});

/* ================= QUEUE EVENT HANDLERS ================= */

// Email Queue Events
emailQueue.on('completed', (job, result) => {
  logger.info({
    message: 'Email job completed',
    jobId: job.id,
    to: job.data?.to,
  });
});

emailQueue.on('failed', (job, err) => {
  logger.error({
    message: 'Email job failed',
    jobId: job.id,
    error: err.message,
    attempts: job.attemptsMade,
  });
});

// Data Export Queue Events
dataExportQueue.on('completed', (job, result) => {
  logger.info({
    message: 'Data export job completed',
    jobId: job.id,
    userId: job.data?.userId,
  });
});

dataExportQueue.on('failed', (job, err) => {
  logger.error({
    message: 'Data export job failed',
    jobId: job.id,
    error: err.message,
  });
});

// Moderation Queue Events
moderationQueue.on('completed', (job, result) => {
  logger.info({
    message: 'Moderation job completed',
    jobId: job.id,
    contentType: job.data?.contentType,
    action: result?.action,
  });
});

moderationQueue.on('failed', (job, err) => {
  logger.error({
    message: 'Moderation job failed',
    jobId: job.id,
    error: err.message,
  });
});

// Notification Queue Events
notificationQueue.on('completed', (job, result) => {
  logger.info({
    message: 'Notification job completed',
    jobId: job.id,
    type: job.data?.type,
  });
});

notificationQueue.on('failed', (job, err) => {
  logger.error({
    message: 'Notification job failed',
    jobId: job.id,
    error: err.message,
  });
});

/* ================= QUEUE UTILITIES ================= */

/**
 * Get queue status
 */
export const getQueueStatus = async (queue) => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount ? queue.getWaitingCount() : 0,
      queue.getActiveCount ? queue.getActiveCount() : 0,
      queue.getCompletedCount ? queue.getCompletedCount() : 0,
      queue.getFailedCount ? queue.getFailedCount() : 0,
      queue.getDelayedCount ? queue.getDelayedCount() : 0,
    ]);

    return {
      name: queue.name,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (err) {
    return {
      name: queue.name,
      status: 'offline',
      error: err.message,
    };
  }
};

/**
 * Get all queues status
 */
export const getAllQueuesStatus = async () => {
  const queues = [emailQueue, dataExportQueue, moderationQueue, notificationQueue, cleanupQueue];
  const statuses = await Promise.all(queues.map((queue) => getQueueStatus(queue)));
  return statuses;
};

/**
 * Clean all completed jobs from queue
 */
export const cleanCompletedJobs = async (queue) => {
  try {
    if (queue.clean) await queue.clean(0, 'completed');
    logger.info({
      message: 'Cleaned completed jobs',
      queue: queue.name,
    });
  } catch (err) {
    logger.warn(`Could not clean completed jobs for ${queue.name}: ${err.message}`);
  }
};

/**
 * Clean all failed jobs from queue
 */
export const cleanFailedJobs = async (queue) => {
  try {
    if (queue.clean) await queue.clean(0, 'failed');
    logger.info({
      message: 'Cleaned failed jobs',
      queue: queue.name,
    });
  } catch (err) {
    logger.warn(`Could not clean failed jobs for ${queue.name}: ${err.message}`);
  }
};

/**
 * Pause queue
 */
export const pauseQueue = async (queue) => {
  try {
    if (queue.pause) await queue.pause();
    logger.warn({
      message: 'Queue paused',
      queue: queue.name,
    });
  } catch (err) {
    logger.warn(`Could not pause queue ${queue.name}: ${err.message}`);
  }
};

/**
 * Resume queue
 */
export const resumeQueue = async (queue) => {
  try {
    if (queue.resume) await queue.resume();
    logger.info({
      message: 'Queue resumed',
      queue: queue.name,
    });
  } catch (err) {
    logger.warn(`Could not resume queue ${queue.name}: ${err.message}`);
  }
};

/**
 * Graceful shutdown - close all queues
 */
export const closeQueues = async () => {
  logger.info('Closing all queues...');

  await Promise.all([
    emailQueue.close ? emailQueue.close() : Promise.resolve(),
    dataExportQueue.close ? dataExportQueue.close() : Promise.resolve(),
    moderationQueue.close ? moderationQueue.close() : Promise.resolve(),
    notificationQueue.close ? notificationQueue.close() : Promise.resolve(),
    cleanupQueue.close ? cleanupQueue.close() : Promise.resolve(),
  ]);

  logger.info('All queues closed');
};

// Handle process termination
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing queues gracefully...');
  await closeQueues();
  process.exit(0);
});

export default {
  emailQueue,
  dataExportQueue,
  moderationQueue,
  notificationQueue,
  cleanupQueue,
  getQueueStatus,
  getAllQueuesStatus,
  cleanCompletedJobs,
  cleanFailedJobs,
  pauseQueue,
  resumeQueue,
  closeQueues,
};
