import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import { socket } from '../socket';

export const useUnreadCounts = () => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0);

  // Fetch unread messages count
  const fetchUnreadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id;

      if (!userId) return;

      const res = await axiosInstance.get(`/chat/user/${userId}/chats`);

      // Count total unread messages across all chats
      const totalUnread = res.data.reduce((sum, chat) => {
        return sum + (chat.unread_count || 0);
      }, 0);

      setUnreadMessages(totalUnread);
    } catch (error) {
      // Axios interceptor will handle 401 errors
      if (error.response?.status !== 401) {
        console.error('Error fetching unread messages:', error);
      }
    }
  };

  // Fetch unread notifications count
  const fetchUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axiosInstance.get('/notifications/unread-count');

      setUnreadNotifications(res.data.count || 0);
    } catch (error) {
      // Axios interceptor will handle 401 errors
      if (error.response?.status !== 401) {
        console.error('Error fetching unread notifications:', error);
      }
    }
  };

  // Fetch pending friend requests count
  const fetchPendingFriendRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axiosInstance.get('/friendships/pending-count');

      setPendingFriendRequests(res.data.count || 0);
    } catch (error) {
      // Axios interceptor will handle 401 errors
      if (error.response?.status !== 401) {
        console.error('Error fetching pending friend requests:', error);
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetchUnreadMessages();
    fetchUnreadNotifications();
    fetchPendingFriendRequests();

    // Refresh every 60 seconds (reduced from 30s to avoid rate limiting)
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        clearInterval(interval);
        return;
      }

      fetchUnreadMessages();
      fetchUnreadNotifications();
      fetchPendingFriendRequests();
    }, 60000); // Changed from 30000 to 60000 (1 minute)

    return () => clearInterval(interval);
  }, []);

  // Listen to socket events for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Update when new message arrives
    socket.on('receive_message', () => {
      fetchUnreadMessages();
    });

    // Update when messages are read
    socket.on('messages_read', () => {
      fetchUnreadMessages();
    });

    // Update when chat is read (from chatbox)
    socket.on('recent_chat_read', () => {
      fetchUnreadMessages();
    });

    // Update when recent chat is updated (new message in any chat)
    socket.on('recent_chat_updated', () => {
      fetchUnreadMessages();
    });

    // Update when new notification arrives
    socket.on('new_notification', (data) => {
      fetchUnreadNotifications();

      // If it's a friend request notification, update friend requests count
      if (data?.type === 'friend_request') {
        fetchPendingFriendRequests();
      }
    });

    // Update notification count
    socket.on('unread_count', (count) => {
      setUnreadNotifications(count);
    });

    // Update when friend request is accepted/rejected
    socket.on('friend_request_updated', () => {
      fetchPendingFriendRequests();
    });

    return () => {
      socket.off('receive_message');
      socket.off('messages_read');
      socket.off('recent_chat_read');
      socket.off('recent_chat_updated');
      socket.off('new_notification');
      socket.off('unread_count');
      socket.off('friend_request_updated');
    };
  }, []);

  return {
    unreadMessages,
    unreadNotifications,
    pendingFriendRequests,
    refreshUnreadMessages: fetchUnreadMessages,
    refreshUnreadNotifications: fetchUnreadNotifications,
    refreshPendingFriendRequests: fetchPendingFriendRequests,
  };
};
