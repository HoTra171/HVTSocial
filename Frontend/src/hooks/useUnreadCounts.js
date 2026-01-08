import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../constants/api';
import { socket } from '../socket';

export const useUnreadCounts = () => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch unread messages count
  const fetchUnreadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id;

      if (!userId) return;

      const res = await axios.get(`${API_URL}/chat/user/${userId}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Count total unread messages across all chats
      const totalUnread = res.data.reduce((sum, chat) => {
        return sum + (chat.unread_count || 0);
      }, 0);

      setUnreadMessages(totalUnread);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  // Fetch unread notifications count
  const fetchUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUnreadNotifications(res.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUnreadMessages();
    fetchUnreadNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadMessages();
      fetchUnreadNotifications();
    }, 30000);

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

    // Update when new notification arrives
    socket.on('new_notification', () => {
      fetchUnreadNotifications();
    });

    // Update notification count
    socket.on('unread_count', (count) => {
      setUnreadNotifications(count);
    });

    return () => {
      socket.off('receive_message');
      socket.off('messages_read');
      socket.off('new_notification');
      socket.off('unread_count');
    };
  }, []);

  return {
    unreadMessages,
    unreadNotifications,
    refreshUnreadMessages: fetchUnreadMessages,
    refreshUnreadNotifications: fetchUnreadNotifications,
  };
};
