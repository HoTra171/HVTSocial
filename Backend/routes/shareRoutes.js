// shareRoutes.js
import express from 'express';
import {
  sharePost,
  getSharedPost,
  getPostShares,
  deleteShare,
} from '../controllers/shareController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/shares:
 *   post:
 *     summary: Share một post
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *             properties:
 *               postId:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Share thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', authMiddleware, sharePost);

/**
 * @swagger
 * /api/shares/{id}:
 *   get:
 *     summary: Lấy chi tiết shared post
 *     tags: [Shares]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin shared post
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', getSharedPost);

/**
 * @swagger
 * /api/shares/post/{postId}:
 *   get:
 *     summary: Lấy tất cả shares của post
 *     tags: [Shares]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách shares
 */
router.get('/post/:postId', getPostShares);

/**
 * @swagger
 * /api/shares/{id}:
 *   delete:
 *     summary: Xóa share
 *     tags: [Shares]
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
 *         description: Xóa thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/:id', authMiddleware, deleteShare);

export default router;
