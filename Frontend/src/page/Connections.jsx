import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  X,
  Check,
  MessageCircle,
  Clock,
  Sparkles,
  Search,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../constants/api';

const GRADIENTS = [
  'from-indigo-600 via-purple-600 to-pink-500',
  'from-blue-600 via-indigo-600 to-purple-600',
  'from-violet-600 via-fuchsia-600 to-rose-500',
  'from-emerald-500 via-teal-600 to-cyan-600',
  'from-amber-500 via-rose-500 to-purple-600',
  'from-pink-500 via-purple-500 to-indigo-600',
];

const ConnectionCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs animate-pulse flex flex-col justify-between">
    <div className="h-24 bg-slate-200 dark:bg-slate-800 w-full" />
    <div className="px-5 -mt-10 flex flex-col items-center">
      <div className="w-20 h-20 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900" />
      <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg mt-3" />
      <div className="w-20 h-3 bg-slate-100 dark:bg-slate-800 rounded mt-1.5" />
      <div className="w-40 h-3 bg-slate-100 dark:bg-slate-800 rounded mt-3" />
    </div>
    <div className="p-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
      <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
    </div>
  </div>
);

const Connections = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentTab, setCurrentTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unfriendConfirmId, setUnfriendConfirmId] = useState(null);

  // Lấy thông tin user hiện tại
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Parse user error:', e);
      }
    }
  }, []);

  // Fetch dữ liệu tất cả các tab
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const [friendsRes, pendingRes, sentRes, suggestionsRes] = await Promise.all([
        axios.get(`${API_URL}/friendships/friends`, config).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/friendships/pending`, config).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/friendships/sent`, config).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/friendships/suggestions?limit=24`, config).catch(() => ({ data: { data: [] } })),
      ]);

      const deduplicateById = (array) => {
        const seen = new Set();
        return array.filter((item) => {
          const id = item.id || item.user_id || item.friend_id;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      };

      setFriends(deduplicateById(friendsRes.data?.data || []));
      setPending(deduplicateById(pendingRes.data?.data || []));
      setSent(deduplicateById(sentRes.data?.data || []));
      setSuggestions(deduplicateById(suggestionsRes.data?.data || []));

      if (isManualRefresh) {
        toast.success('Đã cập nhật danh sách kết nối');
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Không thể tải dữ liệu kết nối');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // GỬI LỜI MỜI KẾT BẠN
  const handleSendRequest = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/friendships/send-request`,
        { friendId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã gửi lời mời kết bạn');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi lời mời');
    }
  };

  // CHẤP NHẬN LỜI MỜI
  const handleAcceptRequest = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/friendships/accept`,
        { friendId: Number(friendId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã trở thành bạn bè!');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể chấp nhận lời mời');
    }
  };

  // TỪ CHỐI LỜI MỜI
  const handleRejectRequest = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/friendships/reject`,
        { friendId: Number(friendId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã từ chối lời mời');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể từ chối');
    }
  };

  // HỦY LỜI MỜI ĐÃ GỬI
  const handleCancelRequest = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/friendships/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { friendId: Number(friendId) },
      });
      toast.success('Đã hủy lời mời kết bạn');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hủy lời mời');
    }
  };

  // HỦY KẾT BẠN
  const handleUnfriend = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/friendships/unfriend`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { friendId: Number(friendId) },
      });
      toast.success('Đã hủy kết bạn');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hủy kết bạn');
    }
  };

  // MỞ CHAT 1-1
  const openDirectChat = async (targetUserId) => {
    const token = localStorage.getItem('token');
    if (!token || !currentUser?.id) return toast.error('Bạn chưa đăng nhập');

    try {
      const dmRes = await axios.post(
        `${API_URL}/chat/dm`,
        { receiverId: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatId = dmRes.data?.chatId;
      if (!chatId) return toast.error('Không lấy được cuộc trò chuyện');

      navigate(`/messages/${chatId}`);
    } catch (err) {
      console.error('openDirectChat error:', err);
      toast.error(err.response?.data?.error || 'Không mở được đoạn chat');
    }
  };

  const ALLOWED_TABS = new Set(['friends', 'pending', 'sent', 'suggestions']);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (ALLOWED_TABS.has(tabFromUrl)) {
      setCurrentTab(tabFromUrl);
    }
  }, [searchParams]);

  const goTab = (key) => {
    setCurrentTab(key);
    setSearchParams({ tab: key });
    setSearchTerm('');
  };

  const tabs = [
    {
      key: 'friends',
      label: 'Bạn bè',
      value: friends,
      icon: UserCheck,
      badgeColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
    {
      key: 'pending',
      label: 'Chờ duyệt',
      value: pending,
      icon: Clock,
      badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      hasAlert: pending.length > 0,
    },
    {
      key: 'sent',
      label: 'Đã gửi',
      value: sent,
      icon: UserPlus,
      badgeColor: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
    },
    {
      key: 'suggestions',
      label: 'Gợi ý kết bạn',
      value: suggestions,
      icon: Sparkles,
      badgeColor: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
    },
  ];

  const currentTabObj = tabs.find((item) => item.key === currentTab);
  const rawList = currentTabObj?.value || [];

  const filteredList = searchTerm.trim()
    ? rawList.filter((u) => {
        const query = searchTerm.toLowerCase();
        return (
          u.full_name?.toLowerCase().includes(query) ||
          u.username?.toLowerCase().includes(query) ||
          u.bio?.toLowerCase().includes(query)
        );
      })
    : rawList;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8">

        {/* ============================================================== */}
        {/* HEADER SECTION (CLEAN & MODERN SOCIAL BANNER) */}
        {/* ============================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Mạng lưới kết nối
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                  {friends.length} bạn bè
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Quản lý bạn bè, phản hồi lời mời và khám phá thêm nhiều người bạn mới
              </p>
            </div>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => fetchAllData(true)}
              disabled={refreshing || loading}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CONNECTIONS SEGMENT BUTTON TABS (DISCOVER STYLE) */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          {/* Segment Button Tabs (like Discover) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none no-scrollbar">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.key;
              const Icon = tab.icon;
              const count = tab.value.length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => goTab(tab.key)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isActive
                        ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                        : tab.hasAlert
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                  {tab.hasAlert && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72 flex-shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={`Tìm trong ${currentTabObj?.label}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-900 rounded-xl text-xs sm:text-sm font-medium border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter results info if searching */}
        {searchTerm.trim() && (
          <div className="mb-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Tìm thấy <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{filteredList.length}</strong> kết quả phù hợp cho &quot;{searchTerm}&quot;
            </span>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* USERS GRID OR SKELETONS */}
        {/* ============================================================== */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ConnectionCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredList.map((user, idx) => {
              const gradientIndex = (Number(user.id || idx) || 0) % GRADIENTS.length;
              const coverGradient = GRADIENTS[gradientIndex];

              return (
                <div
                  key={`${currentTab}-${user.id}`}
                  className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  {/* Card Cover Banner */}
                  <div className="relative h-24 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {user.cover_photo || user.background ? (
                      <img
                        src={user.cover_photo || user.background}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-r ${coverGradient} opacity-90`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Avatar & User Details */}
                  <div className="relative px-5 -mt-10 flex flex-col items-center text-center">
                    <div className="relative">
                      <img
                        src={user.avatar || user.profile_picture || '/default.jpg'}
                        alt={user.full_name || 'Người dùng'}
                        onError={(e) => {
                          e.currentTarget.src = '/default.jpg';
                        }}
                        className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-slate-900 shadow-md group-hover:scale-105 transition-transform duration-300 bg-white dark:bg-slate-800"
                      />
                    </div>

                    <h3 className="mt-3 font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {user.full_name || 'Người dùng'}
                    </h3>

                    <p className="text-slate-400 dark:text-slate-500 font-medium text-xs mt-0.5">
                      @{user.username || 'user'}
                    </p>

                    {user.bio ? (
                      <p className="text-slate-600 dark:text-slate-400 mt-2 text-xs line-clamp-2 px-1 leading-relaxed">
                        {user.bio}
                      </p>
                    ) : (
                      <p className="text-slate-400 dark:text-slate-500 mt-2 text-xs italic">
                        Chưa có tiểu sử
                      </p>
                    )}

                    {/* Mutual Friends Pill */}
                    {Number(user.mutual_friends_count) > 0 && (
                      <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-[11px] font-semibold mt-3">
                        <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{user.mutual_friends_count} bạn chung</span>
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div
                    className="p-4 pt-3 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* TAB: FRIENDS */}
                    {currentTab === 'friends' && (
                      <>
                        <button
                          type="button"
                          onClick={() => openDirectChat(user.id)}
                          className="flex-1 h-10 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Nhắn tin</span>
                        </button>

                        {unfriendConfirmId === user.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                handleUnfriend(user.id);
                                setUnfriendConfirmId(null);
                              }}
                              className="h-10 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
                            >
                              Hủy?
                            </button>
                            <button
                              type="button"
                              onClick={() => setUnfriendConfirmId(null)}
                              className="h-10 w-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs transition cursor-pointer"
                              title="Hủy thao tác"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setUnfriendConfirmId(user.id)}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors border border-slate-200 dark:border-slate-700 active:scale-95 cursor-pointer"
                            title="Hủy kết bạn"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}

                    {/* TAB: PENDING (Lời mời chờ duyệt) */}
                    {currentTab === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(user.id)}
                          className="flex-1 h-10 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Chấp nhận</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRejectRequest(user.id)}
                          className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-semibold text-xs sm:text-sm transition-colors border border-slate-200 dark:border-slate-700 active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                          title="Từ chối lời mời"
                        >
                          <X className="w-4 h-4" />
                          <span>Từ chối</span>
                        </button>
                      </>
                    )}

                    {/* TAB: SENT (Lời mời đã gửi) */}
                    {currentTab === 'sent' && (
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(user.id)}
                        className="w-full h-10 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-amber-200 dark:border-amber-800 hover:border-rose-200 dark:hover:border-rose-800 text-amber-800 dark:text-amber-300 hover:text-rose-600 dark:hover:text-rose-400 font-semibold text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 group/btn cursor-pointer"
                      >
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover/btn:hidden" />
                        <X className="w-4 h-4 text-rose-600 dark:text-rose-400 hidden group-hover/btn:inline" />
                        <span className="group-hover/btn:hidden">Đang chờ phản hồi</span>
                        <span className="hidden group-hover/btn:inline">Hủy lời mời</span>
                      </button>
                    )}

                    {/* TAB: SUGGESTIONS */}
                    {currentTab === 'suggestions' && (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(user.id)}
                        className="w-full h-10 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Thêm bạn bè</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {filteredList.length === 0 && (
              <div className="col-span-full text-center py-20 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 mx-auto mb-4 flex items-center justify-center shadow-inner">
                  {currentTab === 'friends' && <UserCheck className="w-8 h-8" />}
                  {currentTab === 'pending' && <Clock className="w-8 h-8 text-amber-500" />}
                  {currentTab === 'sent' && <UserPlus className="w-8 h-8 text-sky-500" />}
                  {currentTab === 'suggestions' && <Sparkles className="w-8 h-8 text-purple-500" />}
                </div>

                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                  {searchTerm.trim()
                    ? 'Không tìm thấy kết quả phù hợp'
                    : currentTab === 'friends'
                    ? 'Chưa có bạn bè nào'
                    : currentTab === 'pending'
                    ? 'Không có lời mời kết bạn nào đang chờ'
                    : currentTab === 'sent'
                    ? 'Bạn chưa gửi lời mời kết bạn nào'
                    : 'Hiện chưa có gợi ý mới'}
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                  {searchTerm.trim()
                    ? `Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm hiện tại.`
                    : currentTab === 'friends'
                    ? 'Hãy ghé thăm tab Gợi ý hoặc Khám phá để mở rộng mạng lưới bạn bè của bạn!'
                    : currentTab === 'pending'
                    ? 'Khi người khác gửi lời mời kết bạn cho bạn, yêu cầu sẽ xuất hiện tại đây.'
                    : currentTab === 'sent'
                    ? 'Lời mời bạn gửi đi sẽ được lưu ở đây cho đến khi đối phương phản hồi.'
                    : 'Chúng tôi sẽ liên tục cập nhật thêm những người bạn có thể quen biết.'}
                </p>

                {searchTerm.trim() ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition active:scale-95 cursor-pointer"
                  >
                    Xóa tìm kiếm
                  </button>
                ) : currentTab !== 'suggestions' ? (
                  <button
                    type="button"
                    onClick={() => goTab('suggestions')}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-semibold transition shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
                  >
                    Xem gợi ý kết bạn ngay
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/discover')}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-semibold transition shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
                  >
                    Khám phá cộng đồng
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;
