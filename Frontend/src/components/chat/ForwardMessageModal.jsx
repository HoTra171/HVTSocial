import React, { useState, useEffect } from 'react';
import { X, Search, Send, Check, Users, User } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../constants/api';
import { getFullImageUrl, handleImageError } from '../../utils/imageHelper';

export const ForwardMessageModal = ({
  isOpen,
  onClose,
  messageToForward,
  currentUserId,
}) => {
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [forwardedChatIds, setForwardedChatIds] = useState(new Set());
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    axios
      .get(`${API_URL}/chat/user/${currentUserId}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const unique = Object.values(
          raw.reduce((acc, c) => {
            if (!acc[c.chat_id] || new Date(c.last_time) > new Date(acc[c.chat_id].last_time)) {
              acc[c.chat_id] = c;
            }
            return acc;
          }, {})
        );
        setChatList(unique);
      })
      .catch((err) => {
        console.error('Error fetching chats for forward:', err);
        toast.error('Không tải được danh sách trò chuyện');
      })
      .finally(() => setLoading(false));
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  const filteredChats = chatList.filter((c) => {
    const name = (c.chat_name || c.target_name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleForward = async (targetChatId) => {
    if (!messageToForward || sendingId) return;

    try {
      setSendingId(targetChatId);
      const token = localStorage.getItem('token');

      await axios.post(
        `${API_URL}/chat/send`,
        {
          chatId: targetChatId,
          senderId: currentUserId,
          content: messageToForward.content || '',
          message_type: messageToForward.message_type || 'text',
          media_url: messageToForward.media_url || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setForwardedChatIds((prev) => new Set([...prev, targetChatId]));
      toast.success('Đã chuyển tiếp tin nhắn!');
    } catch (err) {
      console.error('Forward message error:', err);
      toast.error('Chuyển tiếp tin nhắn thất bại');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Chuyển tiếp tin nhắn
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-100 flex-shrink-0">
            Nội dung:
          </span>
          <span className="truncate italic">
            {messageToForward?.content ||
              (messageToForward?.message_type === 'image'
                ? '📷 Hình ảnh'
                : messageToForward?.message_type === 'file'
                  ? '📎 Tệp đính kèm'
                  : 'Tin nhắn')}
          </span>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm người hoặc nhóm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-medium border border-transparent focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* List of chats */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Đang tải cuộc trò chuyện...</div>
          ) : filteredChats.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">Không tìm thấy cuộc trò chuyện nào</div>
          ) : (
            filteredChats.map((chat) => {
              const isGroup = Boolean(chat.is_group_chat);
              const name = isGroup
                ? chat.chat_name || 'Nhóm trò chuyện'
                : chat.target_name || 'Người dùng';
              const avatar = chat.avatar;
              const isSent = forwardedChatIds.has(chat.chat_id);
              const isSending = sendingId === chat.chat_id;

              return (
                <div
                  key={chat.chat_id}
                  className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {avatar ? (
                      <img
                        src={getFullImageUrl(avatar)}
                        alt={name}
                        onError={handleImageError}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                        {isGroup ? <Users size={18} /> : <User size={18} />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {isGroup ? 'Nhóm trò chuyện' : 'Bạn bè'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSent || isSending}
                    onClick={() => handleForward(chat.chat_id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSent
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95 disabled:opacity-50'
                    }`}
                  >
                    {isSent ? (
                      <>
                        <Check size={14} />
                        <span>Đã gửi</span>
                      </>
                    ) : isSending ? (
                      <span>Đang gửi...</span>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Gửi</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;
