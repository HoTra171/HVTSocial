import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserMinus, Clock, X, Loader2, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../constants/api';

const FriendButton = ({ userId, currentUserId, fullWidth = false, onStatusChange }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmUnfriend, setShowConfirmUnfriend] = useState(false);

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

  const handleSendRequest = async (e) => {
    e?.stopPropagation();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/friendships/send-request`,
        { friendId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã gửi lời mời kết bạn');
      setStatus('pending_sent');
      onStatusChange?.('pending_sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi lời mời');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (e) => {
    e?.stopPropagation();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/friendships/accept`,
        { friendId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã chấp nhận lời mời');
      setStatus('friends');
      onStatusChange?.('friends');
    } catch (error) {
      toast.error('Không thể chấp nhận lời mời');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e?.stopPropagation();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/friendships/reject`,
        { friendId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã từ chối lời mời');
      setStatus(null);
      onStatusChange?.(null);
    } catch (error) {
      toast.error('Không thể từ chối');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (e) => {
    e?.stopPropagation();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/friendships/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { friendId: userId },
      });
      toast.success('Đã hủy lời mời');
      setStatus(null);
      onStatusChange?.(null);
    } catch (error) {
      toast.error('Không thể hủy lời mời');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async (e) => {
    e?.stopPropagation();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/friendships/unfriend`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { friendId: userId },
      });
      toast.success('Đã hủy kết bạn');
      setStatus(null);
      setShowConfirmUnfriend(false);
      onStatusChange?.(null);
    } catch (error) {
      toast.error('Không thể hủy kết bạn');
    } finally {
      setActionLoading(false);
    }
  };

  // Không hiển thị nếu là chính mình
  if (!userId || !currentUserId || userId === currentUserId) {
    return null;
  }

  const baseWidth = fullWidth ? 'w-full' : 'w-auto flex-shrink-0';

  if (loading || actionLoading) {
    return (
      <button
        className={`${baseWidth} h-10 px-4 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed font-medium text-xs sm:text-sm flex items-center justify-center gap-2 whitespace-nowrap`}
        disabled
      >
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span>Đang xử lý...</span>
      </button>
    );
  }

  // STATUS: cannot_send (người nhận tắt nhận lời mời kết bạn)
  if (status === 'cannot_send') {
    return (
      <button
        disabled
        className={`${baseWidth} h-10 px-3 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl font-medium text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-1.5 whitespace-nowrap`}
        title="Người dùng này hiện không nhận lời mời kết bạn"
      >
        <UserPlus className="w-4 h-4 opacity-50" />
        <span>Không nhận kết bạn</span>
      </button>
    );
  }

  // STATUS: null (chưa có quan hệ)
  if (!status) {
    return (
      <button
        onClick={handleSendRequest}
        className={`${baseWidth} h-10 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-200 transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap`}
      >
        <UserPlus className="w-4 h-4" />
        <span>Kết bạn</span>
      </button>
    );
  }

  // STATUS: friends (đã là bạn bè)
  if (status === 'friends') {
    if (showConfirmUnfriend) {
      return (
        <div className={`flex items-center gap-1.5 ${baseWidth} animate-in fade-in duration-150`}>
          <button
            onClick={handleUnfriend}
            disabled={actionLoading}
            className="flex-1 h-10 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition whitespace-nowrap"
          >
            <Check className="w-4 h-4" />
            <span>Hủy kết bạn</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmUnfriend(false);
            }}
            className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-500 rounded-xl transition"
            title="Hủy thao tác"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-1.5 ${baseWidth}`}>
        <button
          className="flex-1 h-10 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl text-xs sm:text-sm cursor-default flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>Bạn bè</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirmUnfriend(true);
          }}
          className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors border border-gray-200 active:scale-95"
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
        className={`${baseWidth} h-10 px-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap group`}
        title="Nhấn để hủy lời mời"
      >
        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 group-hover:hidden" />
        <X className="w-4 h-4 text-amber-600 flex-shrink-0 hidden group-hover:inline" />
        <span className="group-hover:hidden">Đã gửi lời mời</span>
        <span className="hidden group-hover:inline">Hủy lời mời</span>
      </button>
    );
  }

  // STATUS: pending_received (nhận được lời mời)
  if (status === 'pending_received') {
    return (
      <div className={`flex items-center gap-1.5 ${baseWidth}`}>
        <button
          onClick={handleAccept}
          className="flex-1 h-10 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm shadow-indigo-200"
        >
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>Chấp nhận</span>
        </button>
        <button
          onClick={handleReject}
          className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl transition-colors border border-gray-200 active:scale-95"
          title="Từ chối"
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
        className={`${baseWidth} h-10 px-4 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed font-medium text-xs sm:text-sm flex items-center justify-center`}
        disabled
      >
        Đã chặn
      </button>
    );
  }

  return null;
};

export default FriendButton;
