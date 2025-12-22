// routes/chatRoutes.js
import express from "express";
import {
  getUserChats,
  getMessages,
  sendMessage,
  markRead,
  deleteMessage,
  editMessage,
  getUnreadCount,
  getOrCreateDm,
} from "../controllers/chatController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Danh sách phòng chat (1-1) của user 
router.get("/user/:userId/chats", authMiddleware, getUserChats);

// Lấy tin nhắn theo chat
router.get("/messages/:chatId", authMiddleware, getMessages);

// Gửi tin nhắn qua HTTP (nếu muốn dùng)
router.post("/send", authMiddleware, sendMessage);

// Đánh dấu đã đọc
router.post("/read", authMiddleware, markRead);

// Thu hồi tin nhắn
router.delete("/message/:id", authMiddleware, deleteMessage);

// Chỉnh sửa tin nhắn
router.put("/message/:id", authMiddleware, editMessage);

// Lấy tổng số tin nhắn chưa đọc
router.get("/user/:userId/unread-count", authMiddleware, getUnreadCount);

// nhắn tin với người chưa nhắn bao giờ
router.post("/dm", authMiddleware, getOrCreateDm);

export default router;