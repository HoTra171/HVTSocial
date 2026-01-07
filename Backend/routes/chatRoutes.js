// routes/chatRoutes.js
import express from 'express';
import {
  getUserChats,
  getMessages,
  sendMessage,
  markRead,
  deleteMessage,
  editMessage,
  getUnreadCount,
  getOrCreateDm,
} from '../controllers/chatController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/chat/user/{userId}/chats:
 *   get:
 *     summary: Lấy danh sách phòng chat của user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của user
 *     responses:
 *       200:
 *         description: Danh sách chat rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   chat_id:
 *                     type: integer
 *                   partner_id:
 *                     type: integer
 *                   partner_username:
 *                     type: string
 *                   partner_avatar:
 *                     type: string
 *                   last_message:
 *                     type: string
 *                   last_time:
 *                     type: string
 *                     format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/user/:userId/chats', authMiddleware, getUserChats);

/**
 * @swagger
 * /api/chat/messages/{chatId}:
 *   get:
 *     summary: Lấy tin nhắn theo chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của chat room
 *     responses:
 *       200:
 *         description: Danh sách tin nhắn
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/messages/:chatId', authMiddleware, getMessages);

/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: Gửi tin nhắn qua HTTP
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chatId
 *               - content
 *             properties:
 *               chatId:
 *                 type: integer
 *               content:
 *                 type: string
 *                 example: "Xin chào!"
 *     responses:
 *       200:
 *         description: Gửi tin nhắn thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/send', authMiddleware, sendMessage);

/**
 * @swagger
 * /api/chat/read:
 *   post:
 *     summary: Đánh dấu tin nhắn đã đọc
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chatId
 *             properties:
 *               chatId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Đánh dấu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/read', authMiddleware, markRead);

/**
 * @swagger
 * /api/chat/message/{id}:
 *   delete:
 *     summary: Thu hồi tin nhắn
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của tin nhắn
 *     responses:
 *       200:
 *         description: Thu hồi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete('/message/:id', authMiddleware, deleteMessage);

/**
 * @swagger
 * /api/chat/message/{id}:
 *   put:
 *     summary: Chỉnh sửa tin nhắn
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của tin nhắn
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
 *                 example: "Nội dung đã chỉnh sửa"
 *     responses:
 *       200:
 *         description: Chỉnh sửa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/message/:id', authMiddleware, editMessage);

/**
 * @swagger
 * /api/chat/user/{userId}/unread-count:
 *   get:
 *     summary: Lấy tổng số tin nhắn chưa đọc
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của user
 *     responses:
 *       200:
 *         description: Số lượng tin chưa đọc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/user/:userId/unread-count', authMiddleware, getUnreadCount);

/**
 * @swagger
 * /api/chat/dm:
 *   post:
 *     summary: Tạo hoặc lấy chat với người chưa từng nhắn
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: integer
 *                 description: ID của người nhận
 *     responses:
 *       200:
 *         description: Lấy hoặc tạo chat thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chatId:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/dm', authMiddleware, getOrCreateDm);

export default router;
