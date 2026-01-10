import express from 'express';
import {
  createCallHistory,
  getCallHistoryBetweenUsers,
  getCallHistoryForUser,
  getMissedCallsCount,
} from '../controllers/callHistoryController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/call-history:
 *   post:
 *     summary: Create a call history record
 *     tags: [Call History]
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
 *               - callType
 *               - status
 *             properties:
 *               receiverId:
 *                 type: integer
 *               callType:
 *                 type: string
 *                 enum: [video, voice]
 *               status:
 *                 type: string
 *                 enum: [completed, missed, rejected, failed]
 *               duration:
 *                 type: integer
 *                 description: Duration in seconds
 *     responses:
 *       201:
 *         description: Call history created
 */
router.post('/', authMiddleware, createCallHistory);

/**
 * @swagger
 * /api/call-history:
 *   get:
 *     summary: Get all call history for current user
 *     tags: [Call History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of call history
 */
router.get('/', authMiddleware, getCallHistoryForUser);

/**
 * @swagger
 * /api/call-history/missed/count:
 *   get:
 *     summary: Get missed calls count
 *     tags: [Call History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Missed calls count
 */
router.get('/missed/count', authMiddleware, getMissedCallsCount);

/**
 * @swagger
 * /api/call-history/{userId}:
 *   get:
 *     summary: Get call history between current user and specified user
 *     tags: [Call History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of call history
 */
router.get('/:userId', authMiddleware, getCallHistoryBetweenUsers);

export default router;
