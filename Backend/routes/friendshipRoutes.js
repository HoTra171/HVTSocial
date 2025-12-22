import express from "express";
import {
  // getSuggestedFriends
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
  cancelFriendRequest,
  getFriendshipStatus,
  getFriends,
  getPendingRequests,
  getSentRequests,
  getSuggestedFriends,
} from "../controllers/friendshipController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// ========== ACTIONS ==========

// Gửi lời mời kết bạn
router.post("/send-request", authMiddleware, sendFriendRequest);

// Chấp nhận lời mời
router.post("/accept", authMiddleware, acceptFriendRequest);

// Từ chối lời mời
router.post("/reject", authMiddleware, rejectFriendRequest);

// Hủy kết bạn
router.delete("/unfriend", authMiddleware, unfriend);

// Hủy lời mời đã gửi
router.delete("/cancel", authMiddleware, cancelFriendRequest);

// ========== QUERIES ==========

// Kiểm tra trạng thái với 1 user
router.get("/status/:friendId", authMiddleware, getFriendshipStatus);

// Danh sách bạn bè
router.get("/friends", authMiddleware, getFriends);

// Lời mời đang chờ (người khác gửi cho mình)
router.get("/pending", authMiddleware, getPendingRequests);

// Lời mời đã gửi (mình gửi cho người khác)
router.get("/sent", authMiddleware, getSentRequests);

// Gợi ý kết bạn
router.get("/suggestions", authMiddleware, getSuggestedFriends);

export default router;
