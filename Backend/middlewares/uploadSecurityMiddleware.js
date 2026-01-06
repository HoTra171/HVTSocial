import multer from 'multer';
import path from 'path';
import logger from '../config/logger.js';

/**
 * Upload Security Middleware
 * Kiểm tra và validate file uploads
 */

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
];

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Dangerous file extensions (block these)
const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.pif',
  '.scr',
  '.vbs',
  '.js',
  '.jar',
  '.msi',
  '.app',
  '.deb',
  '.rpm',
  '.sh',
  '.bash',
  '.php',
  '.asp',
  '.aspx',
  '.jsp',
];

/**
 * File filter function
 */
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Check for dangerous extensions
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      logger.warn({
        message: 'Dangerous file upload attempt',
        userId: req.user?.id,
        filename: file.originalname,
        mimetype: file.mimetype,
      });

      return cb(
        new Error('File type not allowed for security reasons'),
        false
      );
    }

    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
      logger.warn({
        message: 'Invalid file type upload attempt',
        userId: req.user?.id,
        filename: file.originalname,
        mimetype: file.mimetype,
      });

      return cb(
        new Error(
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        ),
        false
      );
    }

    // Check filename for suspicious patterns
    if (file.originalname.match(/[<>:"|?*\x00-\x1f]/)) {
      logger.warn({
        message: 'Suspicious filename detected',
        userId: req.user?.id,
        filename: file.originalname,
      });

      return cb(new Error('Invalid filename'), false);
    }

    cb(null, true);
  };
};

/**
 * Multer config for images
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files per request
  },
  fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES),
});

/**
 * Multer config for videos
 */
export const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1, // Max 1 video per request
  },
  fileFilter: createFileFilter(ALLOWED_VIDEO_TYPES),
});

/**
 * Multer config for audio
 */
export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 1,
  },
  fileFilter: createFileFilter(ALLOWED_AUDIO_TYPES),
});

/**
 * Multer config for documents
 */
export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 10,
  },
  fileFilter: createFileFilter(ALLOWED_DOCUMENT_TYPES),
});

/**
 * General media upload (images, videos, audio)
 */
export const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10,
  },
  fileFilter: createFileFilter([
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_VIDEO_TYPES,
    ...ALLOWED_AUDIO_TYPES,
  ]),
});

/**
 * Profile picture upload (stricter limits)
 */
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES),
});

/**
 * Middleware to check file upload quota (per user)
 */
export const checkUploadQuota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { cache } = await import('../config/redis.js');

    const key = `upload:quota:user:${userId}`;
    const count = await cache.incr(key);

    if (count === 1) {
      // First upload today, set 24h TTL
      await cache.expire(key, 86400);
    }

    const maxUploadsPerDay = parseInt(process.env.MAX_UPLOADS_PER_DAY) || 100;

    if (count > maxUploadsPerDay) {
      logger.warn({
        message: 'Upload quota exceeded',
        userId,
        count,
        maxUploadsPerDay,
      });

      return res.status(429).json({
        success: false,
        message: 'Daily upload quota exceeded. Please try again tomorrow.',
      });
    }

    next();
  } catch (error) {
    logger.error('Check upload quota error:', error);
    // Continue without quota check on error
    next();
  }
};

/**
 * Error handler for multer errors
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error({
      message: 'Multer upload error',
      userId: req.user?.id,
      error: err.message,
      code: err.code,
    });

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large',
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field',
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Upload error',
      error: err.message,
    });
  }

  if (err) {
    logger.error({
      message: 'Upload error',
      userId: req.user?.id,
      error: err.message,
    });

    return res.status(400).json({
      success: false,
      message: err.message || 'Upload failed',
    });
  }

  next();
};

/**
 * Validate file buffer (check magic numbers)
 * Prevents MIME type spoofing
 */
export const validateFileBuffer = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.files || [req.file];

  for (const file of files) {
    if (!file || !file.buffer) continue;

    const buffer = file.buffer;
    const hex = buffer.toString('hex', 0, 4);

    // Check magic numbers (file signatures)
    const signatures = {
      // Images
      'ffd8ffe0': 'image/jpeg',
      'ffd8ffe1': 'image/jpeg',
      'ffd8ffe2': 'image/jpeg',
      '89504e47': 'image/png',
      '47494638': 'image/gif',
      '52494646': 'image/webp', // Partial match
      // Videos
      '00000018': 'video/mp4',
      '00000020': 'video/mp4',
      '1a45dfa3': 'video/webm',
      // Audio
      'fffb': 'audio/mp3',
      'fff3': 'audio/mp3',
      '494433': 'audio/mp3',
    };

    let validSignature = false;

    for (const [sig, mime] of Object.entries(signatures)) {
      if (hex.startsWith(sig)) {
        validSignature = true;
        break;
      }
    }

    if (!validSignature && file.mimetype.startsWith('image/')) {
      logger.warn({
        message: 'Invalid file signature detected',
        userId: req.user?.id,
        filename: file.originalname,
        mimetype: file.mimetype,
        signature: hex,
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid file format. File may be corrupted or fake.',
      });
    }
  }

  next();
};

export default {
  imageUpload,
  videoUpload,
  audioUpload,
  documentUpload,
  mediaUpload,
  avatarUpload,
  checkUploadQuota,
  handleUploadError,
  validateFileBuffer,
};
