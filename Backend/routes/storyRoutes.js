import express from "express";
import { getStories, viewStory, createStory  } from "../controllers/storyController.js";
import authMiddleware  from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getStories);
router.post("/", authMiddleware, createStory);
router.post("/:id/view", authMiddleware, viewStory);
export default router;
