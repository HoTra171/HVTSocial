import express from 'express';
import {
  getCommentsByPost,
  getReplies,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/comments/post/{postId}:
 *   get:
 *     summary: Lấy tất cả comments của post (chỉ cấp 1)
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của post
 *     responses:
 *       200:
 *         description: Danh sách comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/post/:postId', getCommentsByPost);

/**
 * @swagger
 * /api/comments/{id}/replies:
 *   get:
 *     summary: Lấy tất cả replies của 1 comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của comment cha
 *     responses:
 *       200:
 *         description: Danh sách replies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/replies', getReplies);

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Tạo comment hoặc reply
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - post_id
 *               - content
 *             properties:
 *               post_id:
 *                 type: integer
 *                 description: ID của post
 *               content:
 *                 type: string
 *                 example: "Bài viết hay quá!"
 *               parent_comment_id:
 *                 type: integer
 *                 description: ID của comment cha (nếu là reply)
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Tạo comment thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', authMiddleware, createComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Cập nhật comment (chỉ chủ comment)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Nội dung đã được chỉnh sửa"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', authMiddleware, updateComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Xóa comment (chỉ chủ comment)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của comment
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', authMiddleware, deleteComment);

export default router;
