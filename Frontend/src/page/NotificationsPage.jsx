import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { connectSocket } from "../socket";
import { useNotifications } from '../hooks/useNotifications';
import NotificationHeader from '../components/Notification/NotificationHeader';
import NotificationFilters from '../components/Notification/NotificationFilters';
import NotificationItem from '../components/Notification/NotificationItem';
import EmptyNotifications from '../components/Notification/EmptyNotifications';
import { API_URL, SERVER_ORIGIN } from '../constants/api';

const NotificationsPage = ({ socket, currentUser }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const {
    loading,
    marking,
    notifications,
    markAllRead,
    markAsRead,
    deleteNotification,
  } = useNotifications(socket, currentUser);

  const handleClickNotification = async (notif) => {
    if (notif.status === 'unread') {
      markAsRead(notif.id);
    }

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
      case 'follow':
        // Navigate to follower's profile
        if (notif.sender_id) {
          navigate(`/profile/${notif.sender_id}`);
        }
        break;
      case 'message':
        // Tạo hoặc lấy chat DM với người gửi
        try {
          const token = localStorage.getItem('token');
          const res = await axios.post(
            `${API_URL}/chat/dm`,
            { receiverId: notif.sender_id },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Navigate đến chat với chatId đúng
          navigate(`/messages/${res.data.chatId}`);
        } catch (error) {
          console.error('Error creating/getting DM:', error);
          toast.error('Không thể mở cuộc trò chuyện');
        }
        break;
      default:
        console.warn('Unknown notification type:', notif.type);
        break;
    }
  };

  const filteredNotifications =
    filter === 'all'
      ? notifications
      : filter === 'unread'
        ? notifications.filter((n) => n.status === 'unread')
        : notifications.filter((n) => n.status === 'read');

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  return (
    <div className="max-w-2xl mx-auto pt-6 pb-10 px-4 sm:px-6 sm:-ml-46">
      <div className="mb-6">
        <NotificationHeader />
        <NotificationFilters
          filter={filter}
          setFilter={setFilter}
          totalCount={notifications.length}
          unreadCount={unreadCount}
          marking={marking}
          onMarkAllRead={markAllRead}
        />
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}

      {!loading && filteredNotifications.length === 0 && (
        <EmptyNotifications filter={filter} />
      )}

      <div className="space-y-2">
        {filteredNotifications.map((notif) => (
          <NotificationItem
            key={notif.id}
            notif={notif}
            onRead={() => handleClickNotification(notif)}
            onDelete={deleteNotification}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
