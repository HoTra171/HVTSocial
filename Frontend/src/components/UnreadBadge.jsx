import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const UnreadBadge = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = React.useRef(null);

  useEffect(() => {
    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chat/user/${userId}/unread-count`
        );
        setUnreadCount(res.data.count || 0);
      } catch (err) {
        console.error("Failed to fetch unread count:", err);
      }
    };

    fetchUnreadCount();

    // Setup socket for realtime updates
    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    socket.emit("register_user", userId);

    // Lắng nghe tin nhắn mới
    socket.on("receive_message", (data) => {
      // Nếu tin nhắn không phải của mình, tăng số unread
      if (data.sender_id !== userId) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Lắng nghe khi đã đọc tin nhắn
    socket.on("messages_read", ({ chatId, readBy }) => {
      if (readBy === userId) {
        // Refresh unread count
        fetchUnreadCount();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  if (unreadCount === 0) return null;

  return (
    <div className="relative inline-block">
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    </div>
  );
};

export default UnreadBadge;