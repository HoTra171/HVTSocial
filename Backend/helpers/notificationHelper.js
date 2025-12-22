import { NotificationService } from "../services/notificationService.js";

/**
 * Helper để tạo và emit notification
 * @param {Object} io - Socket.io instance
 * @param {Object} data - Notification data
 */
export const emitNotification = async (io, data) => {
  try {
    const { userId, senderId, type, ...rest } = data;

    if (!userId || !senderId) return null;

    // [TYPE MAP] ép type về đúng CHECK constraint trong DB
    const TYPE_MAP = {
      friend_accept: "friend_request",
      reply: "comment",
      share: "other",
    };

    const allowed = new Set(["other", "message", "friend_request", "comment", "like"]);
    const safeType = TYPE_MAP[type] || (allowed.has(type) ? type : "other");

    let notification = null;

    switch (safeType) {
      case "like":
        notification = await NotificationService.createLikeNotification(
          rest.postId,
          senderId,
          userId
        );
        break;

      case "comment":
        // dùng cho cả comment + reply (content có thể khác nhau)
        notification = await NotificationService.createCommentNotification(
          rest.postId,
          senderId,
          userId,
          rest.content
        );
        break;

      case "friend_request":
        const content =
          type === "friend_accept"
            ? "đã chấp nhận lời mời kết bạn"
            : "đã gửi lời mời kết bạn";
        notification = await NotificationService.createFriendRequestNotification(
          userId,
          senderId,
          content
        );
        break;

      case "message":
        notification = await NotificationService.createMessageNotification({
          userId,
          senderId,
          chatId: rest.chatId,
          content: rest.content,
        });
        break;

      case "other":
      default:
        console.log("[EMIT OTHER]", { userId, senderId, content: rest.content, postId: rest.postId });

        notification = await NotificationService.createOtherNotification({
          userId,
          senderId,
          content: rest.content || "Bạn có thông báo mới",
          postId: rest.postId || null,
        });

        console.log("[OTHER RESULT]", notification ? `✓ ID=${notification.id}` : "✗ null");
        break;
    }

    if (notification && io) {
      io.to(`user_${userId}`).emit("new_notification", {
        id: notification.id,           
        type: notification.type, 
        content: notification.content,
        sender_id: notification.sender_id,
        post_id: notification.post_id,
        created_at: notification.created_at,
      });

      const unreadCount = await NotificationService.getUnreadCount(userId);
      io.to(`user_${userId}`).emit("unread_count", unreadCount);
    }

    return notification;
  } catch (err) {
    console.error("emitNotification error:", err);
    return null;
  }
};

