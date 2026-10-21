import { useState, useEffect } from "react";
import { X, Send, Link as LinkIcon, Check, Search, Share2, MessageCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from '../constants/api';

const ShareModal = ({ post, onClose, onSuccess }) => {
  const [chatList, setChatList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sharingTimeline, setSharingTimeline] = useState(false);

  const getAuth = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.id;
    const token = localStorage.getItem("token");
    return { userId, token };
  };

  const { userId } = getAuth();

  useEffect(() => {
    const { userId, token } = getAuth();
    if (!userId || !token) return;

    axios
      .get(`${API_URL}/chat/user/${userId}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setChatList(list);
      })
      .catch(console.error);
  }, []);

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/post/${post?.id || ''}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Đã sao chép liên kết bài viết!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Không thể sao chép liên kết");
    }
  };

  const handleShare = async () => {
    try {
      const { userId, token } = getAuth();
      if (!userId || !token) return toast.error("Bạn chưa đăng nhập");

      const defaultContent =
        `Chia sẻ bài viết: ${post?.content?.substring(0, 50) || ""}...`;
      await Promise.all(
        selected.map((chatId) =>
          axios.post(
            `${API_URL}/chat/send`,
            {
              chatId,
              senderId: userId,
              content: message || defaultContent,
              message_type: "shared_post",
              media_url: JSON.stringify({
                postId: post?.id,
                content: post?.content,
                images: post?.image_urls || post?.images || [],
                userId: post?.user?.id || post?.user_id,
                userName: post?.user?.full_name || post?.full_name,
              }),
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      toast.success(`Đã chia sẻ tới ${selected.length} cuộc trò chuyện`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Chia sẻ thất bại");
    }
  };

  const handleShareTimeline = async () => {
    try {
      setSharingTimeline(true);
      const { token } = getAuth();
      if (!token) return toast.error("Bạn chưa đăng nhập");

      await axios.post(
        `${API_URL}/shares`,
        { postId: post?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Đã chia sẻ lên bảng tin của bạn!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Share timeline error:", err);
      toast.error(err?.response?.data?.message || "Chia sẻ thất bại");
    } finally {
      setSharingTimeline(false);
    }
  };

  const filteredChats = chatList.filter((c) =>
    (c.target_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Chia sẻ bài viết</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick action buttons: Copy Link & Share Timeline */}
        <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <LinkIcon size={16} />}
            <span>{copied ? "Đã sao chép" : "Sao chép link"}</span>
          </button>

          <button
            type="button"
            onClick={handleShareTimeline}
            disabled={sharingTimeline}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Share2 size={16} />
            <span>{sharingTimeline ? "Đang chia sẻ..." : "Đăng lên bảng tin"}</span>
          </button>
        </div>

        {/* Direct Send to Chat */}
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle size={14} className="text-indigo-500" />
              Gửi qua Messenger
            </h4>
            {selected.length > 0 && (
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Đã chọn: {selected.length}
              </span>
            )}
          </div>

          {/* Search box for chats */}
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm người nhận..."
              className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-56">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => {
                const isChecked = selected.includes(chat.chat_id);
                return (
                  <label
                    key={`chat-${chat.chat_id}`}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                      isChecked
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const id = chat.chat_id;
                        setSelected((prev) =>
                          checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)
                        );
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />

                    <img
                      src={chat.avatar || (chat.is_group_chat ? "/group.png" : "/default.jpg")}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      alt=""
                      onError={(e) => { e.currentTarget.src = "/default.jpg"; }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {chat.target_name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {chat.last_message || "Chưa có tin nhắn"}
                      </p>
                    </div>
                  </label>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                Không tìm thấy cuộc trò chuyện nào
              </p>
            )}
          </div>

          {/* Optional Message input */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Viết tin nhắn kèm theo (tùy chọn)..."
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              type="button"
              onClick={handleShare}
              disabled={selected.length === 0}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi đến {selected.length} người</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
