import { NotificationService } from '../services/notificationService.js';

const emitUnreadCount = async (req, userId) => {
  const io = req.app.get('io');
  if (!io) return;
  const count = await NotificationService.getUnreadCount(userId);
  io.to(`user_${userId}`).emit('unread_count', count);
};
// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || 50;

    const notifications = await NotificationService.getNotifications(userId, limit);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      count,
    });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// PATCH /api/notifications/mark-all-read
export const markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await NotificationService.markAllRead(userId);

    await emitUnreadCount(req, userId);

    res.json({ success: true });
  } catch (err) {
    console.error('markAllRead error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = Number(req.params.id);

    await NotificationService.markAsRead(notificationId, userId);

    await emitUnreadCount(req, userId);

    res.json({ success: true });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = Number(req.params.id);

    await NotificationService.deleteNotification(notificationId, userId);

    await emitUnreadCount(req, userId);

    res.json({ success: true });
  } catch (err) {
    console.error('deleteNotification error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// DELETE /api/notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await NotificationService.deleteAllNotifications(userId);

    await emitUnreadCount(req, userId);

    res.json({ success: true });
  } catch (err) {
    console.error('deleteAllNotifications error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
