import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  discoverUsers,
  getUserConnections,
  getUserProfile,
  updateProfile,
  suggestUsers,
} from '../controllers/userController.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
const router = express.Router();

// ========== SEARCH & DISCOVER ==========

/**
 * @swagger
 * /api/users/discover:
 *   get:
 *     summary: Tìm kiếm users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Keyword tìm kiếm
 *     responses:
 *       200:
 *         description: Danh sách users
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/discover', authMiddleware, discoverUsers);

/**
 * @swagger
 * /api/users/suggest:
 *   get:
 *     summary: Gợi ý users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách gợi ý
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/suggest', authMiddleware, suggestUsers);

// ========== CONNECTIONS & PROFILE ==========

/**
 * @swagger
 * /api/users/{userId}/connections:
 *   get:
 *     summary: Lấy connections của user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Connections
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:userId/connections', authMiddleware, getUserConnections);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy profile của user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', authMiddleware, getUserProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *               background:
 *                 type: string
 *                 format: binary
 *               full_name:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put(
  '/:id',
  authMiddleware,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'background', maxCount: 1 },
  ]),
  updateProfile
);

export default router;
