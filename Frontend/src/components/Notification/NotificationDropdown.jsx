import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, ArrowRight, X, Sparkles, Inbox, BellDot, Check, Trash2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { notificationApi } from '../../api/notificationApi';
import { friendApi } from '../../api/friendApi';
import { useSocket } from '../../contexts/SocketContext';
import { playNotificationSound } from '../../utils/notificationSound';
import NotificationIcon from './NotificationIcon';
import { safeFromNow } from '../../utils/dateHelpers';

export const NotificationDropdown = ({ isOpen, onClose, placement = 'sidebar' }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  // Tải thông báo khi mở dropdown
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);

    notificationApi
      .getAll({ limit: 15 })
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

  // Xóa nhanh thông báo
  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation();
    try {
      await notificationApi.delete(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      toast.success('Đã xóa thông báo');
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  // Xử lý chấp nhận kết bạn trực tiếp
  const handleAcceptFriend = async (e, notif) => {
    e.stopPropagation();
    if (!notif.sender_id) return;
    try {
      await friendApi.acceptRequest(notif.sender_id);
      toast.success('Đã trở thành bạn bè!');
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, status: 'read', is_read: true, accepted: true } : n
        )
      );
    } catch (err) {
      toast.error('Không thể chấp nhận lời mời');
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(
    (n) => n.status === 'unread' || n.is_read === false
  ).length;

  const displayedNotifications =
    filter === 'unread'
      ? notifications.filter((n) => n.status === 'unread' || n.is_read === false)
      : notifications;

  const positionClasses =
    placement === 'header'
      ? 'fixed right-3 sm:right-6 top-16 w-[calc(100vw-24px)] sm:w-[420px] max-h-[85vh]'
      : 'fixed left-20 xl:left-72 top-16 w-[calc(100vw-24px)] sm:w-[420px] max-h-[calc(100vh-5rem)]';

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
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  Thông báo
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Đã đọc hết</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FILTER PILLS */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Tất cả</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {notifications.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Chưa đọc</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* DANH SÁCH THÔNG BÁO */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[420px]">
          {loading ? (
            <div className="py-14 text-center text-xs text-slate-400 dark:text-slate-500">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
              Đang tải thông báo...
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 mx-auto mb-3 flex items-center justify-center shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {filter === 'unread' ? 'Không có thông báo chưa đọc nào' : 'Chưa có thông báo nào'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Các cập nhật và tương tác mới sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            displayedNotifications.map((notif) => {
              const isUnread = notif.status === 'unread' || notif.is_read === false;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClickItem(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer transition-all relative group ${
                    isUnread
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30'
                      : ''
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
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                      <span className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {notif.sender_name || 'Hệ thống'}
                      </span>{' '}
                      <span className="text-slate-600 dark:text-slate-300 font-normal">{notif.content}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 font-medium">
                      {safeFromNow(notif.created_at || notif.createdAt)}
                    </p>

                    {/* Quick Friend Action inline */}
                    {notif.type === 'friend_request' && !notif.accepted && (
                      <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleAcceptFriend(e, notif)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs active:scale-95 transition flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Chấp nhận</span>
                        </button>
                      </div>
                    )}
                    {notif.accepted && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Đã trở thành bạn bè</span>
                      </p>
                    )}
                  </div>

                  {/* Actions & Unread Indicator */}
                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-full flex-shrink-0 ring-4 ring-indigo-100 dark:ring-indigo-950/60 animate-pulse" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(e, notif.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
