import express from "express";
import { getPosts, createPost, getPostsByUser, getPost, updatePost, deletePost } from "../controllers/postController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getPosts);
router.post("/", authMiddleware, createPost);
router.get("/user/:userId", authMiddleware, getPostsByUser);
router.get("/:id",authMiddleware, getPost);
router.put("/:id", authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);


export default router;
 