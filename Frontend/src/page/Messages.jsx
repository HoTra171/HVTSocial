import React, { useEffect, useState } from "react";
import { MessagesSquare, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL, SERVER_ORIGIN } from '../constants/api';
import Loading from '../components/Loading'; 

const Messages = () => {
  const navigate = useNavigate();
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          navigate("/");
          return;
        }

        // 1) Lấy user hiện tại từ backend
        const meRes = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userId = meRes.data?.user?.id;
        if (!userId) {
          setLoading(false);
          navigate("/");
          return;
        }

        // 2) Lấy danh sách chat theo userId
        const res = await axios.get(
          `${API_URL}/chat/user/${userId}/chats`,
          { headers: { Authorization: `Bearer ${token}` } } // nếu backend cần auth
        );

        const raw = res.data || [];

        const uniqueChats = Object.values(
          raw.reduce((acc, chat) => {
            const id = chat.chat_id;
            if (!acc[id] || new Date(chat.last_time) > new Date(acc[id].last_time)) {
              acc[id] = chat;
            }
            return acc;
          }, {})
        );
        const sorted = [...uniqueChats].sort((a, b) => {
          if ((a.unread_count || 0) > 0 && (b.unread_count || 0) === 0) return -1;
          if ((a.unread_count || 0) === 0 && (b.unread_count || 0) > 0) return 1;
          return new Date(b.last_time || 0) - new Date(a.last_time || 0);
        });

        setChatList(sorted);
        setLoading(false);
      } catch (err) {
        console.error("Error loading chats:", err);
        setLoading(false);
      }
    };

    fetchChats();
  }, [navigate]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen relative bg-slate-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-2">
          <MessagesSquare className="w-7 h-7 md:w-8 md:h-8 text-indigo-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Tin nhắn</h1>
        </div>

        <p className="text-slate-600 mb-6 md:mb-8 text-sm md:text-base">Trò chuyện với bạn bè và người thân của bạn</p>

        <div className="flex flex-col gap-3">
          {chatList.map((item) => (
            <div
              key={item.chat_id}
              onClick={() => navigate(`/messages/${item.chat_id}`)}
              className="w-full flex items-center gap-4 p-4 bg-white shadow rounded-md cursor-pointer hover:bg-gray-50 transition"
            >
              <img
                src={item.avatar || (item.is_group_chat ? "/group.png" : "/default.jpg")}
                alt=""
                className="rounded-full w-12 h-12 object-cover flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-700">{item.target_name}</p>

                  {item.unread_count > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                      {item.unread_count > 99 ? "99+" : item.unread_count}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mt-1 truncate">
                  {item.last_message ||
                    (item.last_message_type === "image"
                      ? "📷 Ảnh"
                      : item.last_message_type === "voice"
                        ? "🎤 Tin nhắn thoại"
                        : "Chưa có tin nhắn nào")}
                </p>
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/messages/${item.chat_id}`);
                  }}
                  className="w-10 h-10 flex items-center justify-center text-sm rounded 
                    bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition"
                >
                  <MessagesSquare className="w-4 h-4" />
                </button>

                {item.target_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${item.target_id}`);
                    }}
                    className="w-10 h-10 flex items-center justify-center text-sm rounded
                      bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {chatList.length === 0 && (
            <p className="text-sm text-slate-500">Bạn chưa có cuộc trò chuyện nào.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
