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
  UserX,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../constants/api';
import Loading from '../components/Loading';

const GRADIENTS = [
  'from-indigo-600 via-indigo-500 to-purple-600',
  'from-blue-600 via-cyan-500 to-teal-500',
  'from-violet-600 via-purple-500 to-pink-500',
  'from-fuchsia-600 via-pink-500 to-rose-500',
  'from-emerald-500 via-teal-500 to-cyan-600',
  'from-amber-500 via-orange-500 to-rose-500',
];

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

  // Get current user
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

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setFriends([]);
    setPending([]);
    setSent([]);
    setSuggestions([]);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const [friendsRes, pendingRes, sentRes, suggestionsRes] = await Promise.all([
        axios.get(`${API_URL}/friendships/friends`, config),
        axios.get(`${API_URL}/friendships/pending`, config),
        axios.get(`${API_URL}/friendships/sent`, config),
        axios.get(`${API_URL}/friendships/suggestions?limit=20`, config),
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

      setFriends(deduplicateById(friendsRes.data.data || []));
      setPending(deduplicateById(pendingRes.data.data || []));
      setSent(deduplicateById(sentRes.data.data || []));
      setSuggestions(deduplicateById(suggestionsRes.data.data || []));
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Không thể tải dữ liệu kết nối');
    } finally {
      setLoading(false);
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
    if (!window.confirm('Bạn có chắc muốn hủy kết bạn với người dùng này?')) return;

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

  // Mở chat 1-1
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
      if (!chatId) return toast.error('Không lấy được chatId');

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
  };

  const tabs = [
    {
      key: 'friends',
      label: 'Bạn bè',
      value: friends,
      icon: UserCheck,
      color: 'indigo',
      badgeClass: 'bg-indigo-50 text-indigo-700',
    },
    {
      key: 'pending',
      label: 'Chờ duyệt',
      value: pending,
      icon: Clock,
      color: 'amber',
      badgeClass: 'bg-amber-50 text-amber-700',
    },
    {
      key: 'sent',
      label: 'Đã gửi',
      value: sent,
      icon: UserPlus,
      color: 'sky',
      badgeClass: 'bg-sky-50 text-sky-700',
    },
    {
      key: 'suggestions',
      label: 'Gợi ý kết bạn',
      value: suggestions,
      icon: Sparkles,
      color: 'purple',
      badgeClass: 'bg-purple-50 text-purple-700',
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

  if (loading) {
    return <Loading height="70vh" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Mạng lưới kết nối
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">
                Quản lý bạn bè, phản hồi lời mời và mở rộng quan hệ trên HVT Social
              </p>
            </div>
          </div>
        </div>

        {/* 4 Interactive Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.key;
            const Icon = tab.icon;
            return (
              <div
                key={tab.key}
                onClick={() => goTab(tab.key)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-white border-indigo-500 shadow-lg shadow-indigo-100 ring-2 ring-indigo-500/20'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                    } transition-colors`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {tab.key === 'pending' && tab.value.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white animate-pulse">
                      Mới
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    {tab.value.length}
                  </h3>
                  <p
                    className={`text-xs sm:text-sm font-semibold mt-0.5 ${
                      isActive ? 'text-indigo-600' : 'text-gray-500'
                    }`}
                  >
                    {tab.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation Tab Bar & Search Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => goTab(tab.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                      isActive ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tab.value.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Local search within tab */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Lọc trong ${currentTabObj?.label}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white rounded-xl text-xs sm:text-sm border border-transparent focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((user, idx) => {
            const gradientIndex = (Number(user.id || idx) || 0) % GRADIENTS.length;
            const coverGradient = GRADIENTS[gradientIndex];

            return (
              <div
                key={`${currentTab}-${user.id}`}
                className="group relative flex flex-col justify-between bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                {/* Header Cover Banner */}
                <div className="relative h-20 w-full overflow-hidden bg-gray-100">
                  {user.cover_photo ? (
                    <img
                      src={user.cover_photo}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-r ${coverGradient} opacity-90`} />
                  )}
                </div>

                {/* Avatar & Info */}
                <div className="relative px-5 -mt-9 flex flex-col items-center text-center">
                  <img
                    src={user.avatar || '/default.jpg'}
                    alt={user.full_name}
                    onError={(e) => {
                      e.currentTarget.src = '/default.jpg';
                    }}
                    className="w-18 h-18 rounded-full object-cover ring-4 ring-white shadow-md group-hover:scale-105 transition-transform duration-300"
                  />

                  <h3 className="mt-3 font-bold text-base text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {user.full_name || 'Người dùng'}
                  </h3>

                  <p className="text-gray-400 font-medium text-xs mt-0.5">
                    @{user.username || 'user'}
                  </p>

                  {user.bio ? (
                    <p className="text-gray-600 mt-2 text-xs line-clamp-2 px-1 leading-relaxed">
                      {user.bio}
                    </p>
                  ) : (
                    <p className="text-gray-400 mt-2 text-xs italic">Chưa có tiểu sử</p>
                  )}

                  {/* Mutual friends */}
                  {user.mutual_friends_count > 0 && (
                    <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-[11px] font-semibold mt-3">
                      <Users className="w-3 h-3 text-indigo-600" />
                      <span>{user.mutual_friends_count} bạn chung</span>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div
                  className="p-5 pt-4 mt-3 border-t border-gray-50 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* TAB: FRIENDS */}
                  {currentTab === 'friends' && (
                    <>
                      <button
                        onClick={() => openDirectChat(user.id)}
                        className="flex-1 h-10 px-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Nhắn tin</span>
                      </button>

                      <button
                        onClick={() => handleUnfriend(user.id)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors border border-gray-200 active:scale-95"
                        title="Hủy kết bạn"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* TAB: PENDING (Lời mời chờ duyệt) */}
                  {currentTab === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAcceptRequest(user.id)}
                        className="flex-1 h-10 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Chấp nhận</span>
                      </button>

                      <button
                        onClick={() => handleRejectRequest(user.id)}
                        className="h-10 px-3 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-semibold text-xs sm:text-sm transition-colors border border-gray-200 active:scale-95 flex items-center justify-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Từ chối</span>
                      </button>
                    </>
                  )}

                  {/* TAB: SENT (Lời mời đã gửi) */}
                  {currentTab === 'sent' && (
                    <button
                      onClick={() => handleCancelRequest(user.id)}
                      className="w-full h-10 px-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 font-medium text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 group"
                    >
                      <Clock className="w-4 h-4 text-amber-600 group-hover:hidden" />
                      <X className="w-4 h-4 text-amber-600 hidden group-hover:inline" />
                      <span className="group-hover:hidden">Đang chờ xác nhận</span>
                      <span className="hidden group-hover:inline">Hủy lời mời</span>
                    </button>
                  )}

                  {/* TAB: SUGGESTIONS */}
                  {currentTab === 'suggestions' && (
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      className="w-full h-10 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Kết bạn</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {filteredList.length === 0 && (
            <div className="col-span-full text-center py-20 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-400 mx-auto mb-4 flex items-center justify-center shadow-inner">
                {currentTab === 'friends' && <UserCheck className="w-8 h-8 text-indigo-500" />}
                {currentTab === 'pending' && <Clock className="w-8 h-8 text-amber-500" />}
                {currentTab === 'sent' && <UserPlus className="w-8 h-8 text-sky-500" />}
                {currentTab === 'suggestions' && <Sparkles className="w-8 h-8 text-purple-500" />}
              </div>

              <h3 className="text-base font-bold text-gray-800 mb-1">
                {currentTab === 'friends' && 'Chưa có bạn bè nào'}
                {currentTab === 'pending' && 'Không có lời mời kết bạn nào đang chờ'}
                {currentTab === 'sent' && 'Bạn chưa gửi lời mời kết bạn nào'}
                {currentTab === 'suggestions' && 'Hiện chưa có gợi ý mới'}
              </h3>

              <p className="text-sm text-gray-400 max-w-sm mx-auto mb-4">
                {currentTab === 'friends' &&
                  'Hãy ghé thăm trang Khám phá hoặc tab Gợi ý để tìm kiếm và kết nối với bạn bè mới!'}
                {currentTab === 'pending' &&
                  'Khi người khác gửi lời mời kết bạn cho bạn, yêu cầu sẽ xuất hiện tại đây.'}
                {currentTab === 'sent' &&
                  'Lời mời bạn gửi đi sẽ được lưu ở đây cho đến khi đối phương phản hồi.'}
                {currentTab === 'suggestions' &&
                  'Chúng tôi sẽ liên tục cập nhật thêm những người bạn có thể quen biết.'}
              </p>

              {currentTab !== 'suggestions' && (
                <button
                  onClick={() => goTab('suggestions')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm shadow-indigo-200"
                >
                  Xem gợi ý kết bạn
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connections;
