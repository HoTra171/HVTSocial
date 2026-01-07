import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserMinus, Clock, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL, SERVER_ORIGIN } from '../constants/api';

const API_URL = 'http://localhost:5000/api';

const FriendButton = ({ userId, currentUserId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !currentUserId || userId === currentUserId) {
      setLoading(false);
      return;
    }
    fetchStatus();
  }, [userId, currentUserId]);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/friendships/status/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(res.data.status);
    } catch (error) {
      console.error('Fetch status error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/friendships/send-request`,
        { friendId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã gửi lời mời kết bạn');
      setStatus('pending_sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi lời mời');
    }
  };

  const handleAccept = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/friendships/accept`,
        { friendId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã chấp nhận lời mời');
      setStatus('friends');
    } catch (error) {
      toast.error('Không thể chấp nhận lời mời');
    }
  };

  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/friendships/reject`,
        { friendId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã từ chối lời mời');
      setStatus(null);
    } catch (error) {
      toast.error('Không thể từ chối');
    }
  };

  const handleCancel = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/friendships/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { friendId: userId },
      });
      toast.success('Đã hủy lời mời');
      setStatus(null);
    } catch (error) {
      toast.error('Không thể hủy lời mời');
    }
  };

  const handleUnfriend = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy kết bạn?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/friendships/unfriend`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { friendId: userId },
      });
      toast.success('Đã hủy kết bạn');
      setStatus(null);
    } catch (error) {
      toast.error('Không thể hủy kết bạn');
    }
  };

  // Không hiển thị nếu là chính mình
  if (!userId || !currentUserId || userId === currentUserId) {
    return null;
  }

  if (loading) {
    return (
      <button
        className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
        disabled
      >
        Đang tải...
      </button>
    );
  }

  // STATUS: null (không có quan hệ)
  if (!status) {
    return (
      <button
        onClick={handleSendRequest}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg
        transition flex items-center gap-2 active:scale-95"
      >
        <UserPlus className="w-4 h-4" />
        Kết bạn
      </button>
    );
  }

  // STATUS: friends
  if (status === 'friends') {
    return (
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg
          flex items-center gap-2 cursor-default"
        >
          <UserCheck className="w-4 h-4" />
          Bạn bè
        </button>
        <button
          onClick={handleUnfriend}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg
          transition flex items-center gap-2 active:scale-95"
          title="Hủy kết bạn"
        >
          <UserMinus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // STATUS: pending_sent (đã gửi lời mời)
  if (status === 'pending_sent') {
    return (
      <button
        onClick={handleCancel}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg
        transition flex items-center gap-2 active:scale-95"
      >
        <Clock className="w-4 h-4" />
        Đã gửi lời mời
        <X className="w-4 h-4" />
      </button>
    );
  }

  // STATUS: pending_received (nhận được lời mời)
  if (status === 'pending_received') {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg
          transition flex items-center gap-2 active:scale-95"
        >
          <UserCheck className="w-4 h-4" />
          Chấp nhận
        </button>
        <button
          onClick={handleReject}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg
          transition flex items-center gap-2 active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // STATUS: blocked
  if (status === 'blocked') {
    return (
      <button
        className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
        disabled
      >
        Đã chặn
      </button>
    );
  }

  return null;
};

export default FriendButton;
