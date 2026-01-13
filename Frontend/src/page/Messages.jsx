import React, { useEffect, useState } from "react";
import { MessagesSquare, Eye, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL, SERVER_ORIGIN } from '../constants/api';
import Loading from '../components/Loading';

const Messages = () => {
  const navigate = useNavigate();
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filter based on search term
  const filteredChats = chatList.filter((chat) =>
    (chat.target_name || chat.chat_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen relative bg-slate-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-2">
          <MessagesSquare className="w-7 h-7 md:w-8 md:h-8 text-indigo-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Tin nhắn</h1>
        </div>

        <p className="text-slate-600 mb-6 md:mb-8 text-sm md:text-base">Trò chuyện với bạn bè và người thân của bạn</p>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
            placeholder="Tìm kiếm người dùng hoặc tin nhắn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3">
          {filteredChats.map((item) => (
            <div
              key={item.chat_id}
              onClick={() => navigate(`/messages/${item.chat_id}`)}
              className="w-full flex items-center gap-4 p-4 bg-white shadow-sm border border-gray-100 rounded-xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 transition duration-200 group"
            >
              <img
                src={item.avatar || (item.is_group_chat ? "/group.png" : "/default.jpg")}
                alt=""
                className="rounded-full w-12 h-12 object-cover flex-shrink-0 border border-gray-100"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{item.target_name}</p>

                  {item.unread_count > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-sm">
                      {item.unread_count > 99 ? "99+" : item.unread_count}
                    </span>
                  )}
                </div>

                <p className={`text-sm mt-0.5 truncate ${item.unread_count > 0 ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                  {item.last_message ||
                    (item.last_message_type === "image"
                      ? "📷 Ảnh"
                      : item.last_message_type === "voice"
                        ? "🎤 Tin nhắn thoại"
                        : "Chưa có tin nhắn nào")}
                </p>
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
                {/* Icons kept but visually improved if needed, but keeping logic simple for now */}
              </div>
            </div>
          ))}

          {filteredChats.length === 0 && (
            <div className="text-center py-10">
              <p className="text-slate-500">
                {searchTerm ? "Không tìm thấy kết quả nào." : "Bạn chưa có cuộc trò chuyện nào."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
