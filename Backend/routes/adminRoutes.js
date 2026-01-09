import express from 'express';
import { getSystemStats, getAllUsers, updateUserStatus } from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

// Tất cả routes trong này đều yêu cầu đăng nhập và quyền admin
router.use(authMiddleware, requireRole('admin'));

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);

export default router;
