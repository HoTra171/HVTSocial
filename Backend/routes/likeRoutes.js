// likeRoutes.js
import express from 'express';
import {
  togglePostLike,
  toggleCommentLike,
  getPostLikes,
  checkUserLikedPost,
  getLikedPosts,
} from '../controllers/likeController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/likes/posts:
 *   get:
 *     summary: Lấy danh sách posts đã like
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách posts đã like
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/posts', authMiddleware, getLikedPosts);

/**
 * @swagger
 * /api/likes/post/{postId}:
 *   post:
 *     summary: Toggle like/unlike post
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của post
 *     responses:
 *       200:
 *         description: Toggle like thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 liked:
 *                   type: boolean
 *                   description: true nếu vừa like, false nếu vừa unlike
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/post/:postId', authMiddleware, togglePostLike);

/**
 * @swagger
 * /api/likes/comment/{commentId}:
 *   post:
 *     summary: Toggle like/unlike comment
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của comment
 *     responses:
 *       200:
 *         description: Toggle like thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 liked:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/comment/:commentId', authMiddleware, toggleCommentLike);

/**
 * @swagger
 * /api/likes/post/{postId}:
 *   get:
 *     summary: Lấy danh sách users đã like post
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của post
 *     responses:
 *       200:
 *         description: Danh sách users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 likes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/post/:postId', getPostLikes);

/**
 * @swagger
 * /api/likes/check/{postId}:
 *   get:
 *     summary: Kiểm tra user đã like post chưa
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của post
 *     responses:
 *       200:
 *         description: Trạng thái like
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/check/:postId', authMiddleware, checkUserLikedPost);

export default router;
