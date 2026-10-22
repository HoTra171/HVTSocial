import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, ArrowRight, X, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { notificationApi } from '../../api/notificationApi';
import { useSocket } from '../../contexts/SocketContext';
import { playNotificationSound } from '../../utils/notificationSound';
import NotificationIcon from './NotificationIcon';
import { safeFromNow } from '../../utils/dateHelpers';

export const NotificationDropdown = ({ isOpen, onClose, placement = 'sidebar' }) => {
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
      .getAll({ limit: 10 })
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

    switch (notif.type) {
      case 'like':
      case 'comment':
      case 'reply':
      case 'share':
      case 'other':
        if (notif.post_id) navigate(`/post/${notif.post_id}`);
        break;
      case 'friend_request':
        navigate('/connections?tab=pending');
        break;
      case 'friend_accept':
      case 'follow':
        if (notif.sender_id) navigate(`/profile/${notif.sender_id}`);
        break;
      case 'message':
        navigate('/messages');
        break;
      default:
        navigate('/notifications');
        break;
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(
    (n) => n.status === 'unread' || n.is_read === false
  ).length;

  const positionClasses =
    placement === 'header'
      ? 'fixed right-3 sm:right-6 top-16 w-[calc(100vw-24px)] sm:w-96 max-h-[82vh]'
      : 'fixed left-24 xl:left-76 top-16 w-88 sm:w-96 max-h-[calc(100vh-5rem)]';

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div
        ref={dropdownRef}
        className={`${positionClasses} bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* HEADER DROPDOWN */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center gap-1 transition-colors"
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đã đọc hết</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DANH SÁCH THÔNG BÁO */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[380px]">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Đang tải thông báo...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 mx-auto mb-3 flex items-center justify-center shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Chưa có thông báo nào mới</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Khi có tương tác mới, chúng sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = notif.status === 'unread' || notif.is_read === false;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClickItem(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer transition-all relative ${
                    isUnread ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30' : ''
                  }`}
                >
                  {/* Avatar & Type Badge */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={notif.sender_avatar || '/default.jpg'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800"
                      onError={(e) => {
                        e.currentTarget.src = '/default.jpg';
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 flex items-center justify-center">
                      <NotificationIcon type={notif.type} content={notif.content} />
                    </div>
                  </div>

                  {/* Nội dung */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                      <span className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {notif.sender_name || 'Hệ thống'}
                      </span>{' '}
                      <span className="text-slate-600 dark:text-slate-300">{notif.content}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                      {safeFromNow(notif.created_at || notif.createdAt)}
                    </p>
                  </div>

                  {/* Chấm tròn chưa đọc */}
                  {isUnread && (
                    <span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-full flex-shrink-0 mt-2 ring-4 ring-indigo-100 dark:ring-indigo-950/60 animate-pulse" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER: XEM TOÀN BỘ */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-center">
          <Link
            to="/notifications"
            onClick={onClose}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-center gap-1.5 transition-colors py-1 hover:underline"
          >
            <span>Xem tất cả thông báo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;
