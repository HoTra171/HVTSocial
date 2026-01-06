import express from "express";
import cors from "cors";
import http from "http";
import swaggerUi from 'swagger-ui-express';
import chatRoutes from "./routes/chatRoutes.js";
import chatSocket from "./sockets/chatSocket.js";
import uploadRouter from "./routes/upload.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import savedPostRoutes from "./routes/savedPostRoutes.js";
import shareRoutes from "./routes/shareRoutes.js";
import friendshipRoutes from "./routes/friendshipRoutes.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { helmetConfig, apiLimiter, authLimiter, uploadLimiter } from './middlewares/security.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import requestLogger from './middlewares/requestLogger.js';
import logger from './config/logger.js';
import { swaggerSpec } from './config/swagger.js';
import { setSocketIO } from './workers/index.js'; // Initialize background workers

dotenv.config();

const app = express();

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

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// Security middlewares
app.use(helmetConfig);
app.use(requestLogger);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Documentation với Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'HVTSocial API Docs'
}));

// Swagger JSON spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

logger.info('📚 API Documentation available at /api-docs');

// ROUTES with rate limiting
app.use("/api/chat", apiLimiter, chatRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/upload", uploadLimiter, uploadRouter);
app.use('/api/auth', authLimiter, authRoutes);
app.use("/api/posts", apiLimiter, postRoutes);
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/notifications", apiLimiter, notificationRoutes);
app.use("/api/stories", apiLimiter, storyRoutes);
app.use("/api/likes", apiLimiter, likeRoutes);
app.use("/api/comments", apiLimiter, commentRoutes);
app.use("/api/saved-posts", apiLimiter, savedPostRoutes);
app.use("/api/shares", apiLimiter, shareRoutes);
app.use("/api/friendships", apiLimiter, friendshipRoutes);

// SOCKET.IO
const server = http.createServer(app);
import { Server } from "socket.io";

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// STORE IO INSTANCE IN APP (for controllers: req.app.get('io'))
app.set('io', io);
logger.info("RUNNING SERVER FILE:", new URL(import.meta.url).pathname);

// Pass io instance to notification worker
setSocketIO(io);

chatSocket(io);

// Error handling middlewares (MUST be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 Security: Helmet + Rate Limiting enabled`);
});
