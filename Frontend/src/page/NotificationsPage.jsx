import React, { useEffect, useState } from 'react';
import {
  Bell,
  Loader2,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  UserCheck,
  Trash2,
  Check,
  AlertCircle,
  AtSign,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { connectSocket } from "../socket";


dayjs.extend(relativeTime);
dayjs.locale('vi');

const API_URL = 'http://localhost:5000/api';

const NotificationsPage = ({ socket, currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, unread, read

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const res = await axios.get(`${API_URL}/notifications`, {
        params: { limit: 50 },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setNotifications(res.data.data || []);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
      toast.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Realtime: có notification mới thì reload danh sách từ API
  useEffect(() => {
    if (!socket || !currentUser?.id) return;

    const onNewNotification = () => {
      fetchNotifications(); // lấy lại list để có sender_name / sender_avatar đầy đủ
    };

    socket.on("new_notification", onNewNotification);

    return () => {
      socket.off("new_notification", onNewNotification);
    };
  }, [socket, currentUser?.id]);

  useEffect(() => {
    // [REALTIME] đảm bảo socket đã connect + join room user
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser?.id) connectSocket(storedUser.id);

    const onNewNotification = () => {
      // [SYNC LIST] reload để lấy đủ sender_name/sender_avatar từ API
      fetchNotifications();
    };

    socket.on("new_notification", onNewNotification);

    return () => {
      socket.off("new_notification", onNewNotification);
    };
  }, []);

  // Mark all as read
  const markAllRead = async () => {
    try {
      setMarking(true);
      const token = localStorage.getItem('token');

      await axios.patch(
        `${API_URL}/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'read' }))
      );

      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (err) {
      console.error('Mark all read error:', err);
      toast.error('Không thể cập nhật');
    } finally {
      setMarking(false);
    }
  };

  // Mark one as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');

      await axios.patch(
        `${API_URL}/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n))
      );
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) return;

    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Đã xóa thông báo');
    } catch (err) {
      console.error('Delete notification error:', err);
      toast.error('Không thể xóa');
    }
  };

  // ========== HANDLE CLICK ==========
  const handleClickNotification = async (notif) => {
    console.log('Clicked notification:', notif);

    // Mark as read
    if (notif.status === 'unread') {
      markAsRead(notif.id);
    }

    // Navigate based on type
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
        navigate(`/profile/${notif.sender_id}`);
        break;

      case 'message':
        navigate(`/messages/${notif.sender_id}`);
        break;

      default:
        console.warn('Unknown notification type:', notif.type);
        break;
    }
  };

  // Get icon by type
  const getNotificationIcon = (type, content = '') => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "other":
        if (content.includes("chia sẻ bài viết")) {
          return <Share2 className="w-5 h-5 text-green-500" />;
        }
        return <Bell className="w-5 h-5 text-gray-500" />;
      // case 'share':
      //   return <Share2 className="w-5 h-5 text-green-500" />;
      case 'friend_request':
        return <UserPlus className="w-5 h-5 text-indigo-500" />;
      case 'friend_accept':
        return <UserCheck className="w-5 h-5 text-green-500" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case 'post_tag':
      case 'comment_tag':
        return <AtSign className="w-5 h-5 text-orange-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'story_view':
        return <Eye className="w-5 h-5 text-purple-500" />;
      case 'report':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Filter notifications
  const filteredNotifications =
    filter === 'all'
      ? notifications
      : filter === 'unread'
        ? notifications.filter((n) => n.status === 'unread')
        : notifications.filter((n) => n.status === 'read');

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  return (
    <div className="max-w-2xl mx-auto pt-6 pb-10 px-4 sm:px-6 sm:-ml-46">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50">
            <Bell className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
            <p className="text-sm text-gray-500">
              Xem tất cả thông báo gần đây của bạn
            </p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition ${filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Tất cả ({notifications.length})
            </button>

            <button
              onClick={() => setFilter('unread')}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition ${filter === 'unread'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Chưa đọc ({unreadCount})
            </button>

            <button
              onClick={() => setFilter('read')}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition ${filter === 'read'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Đã đọc ({notifications.length - unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={marking}
              className="text-sm px-4 py-2 rounded-lg bg-white border border-gray-300
              hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {marking ? 'Đang cập nhật...' : 'Đánh dấu đã đọc tất cả'}
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNotifications.length === 0 && (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {filter === 'unread'
              ? 'Bạn đã đọc tất cả thông báo'
              : 'Chưa có thông báo nào'}
          </p>
          <p className="text-gray-400 text-sm">
            Thông báo sẽ xuất hiện khi có hoạt động mới
          </p>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.map((notif) => (
          <div
            key={notif.id}
            className={`group relative flex gap-3 p-4 rounded-xl border transition-all
            cursor-pointer ${notif.status === 'unread'
                ? 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'
                : 'bg-white border-gray-100 hover:bg-gray-50'
              }`}
            onClick={() => handleClickNotification(notif)}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {notif.sender_avatar ? (
                <img
                  src={notif.sender_avatar}
                  alt={notif.sender_name || 'User'}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {notif.sender_name?.[0] || 'N'}
                </div>
              )}
 
              {/* Type Icon Badge */}
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 border-2 border-white">
                {getNotificationIcon(notif.type, notif.content)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-semibold text-gray-900">
                  {notif.sender_name || 'Hệ thống'}
                </span>{' '}
                <span className="text-gray-700">{notif.content}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {dayjs(notif.created_at).fromNow()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notif.id);
                }}
                className="p-2 hover:bg-red-50 rounded-lg transition"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>

            {/* Unread indicator */}
            {notif.status === 'unread' && (
              <span className="absolute top-4 right-4 w-2 h-2 bg-indigo-600 rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
