import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, ExternalLink, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { notificationApi } from '../../api/notificationApi';
import { useSocket } from '../../contexts/SocketContext';
import { playNotificationSound } from '../../utils/notificationSound';
import NotificationIcon from './NotificationIcon';
import { safeFromNow } from '../../utils/dateHelpers';

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Tải thông báo khi mở dropdown
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);

    notificationApi
      .getAll({ limit: 8 })
      .then((res) => {
        if (mounted) {
          const list = res.data?.data || res.data?.notifications || res.data || [];
          setNotifications(Array.isArray(list) ? list : []);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải thông báo:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Lắng nghe thông báo real-time qua socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      playNotificationSound();
    };

    socket.on('receive_notification', handleNewNotification);

    return () => {
      socket.off('receive_notification', handleNewNotification);
    };
  }, [socket]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'read', is_read: true }))
      );
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  // Đọc 1 thông báo và chuyển hướng
  const handleClickItem = async (notif) => {
    try {
      if (notif.status === 'unread' || !notif.is_read) {
        await notificationApi.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, status: 'read', is_read: true } : n
          )
        );
      }
    } catch (err) {
      console.error('Mark read error:', err);
    }

    onClose();

    // Điều hướng theo type
    if (notif.post_id || notif.target_id) {
      navigate(`/post/${notif.post_id || notif.target_id}`);
    } else if (notif.sender_id) {
      navigate(`/profile/${notif.sender_id}`);
    } else {
      navigate('/notifications');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* HEADER DROPDOWN */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-sm text-gray-900">Thông báo</h3>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
          title="Đánh dấu tất cả là đã đọc"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Đã đọc hết</span>
        </button>
      </div>

      {/* DANH SÁCH THÔNG BÁO */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang tải thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            Chưa có thông báo nào mới
          </div>
        ) : (
          notifications.map((notif) => {
            const isUnread = notif.status === 'unread' || notif.is_read === false;
            return (
              <div
                key={notif.id}
                onClick={() => handleClickItem(notif)}
                className={`p-3 flex items-start gap-3 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                  isUnread ? 'bg-indigo-50/40' : ''
                }`}
              >
                {/* Avatar & Type Badge */}
                <div className="relative flex-shrink-0">
                  <img
                    src={notif.sender_avatar || '/default.jpg'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                    onError={(e) => {
                      e.currentTarget.src = '/default.jpg';
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    <NotificationIcon type={notif.type} content={notif.content} />
                  </div>
                </div>

                {/* Nội dung */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 leading-snug">
                    <span className="font-semibold text-gray-900">
                      {notif.sender_name || 'Hệ thống'}
                    </span>{' '}
                    <span>{notif.content}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {safeFromNow(notif.created_at || notif.createdAt)}
                  </p>
                </div>

                {/* Chấm tròn chưa đọc */}
                {isUnread && (
                  <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER: XEM TOÀN BỘ */}
      <div className="p-2.5 border-t border-gray-100 bg-gray-50/50 text-center">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 transition-colors"
        >
          <span>Xem tất cả thông báo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;
