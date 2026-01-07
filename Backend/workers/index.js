/**
 * Workers Index
 * Khởi động tất cả background workers
 */

import logger from '../utils/logger.js';

// Import workers
import './emailWorker.js';
import { setSocketIO } from './notificationWorker.js';

logger.info('🔄 Background workers initialized');
logger.info('   - Email Worker (12 job types)');
logger.info('   - Notification Worker (9 job types)');

export { setSocketIO };
