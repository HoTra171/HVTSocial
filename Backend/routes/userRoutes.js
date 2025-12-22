import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  discoverUsers,
  getUserConnections,
  getUserProfile,
  updateProfile,
  suggestUsers,
} from '../controllers/userController.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
const router = express.Router();

// ========== SEARCH & DISCOVER ==========
// Discover users (tìm kiếm tổng hợp)
router.get("/discover", authMiddleware, discoverUsers);
router.get("/suggest", authMiddleware, suggestUsers);

// ========== CONNECTIONS & PROFILE ==========
// Get user connections
router.get("/:userId/connections", authMiddleware, getUserConnections);

// Get user profile
router.get("/:id", authMiddleware, getUserProfile);


// PUT /api/users/:id
router.put("/:id",authMiddleware,upload.fields([{ name: 'avatar', maxCount: 1 },{ name: 'background', maxCount: 1 }]),updateProfile);

export default router;
