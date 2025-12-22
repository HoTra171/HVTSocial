// savedPostRoutes.js
import express from "express";
import {
  toggleSavePost,
  getSavedPosts,
  checkSavedPost,
} from "../controllers/savedPostController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Toggle save/unsave post
router.post("/:postId", authMiddleware, toggleSavePost);

// Get all saved posts
router.get("/", authMiddleware, getSavedPosts);

// Check if user saved a post
router.get("/check/:postId", authMiddleware, checkSavedPost);

export default router;
