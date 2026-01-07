import express from 'express';
import cors from 'cors';
import http from 'http';
import swaggerUi from 'swagger-ui-express';
import { pool } from './config/db.js'; // Import DB pool for health check & shutdown
import chatRoutes from './routes/chatRoutes.js';
import chatSocket from './sockets/chatSocket.js';
import uploadRouter from './routes/upload.js';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import likeRoutes from './routes/likeRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import savedPostRoutes from './routes/savedPostRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import friendshipRoutes from './routes/friendshipRoutes.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { helmetConfig, apiLimiter, authLimiter, uploadLimiter } from './middlewares/security.js';
import { requestIdMiddleware } from './middlewares/requestId.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import morgan from 'morgan';
import logger, { stream } from './utils/logger.js';
import { swaggerSpec } from './config/swagger.js';
import { setSocketIO } from './workers/index.js'; // Initialize background workers

import { initSentry, sentryErrorHandler } from './config/sentry.js';

dotenv.config();

const app = express();
initSentry(app);

// Trust proxy - REQUIRED for Render/Railway deployment
// This allows Express to trust the X-Forwarded-* headers from the reverse proxy
app.set('trust proxy', 1);

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

logger.info('Cloudinary configured', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'MISSING',
});

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.CLIENT_URL ||
  'http://localhost:3000,https://hvt-social.vercel.app'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(requestIdMiddleware);
morgan.token('id', (req) => req.id);
app.use(morgan(process.env.NODE_ENV === 'production'
  ? ':id :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
  : ':id :method :url :status :response-time ms', { stream }));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint (expanded)
app.get('/health', async (req, res) => {
  try {
    // Check DB connection
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
    });
  } catch (err) {
    logger.error('Health check failed', err);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message,
    });
  }
});

// API Documentation với Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HVTSocial API Docs',
  })
);

// Swagger JSON spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

logger.info('📚 API Documentation available at /api-docs');

// ROUTES with rate limiting
app.use('/api/chat', apiLimiter, chatRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/upload', uploadLimiter, uploadRouter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', apiLimiter, postRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/stories', apiLimiter, storyRoutes);
app.use('/api/likes', apiLimiter, likeRoutes);
app.use('/api/comments', apiLimiter, commentRoutes);
app.use('/api/saved-posts', apiLimiter, savedPostRoutes);
app.use('/api/shares', apiLimiter, shareRoutes);
app.use('/api/friendships', apiLimiter, friendshipRoutes);

// SOCKET.IO
const server = http.createServer(app);
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['polling', 'websocket'],
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  upgradeTimeout: 30000, // 30 seconds
  allowUpgrades: true,
  cookie: false,
});

// STORE IO INSTANCE IN APP (for controllers: req.app.get('io'))
app.set('io', io);
logger.info('RUNNING SERVER FILE:', new URL(import.meta.url).pathname);

// Pass io instance to notification worker
setSocketIO(io);

chatSocket(io);

// Error handling middlewares (MUST be last)
app.use(sentryErrorHandler);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 Security: Helmet + Rate Limiting enabled`);
});

// Graceful Shutdown
const shutdown = async () => {
  logger.info('🛑 SIGTERM/SIGINT received. Shutting down gracefully...');
  server.close(() => logger.info('🔌 HTTP server closed.'));

  const io = app.get('io');
  if (io) io.close(() => logger.info('🔌 Socket.io closed.'));

  try {
    if (pool.close) await pool.close();
    else if (pool.end) await pool.end();
    logger.info('🔌 DB closed.');
    setTimeout(() => process.exit(0), 500);
  } catch (err) {
    logger.error('❌ DB close error', err);
    process.exit(1);
  }
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
