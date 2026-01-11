import express from 'express';
import {
    getSystemStats,
    getAllUsers,
    updateUserStatus,
    getAllPosts,
    deletePostByAdmin,
    getAllComments,
    deleteCommentByAdmin
} from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

// Tất cả routes trong này đều yêu cầu đăng nhập và quyền admin
router.use(authMiddleware, requireRole('admin'));

// System stats
router.get('/stats', getSystemStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);

// Post management
router.get('/posts', getAllPosts);
router.delete('/posts/:id', deletePostByAdmin);

// Comment management
router.get('/comments', getAllComments);
router.delete('/comments/:id', deleteCommentByAdmin);

export default router;
