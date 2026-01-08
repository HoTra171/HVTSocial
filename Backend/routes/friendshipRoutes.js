import express from 'express';
import {
  // getSuggestedFriends
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
  cancelFriendRequest,
  getFriendshipStatus,
  getFriends,
  getPendingRequests,
  getPendingRequestsCount,
  getSentRequests,
  getSuggestedFriends,
} from '../controllers/friendshipController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// ========== ACTIONS ==========

/**
 * @swagger
 * /api/friendships/send-request:
 *   post:
 *     summary: Gửi lời mời kết bạn
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Gửi lời mời thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/send-request', authMiddleware, sendFriendRequest);

/**
 * @swagger
 * /api/friendships/accept:
 *   post:
 *     summary: Chấp nhận lời mời kết bạn
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Chấp nhận thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/accept', authMiddleware, acceptFriendRequest);

/**
 * @swagger
 * /api/friendships/reject:
 *   post:
 *     summary: Từ chối lời mời kết bạn
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Từ chối thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/reject', authMiddleware, rejectFriendRequest);

/**
 * @swagger
 * /api/friendships/unfriend:
 *   delete:
 *     summary: Hủy kết bạn
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Hủy kết bạn thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/unfriend', authMiddleware, unfriend);

/**
 * @swagger
 * /api/friendships/cancel:
 *   delete:
 *     summary: Hủy lời mời đã gửi
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Hủy lời mời thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/cancel', authMiddleware, cancelFriendRequest);

// ========== QUERIES ==========

/**
 * @swagger
 * /api/friendships/status/{friendId}:
 *   get:
 *     summary: Kiểm tra trạng thái kết bạn với 1 user
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trạng thái kết bạn (friends, pending, sent, none)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/status/:friendId', authMiddleware, getFriendshipStatus);

/**
 * @swagger
 * /api/friendships/friends:
 *   get:
 *     summary: Lấy danh sách bạn bè
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bạn bè
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/friends', authMiddleware, getFriends);

/**
 * @swagger
 * /api/friendships/pending:
 *   get:
 *     summary: Lấy lời mời đang chờ
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lời mời chờ
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/pending', authMiddleware, getPendingRequests);

/**
 * @swagger
 * /api/friendships/pending-count:
 *   get:
 *     summary: Đếm số lượng lời mời kết bạn đang chờ
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Số lượng lời mời chờ
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/pending-count', authMiddleware, getPendingRequestsCount);

/**
 * @swagger
 * /api/friendships/sent:
 *   get:
 *     summary: Lấy lời mời đã gửi
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lời mời đã gửi
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/sent', authMiddleware, getSentRequests);

/**
 * @swagger
 * /api/friendships/suggestions:
 *   get:
 *     summary: Gợi ý kết bạn
 *     tags: [Friendships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách gợi ý kết bạn
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/suggestions', authMiddleware, getSuggestedFriends);

export default router;
