import React, { useState, useEffect } from 'react';
import {
  User,
  UserPlus,
  UserCheck,
  UserMinus,
  X,
  Check,
  MessagesSquare,
  Clock,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL, SERVER_ORIGIN } from '../constants/api';

const Connections = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

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

      setFriends(friendsRes.data.data || []);
      setPending(pendingRes.data.data || []);
      setSent(sentRes.data.data || []);
      setSuggestions(suggestionsRes.data.data || []);
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Không thể tải dữ liệu');
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Đã gửi lời mời kết bạn');
      fetchAllData(); // Refresh data
    } catch (error) {
      console.error('Send request error:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi lời mời');
    }
  };

  // CHẤP NHẬN LỜI MỜI
  const handleAcceptRequest = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/friendships/accept`,
        { friendId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Đã chấp nhận lời mời');
      fetchAllData();
    } catch (error) {
      console.error('Accept request error:', error);
      toast.error('Không thể chấp nhận lời mời');
    }
  };

  // TỪ CHỐI LỜI MỜI
  const handleRejectRequest = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/friendships/reject`,
        { friendId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Đã từ chối lời mời');
      fetchAllData();
    } catch (error) {
      console.error('Reject request error:', error);
      toast.error('Không thể từ chối lời mời');
    }
  };

  // HỦY LỜI MỜI ĐÃ GỬI
  const handleCancelRequest = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/friendships/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { friendId },
      });

      toast.success('Đã hủy lời mời');
      fetchAllData();
    } catch (error) {
      console.error('Cancel request error:', error);
      toast.error('Không thể hủy lời mời');
    }
  };

  // HỦY KẾT BẠN
  const handleUnfriend = async (friendId) => {
    if (!window.confirm('Bạn có chắc muốn hủy kết bạn?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/friendships/unfriend`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { friendId },
      });

      toast.success('Đã hủy kết bạn');
      fetchAllData();
    } catch (error) {
      console.error('Unfriend error:', error);
      toast.error('Không thể hủy kết bạn');
    }
  };

  // Mở đúng đoạn chat 1-1 theo friendId (map friendId -> chat_id)
  const openDirectChat = async (targetUserId) => {
    const token = localStorage.getItem("token");
    if (!token || !currentUser?.id) return toast.error("Bạn chưa đăng nhập");

    try {
      // tạo hoặc lấy phòng 1-1
      const dmRes = await axios.post(
        `${API_URL}/chat/dm`,
        { receiverId: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatId = dmRes.data?.chatId;
      if (!chatId) return toast.error("Không lấy được chatId");

      navigate(`/messages/${chatId}`);
    } catch (err) {
      console.error("openDirectChat error:", err);
      toast.error(err.response?.data?.error || "Không mở được đoạn chat");
    }
  };

  const ALLOWED_TABS = new Set(["friends", "pending", "sent", "suggestions"]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (ALLOWED_TABS.has(tabFromUrl)) {
      setCurrentTab(tabFromUrl);
    }
  }, [searchParams]);

  const goTab = (key) => {
    setCurrentTab(key);
    setSearchParams({ tab: key }); // hoặc navigate(`/connections?tab=${key}`)
  };

  const tabs = [
    { key: 'friends', label: 'Bạn bè', value: friends, icon: UserCheck },
    { key: 'pending', label: 'Lời mời chờ duyệt', value: pending, icon: Clock },
    { key: 'sent', label: 'Lời mời đã gửi', value: sent, icon: UserPlus },
    { key: 'suggestions', label: 'Gợi ý', value: suggestions, icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 sm:-ml-46">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900">Kết nối</h1>
          </div>
          <p className="text-slate-600">
            Quản lý mạng lưới của bạn và khám phá những kết nối mới
          </p>
        </div>

        {/* Counts */}
        <div className="mb-8 flex flex-wrap gap-6">
          {tabs.map((item) => (
            <div
              key={item.key}
              className="flex flex-col items-center justify-center gap-1 border
              h-20 w-40 border-gray-200 bg-white shadow rounded-md cursor-pointer
              hover:border-indigo-300 transition"
              onClick={() => goTab(item.key)}
            >
              <b className="text-2xl text-indigo-600">{item.value.length}</b>
              <p className="text-slate-600 text-sm">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="inline-flex flex-wrap items-center border border-gray-200
        rounded-md p-1 bg-white shadow-sm mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => goTab(tab.key)}
              className={`flex items-center px-3 py-1 text-sm rounded-md transition
                ${currentTab === tab.key
                  ? 'bg-indigo-600 font-medium text-white'
                  : 'text-gray-500 hover:text-black'
                }`}
            >
              <tab.icon className="w-4 h-4 mr-1" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* User List */}
        <div className="flex flex-wrap gap-6 mt-6">
          {tabs
            .find((item) => item.key === currentTab)
            ?.value.map((user) => (
              <div
                key={`tra-${user.id}`}
                // key={`${currentTab}-${user.id}`}
                className="w-full max-w-[360px] flex gap-5 p-5 bg-white shadow rounded-md
                hover:shadow-lg transition"
              >
                <img
                  src={user.avatar || '/default.jpg'}
                  alt=""
                  className="rounded-full w-12 h-12 shadow-md cursor-pointer"
                  onClick={() => navigate(`/profile/${user.id}`)}
                />

                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-slate-700 cursor-pointer hover:text-indigo-600 truncate"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    {user.full_name}
                  </p>
                  <p className="text-slate-500 text-sm truncate">@{user.username}</p>
                  <p className="text-sm text-gray-600 truncate">
                    {user.bio ? `${user.bio.slice(0, 40)}...` : ''}
                  </p>

                  {/* Hiển thị mutual friends nếu là suggestions */}
                  {currentTab === 'suggestions' && user.mutual_friends_count > 0 && (
                    <p className="text-xs text-indigo-600 mt-1">
                      {user.mutual_friends_count} bạn chung
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* TAB: FRIENDS */}
                    {currentTab === 'friends' && (
                      <>
                        <button
                          onClick={() => navigate(`/profile/${user.id}`)}
                          className="px-3 py-1.5 text-sm rounded-md bg-indigo-600
                          hover:bg-indigo-700 text-white transition active:scale-95"
                        >
                          Xem trang cá nhân
                        </button>
                        <button
                          onClick={() => openDirectChat(user.id)}
                          className="px-3 py-1.5 text-sm rounded-md bg-slate-100 
                          hover:bg-slate-200 text-slate-800 transition active:scale-95
                          flex items-center gap-1"
                        >
                          <MessagesSquare className="w-4 h-4" />
                          Nhắn tin
                        </button>
                        <button
                          onClick={() => handleUnfriend(user.id)}
                          className="px-3 py-1.5 text-sm rounded-md border border-red-200
                          bg-red-50 hover:bg-red-100 text-red-600 transition active:scale-95
                          flex items-center gap-1"
                        >
                          <UserMinus className="w-4 h-4" />
                          Hủy kết bạn
                        </button>
                      </>
                    )}

                    {/* TAB: PENDING (lời mời chờ duyệt) */}
                    {currentTab === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAcceptRequest(user.id)}
                          className="px-3 py-1.5 text-sm rounded-md bg-green-600
                          hover:bg-green-700 text-white transition active:scale-95
                          flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Chấp nhận
                        </button>
                        <button
                          onClick={() => handleRejectRequest(user.id)}
                          className="px-3 py-1.5 text-sm rounded-md border border-red-200
                          bg-red-50 hover:bg-red-100 text-red-600 transition active:scale-95
                          flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Từ chối
                        </button>
                      </>
                    )}

                    {/* TAB: SENT (lời mời đã gửi) */}
                    {currentTab === 'sent' && (
                      <button
                        onClick={() => handleCancelRequest(user.id)}
                        className="px-3 py-1.5 text-sm rounded-md border border-gray-200
                        bg-white hover:bg-gray-50 text-gray-700 transition active:scale-95
                        flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Hủy lời mời
                      </button>
                    )}

                    {/* TAB: SUGGESTIONS */}
                    {currentTab === 'suggestions' && (
                      <>
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          className="px-3 py-1.5 text-sm rounded-md bg-indigo-600
                          hover:bg-indigo-700 text-white transition active:scale-95
                          flex items-center gap-1"
                        >
                          <UserPlus className="w-4 h-4" />
                          Kết bạn
                        </button>
                        <button
                          onClick={() => navigate(`/profile/${user.id}`)}
                          className="px-3 py-1.5 text-sm rounded-md bg-slate-100
                          hover:bg-slate-200 text-slate-800 transition active:scale-95"
                        >
                          Xem trang
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* Empty state */}
          {tabs.find((item) => item.key === currentTab)?.value.length === 0 && (
            <div className="w-full text-center py-16">
              <p className="text-gray-500">Không có dữ liệu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connections;
