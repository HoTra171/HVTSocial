import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

// Define custom log format for development
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // 'debug' in dev, 'info' in prod
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // handle errors properly
    json() // Default to JSON for easy parsing (e.g. by Datadog/ELK)
  ),
  transports: [
    // 1. Write all logs with importance level of `error` or less to `error-%DATE%.log`
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    // 2. Write all logs with importance level of `info` or less to `combined-%DATE%.log`
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// Always log to console (important for Render/Cloud logs)
logger.add(
  new winston.transports.Console({
    format: combine(colorize(), process.env.NODE_ENV === 'production' ? json() : devFormat),
  })
);

// Stream for Morgan (HTTP Logger)
export const stream = {
  write: (message) => {
    // Morgan adds a newline, so trim it
    logger.info(message.trim());
  },
};

export default logger;
