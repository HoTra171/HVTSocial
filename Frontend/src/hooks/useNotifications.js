import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../constants/api';

export const useNotifications = (socket, currentUser) => {
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket || !currentUser?.id) return;

    const onNewNotification = () => {
      fetchNotifications();
    };

    socket.on("new_notification", onNewNotification);

    return () => {
      socket.off("new_notification", onNewNotification);
    };
  }, [socket, currentUser?.id, fetchNotifications]);

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

  return {
    loading,
    marking,
    notifications,
    markAllRead,
    markAsRead,
    deleteNotification,
  };
};
