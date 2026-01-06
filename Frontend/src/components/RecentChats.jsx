import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Search } from "lucide-react";
import axios from "axios";
import { assets } from "../assets/assets.js"
import { io } from "socket.io-client";
import dayjs from "dayjs";

const RecentChats = ({ currentUserId, sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [recentChats, setRecentChats] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const socketRef = useRef(null);
  const joinedRoomsRef = useRef(new Set());

  const myId = Number(currentUserId || localStorage.getItem("userId"));
  const token = localStorage.getItem("token");
  const isMobile = window.innerWidth < 768;

  // Socket: online + realtime message
  useEffect(() => {
    if (!myId) return;

    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register_user", myId);
    });

    // Xử lý lỗi kết nối
    socket.on("connect_error", (error) => {
      console.warn("Socket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    // Online/offline
    socket.on("user_status_changed", ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === "online") next.add(Number(userId));
        else next.delete(Number(userId));
        return next;
      });
    });

    // Tin nhắn mới -> cập nhật last_message và đẩy lên đầu
    socket.on("receive_message", (msg) => {
      if (!msg?.chat_id) return;

      setRecentChats((prev) => {
        const list = [...prev];
        const idx = list.findIndex((c) => Number(c.chat_id) === Number(msg.chat_id));
        if (idx === -1) return prev;

        const old = list[idx];

        const lastText =
          msg.message_type === "text"
            ? msg.content
            : "Media";

        const nextItem = {
          ...old,
          last_message: lastText,
          last_time: msg.created_at || new Date().toISOString(),
          unread_count:
            Number(msg.sender_id) === Number(myId)
              ? (old.unread_count || 0)
              : (old.unread_count || 0) + 1,
        };

        list.splice(idx, 1);
        return [nextItem, ...list];
      });
    });

    return () => {
      // Cleanup: chỉ disconnect nếu socket đã connected hoặc connecting
      if (socket && (socket.connected || socket.connecting)) {
        socket.disconnect();
      }
      socketRef.current = null;
      joinedRoomsRef.current = new Set();
    };
  }, [myId]);

  // Load recent chats
  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        if (!myId) return;

        const res = await axios.get(
          `http://localhost:5000/api/chat/user/${myId}/chats`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );

        const sorted = (res.data || []).sort((a, b) => {
          if ((a.unread_count || 0) > 0 && (b.unread_count || 0) === 0) return -1;
          if ((a.unread_count || 0) === 0 && (b.unread_count || 0) > 0) return 1;
          return new Date(b.last_time || 0) - new Date(a.last_time || 0);
        });

        setRecentChats(sorted);
      } catch (err) {
        console.error("Failed to fetch recent chats:", err);
      }
    };

    fetchRecentChats();
  }, [myId, token]);

  // Join room cho từng chat
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    recentChats.forEach((c) => {
      const id = Number(c.chat_id);
      if (!id) return;
      if (joinedRoomsRef.current.has(id)) return;

      socket.emit("join_chat", id);
      joinedRoomsRef.current.add(id);
    });
  }, [recentChats]);

  const filteredChats = recentChats.filter((u) =>
    (u.full_name || u.chat_name || u.target_name || "")
      .toLowerCase()
      .includes(input.toLowerCase())
  );

  const isOnline = (userId) => onlineUsers.has(Number(userId));

  return (
    <div
      className={`
        bg-white border-r border-gray-200 flex flex-col transition-all duration-300
        w-60 xl:w-72 fixed top-0 left-0 h-screen z-50
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:w-72
      `}
    >
      <div className="p-3 border-b border-gray-200 flex items-center gap-3">
        {/* logo app (click về feed) */}
        <img
          src={assets.logo} // dùng logo như code cũ
          alt="Logo"
          className="w-20 cursor-pointer"
          onClick={() => {
            navigate("/feed");
            if (isMobile) setSidebarOpen(false);
          }}
        />
      </div>
      <div className="p-3 border-b border-gray-200 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1 flex-1">
          <Search size={16} className="text-gray-500" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search"
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Eye size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((u) => (
          <button
            key={u.chat_id}
            onClick={() => {
              if (isMobile) setSidebarOpen(false);
              navigate(`/messages/${u.chat_id}`);
            }}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left cursor-pointer"
          >
            <div className="relative">
              <img
                src={u.is_group_chat ? "/group.png" : u.avatar ||
                   `/default.jpg`
                  }
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              {!u.is_group_chat && (
                <span
                  className={`
                    absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
                    ${isOnline(u.target_id) ? "bg-green-500" : "bg-gray-400"}
                  `}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <p className="font-medium text-sm truncate">
                  {u.full_name || u.target_name || u.chat_name || "Chat"}
                </p>
                <p className="text-[10px] text-gray-400 flex-shrink-0">
                  {u.last_time ? dayjs(u.last_time).fromNow() : ""}
                </p>
              </div>

              <div className="flex justify-between items-center gap-2">
                <p className="text-xs text-gray-500 truncate">
                  {u.last_message || "Media"}
                </p>

                {!!u.unread_count && u.unread_count > 0 && (
                  <span className="min-w-[20px] h-5 px-2 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    {u.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentChats;
