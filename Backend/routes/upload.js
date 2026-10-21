import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { uploadMedia } from '../helpers/uploadHelper.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  imageUpload,
  videoUpload,
  mediaUpload,
  checkUploadQuota,
  validateFileBuffer,
  handleUploadError,
} from '../middlewares/uploadSecurityMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('audio/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only images, videos, and audio allowed'));
    }
  },
});

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload file lên Cloudinary
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 url:
 *                   type: string
 *                 publicId:
 *                   type: string
 *       400:
 *         description: No file uploaded
 */
router.post(
  '/',
  authMiddleware,
  checkUploadQuota,
  mediaUpload.single('file'),
  validateFileBuffer,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      let resourceType = 'image';
      if (req.file.mimetype.startsWith('video/')) {
        resourceType = 'video';
      } else if (req.file.mimetype.startsWith('audio/')) {
        resourceType = 'raw';
      }

      const url = await uploadMedia(req.file.buffer, 'uploads', req.file.originalname);

      res.json({
        success: true,
        url,
        publicId: url,
        resourceType,
      });
    } catch (error) {
      console.error(' Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload nhiều files
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.post(
  '/multiple',
  authMiddleware,
  checkUploadQuota,
  mediaUpload.array('files', 10),
  validateFileBuffer,
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
      }

      const uploadPromises = req.files.map(async (file) => {
        return uploadMedia(file.buffer, 'uploads', file.originalname);
      });

      const urls = await Promise.all(uploadPromises);

      res.json({
        success: true,
        urls,
      });
    } catch (error) {
      console.error(' Multiple upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message,
      });
    }
  }
);

export default router;
