import express from 'express';
import { getStories, viewStory, createStory, getStoryViewers } from '../controllers/storyController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/stories:
 *   get:
 *     summary: Lấy stories (24h)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách stories
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authMiddleware, getStories);

/**
 * @swagger
 * /api/stories:
 *   post:
 *     summary: Tạo story mới
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - media_url
 *             properties:
 *               media_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo story thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', authMiddleware, createStory);

/**
 * @swagger
 * /api/stories/{id}/view:
 *   post:
 *     summary: Đánh dấu đã xem story
 *     tags: [Stories]
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
 *         description: Đánh dấu thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/view', authMiddleware, viewStory);

/**
 * @swagger
 * /api/stories/{id}/viewers:
 *   get:
 *     summary: Lấy danh sách người đã xem story (chỉ story của mình)
 *     tags: [Stories]
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
 *         description: Danh sách người xem
 *       403:
 *         description: Không có quyền
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id/viewers', authMiddleware, getStoryViewers);

export default router;
