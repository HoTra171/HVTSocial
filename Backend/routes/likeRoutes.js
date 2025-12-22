// likeRoutes.js
import express from "express";
import {
  togglePostLike,
  toggleCommentLike,
  getPostLikes,
  checkUserLikedPost,
  getLikedPosts,
} from "../controllers/likeController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Toggle like post
router.post("/post/:postId", authMiddleware, togglePostLike);

// Toggle like comment
router.post("/comment/:commentId", authMiddleware, toggleCommentLike);

// Get all likes of a post
router.get("/post/:postId", getPostLikes);

// Check if user liked a post
router.get("/check/:postId", authMiddleware, checkUserLikedPost);

//  THÊM ROUTE NÀY (đặt TRƯỚC router.get("/check/:postId"))
router.get("/posts", authMiddleware, getLikedPosts);
export default router;
