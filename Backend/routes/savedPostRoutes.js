// savedPostRoutes.js
import express from "express";
import {
  toggleSavePost,
  getSavedPosts,
  checkSavedPost,
} from "../controllers/savedPostController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/saved-posts:
 *   get:
 *     summary: Lấy danh sách posts đã save
 *     tags: [Saved Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách saved posts
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", authMiddleware, getSavedPosts);

/**
 * @swagger
 * /api/saved-posts/{postId}:
 *   post:
 *     summary: Toggle save/unsave post
 *     tags: [Saved Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Toggle thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/:postId", authMiddleware, toggleSavePost);

/**
 * @swagger
 * /api/saved-posts/check/{postId}:
 *   get:
 *     summary: Kiểm tra đã save post chưa
 *     tags: [Saved Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trạng thái saved
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/check/:postId", authMiddleware, checkSavedPost);

export default router;
