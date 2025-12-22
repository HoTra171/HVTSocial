import express from "express";
import {
  getCommentsByPost,
  getReplies,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Lấy tất cả comments của post (chỉ cấp 1)
router.get("/post/:postId", getCommentsByPost);

// Lấy tất cả replies của 1 comment
router.get("/:id/replies", getReplies);

// Tạo comment hoặc reply (cần auth)
router.post("/", authMiddleware, createComment);

// Cập nhật comment (cần auth)
router.put("/:id", authMiddleware, updateComment);

// Xóa comment (cần auth)
router.delete("/:id", authMiddleware, deleteComment);

export default router;
