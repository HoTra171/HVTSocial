import Bull from 'bull';
import logger from './logger.js';

/**
 * Bull Queue Configuration
 * Setup background job queues with Redis
 */

// Support both REDIS_URL (Upstash, Railway) and REDIS_HOST/PORT format
const redisConfig = process.env.REDIS_URL 
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0')
    };

/**
 * Email Queue
 * For sending emails in background
 */
export const emailQueue = new Bull('email', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000 // Start with 2 seconds, then 4, 8, etc.
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

/**
 * Data Export Queue
 * For processing GDPR data export requests
 */
export const dataExportQueue = new Bull('data-export', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    timeout: 300000, // 5 minutes
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: false
  }
});

/**
 * Content Moderation Queue
 * For AI-based content moderation
 */
export const moderationQueue = new Bull('moderation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    timeout: 60000, // 1 minute
    removeOnComplete: true,
    removeOnFail: false
  }
});

/**
 * Notification Queue
 * For sending push notifications
 */
export const notificationQueue = new Bull('notification', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

/**
 * Cleanup Queue
 * For periodic cleanup tasks (expired stories, old notifications, etc.)
 */
export const cleanupQueue = new Bull('cleanup', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false
  }
});

/* ================= QUEUE EVENT HANDLERS ================= */

// Email Queue Events
emailQueue.on('completed', (job, result) => {
  logger.info({
    message: 'Email job completed',
    jobId: job.id,
    to: job.data.to
  });
});

emailQueue.on('failed', (job, err) => {
  logger.error({
    message: 'Email job failed',
    jobId: job.id,
    error: err.message,
    attempts: job.attemptsMade
  });
});

// Data Export Queue Events
dataExportQueue.on('completed', (job, result) => {
  logger.info({
    message: 'Data export job completed',
    jobId: job.id,
    userId: job.data.userId
  });
});

dataExportQueue.on('failed', (job, err) => {
  logger.error({
    message: 'Data export job failed',
    jobId: job.id,
    error: err.message
  });
});

// Moderation Queue Events
moderationQueue.on('completed', (job, result) => {
  logger.info({
    message: 'Moderation job completed',
    jobId: job.id,
    contentType: job.data.contentType,
    action: result.action
  });
});

moderationQueue.on('failed', (job, err) => {
  logger.error({
    message: 'Moderation job failed',
    jobId: job.id,
    error: err.message
  });
});

/* ================= QUEUE UTILITIES ================= */

/**
 * Get queue status
 */
export const getQueueStatus = async (queue) => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount()
  ]);

  return {
    name: queue.name,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
};

/**
 * Get all queues status
 */
export const getAllQueuesStatus = async () => {
  const queues = [
    emailQueue,
    dataExportQueue,
    moderationQueue,
    notificationQueue,
    cleanupQueue
  ];

  const statuses = await Promise.all(
    queues.map(queue => getQueueStatus(queue))
  );

  return statuses;
};

/**
 * Clean all completed jobs from queue
 */
export const cleanCompletedJobs = async (queue) => {
  await queue.clean(0, 'completed');
  logger.info({
    message: 'Cleaned completed jobs',
    queue: queue.name
  });
};

/**
 * Clean all failed jobs from queue
 */
export const cleanFailedJobs = async (queue) => {
  await queue.clean(0, 'failed');
  logger.info({
    message: 'Cleaned failed jobs',
    queue: queue.name
  });
};

/**
 * Pause queue
 */
export const pauseQueue = async (queue) => {
  await queue.pause();
  logger.warn({
    message: 'Queue paused',
    queue: queue.name
  });
};

/**
 * Resume queue
 */
export const resumeQueue = async (queue) => {
  await queue.resume();
  logger.info({
    message: 'Queue resumed',
    queue: queue.name
  });
};

/**
 * Graceful shutdown - close all queues
 */
export const closeQueues = async () => {
  logger.info('Closing all queues...');

  await Promise.all([
    emailQueue.close(),
    dataExportQueue.close(),
    moderationQueue.close(),
    notificationQueue.close(),
    cleanupQueue.close()
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
  closeQueues
};
