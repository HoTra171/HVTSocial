import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationsController.js";
import authMiddleware from "../middlewares/authMiddleware.js";


const router = express.Router();

// Lấy danh sách thông báo
router.get("/", authMiddleware, getNotifications);

// Đếm thông báo chưa đọc
router.get("/unread-count", authMiddleware, getUnreadCount);

// Đánh dấu đã đọc tất cả
router.patch("/mark-all-read", authMiddleware, markAllRead);

// Đánh dấu đã đọc 1 thông báo
router.patch("/:id/read", authMiddleware, markAsRead);

// Xóa 1 thông báo
router.delete("/:id", authMiddleware, deleteNotification);

// Xóa tất cả thông báo
router.delete("/", authMiddleware, deleteAllNotifications);

export default router;
