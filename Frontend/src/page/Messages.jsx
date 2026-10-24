import React, { useEffect, useState } from 'react';
import {
  MessagesSquare,
  Search,
  UserPlus,
  Users,
  MessageCircle,
  Clock,
  Sparkles,
  CheckCheck,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, SERVER_ORIGIN } from '../constants/api';
import { safeFromNow } from '../utils/dateHelpers';
import CreateGroupModal from '../components/chat/CreateGroupModal.jsx';

const Messages = () => {
  const navigate = useNavigate();
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'groups'
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchChats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (isMounted) setLoading(false);
          navigate('/');
          return;
        }

        // 1) Lấy user hiện tại từ backend
        const meRes = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userId = meRes.data?.user?.id;
        if (!userId) {
          if (isMounted) setLoading(false);
          navigate('/');
          return;
        }
        if (isMounted) setCurrentUserId(userId);

        // 2) Lấy danh sách chat theo userId
        const res = await axios.get(`${API_URL}/chat/user/${userId}/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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

        if (isMounted) {
          setChatList(sorted);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading chats:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchChats();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Counts
  const totalUnread = chatList.reduce((acc, c) => acc + (Number(c.unread_count) > 0 ? 1 : 0), 0);
  const totalGroups = chatList.filter((c) => Boolean(c.is_group_chat)).length;

  // Filter based on search term and filter tab
  const filteredChats = chatList.filter((chat) => {
    const nameMatch = (chat.target_name || chat.chat_name || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const messageMatch = (chat.last_message || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesSearch = nameMatch || messageMatch;
    if (!matchesSearch) return false;

    if (filterTab === 'unread') {
      return Number(chat.unread_count) > 0;
    }
    if (filterTab === 'groups') {
      return Boolean(chat.is_group_chat);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 sm:py-8 px-3 sm:px-6 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <MessagesSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Tin nhắn
                </h1>
                {totalUnread > 0 && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white shadow-sm">
                    {totalUnread} chưa đọc
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Trò chuyện, kết nối và chia sẻ khoảnh khắc cùng bạn bè
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-semibold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tạo nhóm</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/connections')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tìm bạn bè</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm mb-5 backdrop-blur-md">
          {/* Search Input */}
          <div className="relative mb-3.5">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl leading-5 bg-slate-50 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              placeholder="Tìm kiếm theo tên người dùng hoặc nội dung tin nhắn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Tất cả</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {chatList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('unread')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === 'unread'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Chưa đọc</span>
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                  {totalUnread}
                </span>
              )}
            </button>

            {totalGroups > 0 && (
              <button
                type="button"
                onClick={() => setFilterTab('groups')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filterTab === 'groups'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Nhóm chat</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  filterTab === 'groups' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {totalGroups}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* CHAT LIST */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse"
              >
                <div className="w-13 h-13 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-2/3" />
                </div>
                <div className="w-12 h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
              </div>
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          <div className="space-y-2.5">
            {filteredChats.map((item) => {
              const hasUnread = Number(item.unread_count) > 0;
              const formattedTime = safeFromNow(item.last_time);

              return (
                <div
                  key={item.chat_id}
                  onClick={() => navigate(`/messages/${item.chat_id}`)}
                  className={`w-full flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 border group ${
                    hasUnread
                      ? 'bg-gradient-to-r from-indigo-50/90 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 border-indigo-200 dark:border-indigo-900/60 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700'
                      : 'bg-white dark:bg-slate-900/90 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  {/* Avatar with Online/Unread Dot */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.avatar || (item.is_group_chat ? '/group.png' : '/default.jpg')}
                      alt={item.target_name || 'User'}
                      className="rounded-full w-12 h-12 sm:w-13 sm:h-13 object-cover border border-slate-100 dark:border-slate-800 shadow-sm ring-2 ring-white dark:ring-slate-900 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.src = item.is_group_chat ? '/group.png' : '/default.jpg';
                      }}
                    />
                    {/* Status Dot */}
                    {hasUnread ? (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-900/50 animate-pulse" />
                    ) : (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" />
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className={`text-sm sm:text-base font-bold truncate transition-colors ${
                          hasUnread
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`}>
                          {item.target_name || item.chat_name || 'Cuộc trò chuyện'}
                        </h3>
                        {item.is_group_chat && (
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            Nhóm
                          </span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className={`text-[11px] sm:text-xs flex-shrink-0 font-medium ${
                        hasUnread
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {formattedTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs sm:text-sm truncate ${
                        hasUnread
                          ? 'text-slate-900 dark:text-slate-100 font-semibold'
                          : 'text-slate-500 dark:text-slate-400 font-normal'
                      }`}>
                        {item.last_message ||
                          (item.last_message_type === 'image'
                            ? '📷 Đã gửi một hình ảnh'
                            : item.last_message_type === 'voice'
                              ? '🎤 Tin nhắn thoại'
                              : 'Bắt đầu cuộc trò chuyện mới')}
                      </p>

                      {/* Unread Counter Badge */}
                      {hasUnread && (
                        <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-sm flex-shrink-0">
                          {item.unread_count > 99 ? '99+' : item.unread_count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 hidden sm:block">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto mb-4 flex items-center justify-center shadow-inner">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1.5">
              {searchTerm ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có cuộc trò chuyện nào'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
              {searchTerm
                ? 'Hãy thử tìm kiếm với từ khóa khác hoặc kiểm tra lại chính tả.'
                : 'Bắt đầu kết nối với bạn bè hoặc tạo cuộc trò chuyện mới để chia sẻ tin nhắn!'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/connections')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Khám phá bạn bè ngay</span>
            </button>
          </div>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        currentUserId={currentUserId}
        onGroupCreated={(newGroup) => {
          navigate(`/messages/${newGroup.chat_id || newGroup.id}`);
        }}
      />
    </div>
  );
};

export default Messages;
