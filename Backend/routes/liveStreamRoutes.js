import express from 'express';
import {
  createLiveStream,
  getActiveLiveStreams,
  getLiveStreamById,
  endLiveStream,
  getUserLiveStatus,
  getLiveStreamComments,
  addLiveStreamComment,
} from '../controllers/liveStreamController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getActiveLiveStreams);
router.post('/', authMiddleware, createLiveStream);
router.get('/user/:userId/status', authMiddleware, getUserLiveStatus);
router.get('/:id', authMiddleware, getLiveStreamById);
router.post('/:id/end', authMiddleware, endLiveStream);
router.get('/:id/comments', authMiddleware, getLiveStreamComments);
router.post('/:id/comments', authMiddleware, addLiveStreamComment);

export default router;
