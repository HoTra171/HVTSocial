// shareRoutes.js
import express from "express";
import {
  sharePost,
  getSharedPost,
  getPostShares,
  deleteShare,
} from "../controllers/shareController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Share a post
router.post("/", authMiddleware, sharePost);

// Get shared post details
router.get("/:id", getSharedPost);

// Get all shares of a post
router.get("/post/:postId", getPostShares);

// Delete a share
router.delete("/:id", authMiddleware, deleteShare);

export default router;
