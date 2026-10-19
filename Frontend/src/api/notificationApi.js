import axiosInstance from '../utils/axios';

export const notificationApi = {
  /**
   * Lấy danh sách thông báo
   * @param {Object} params { page, limit }
   */
  getAll: (params = {}) => axiosInstance.get('/notifications', { params }),

  /**
   * Đánh dấu 1 thông báo đã đọc
   * @param {number|string} notificationId
   */
  markAsRead: (notificationId) =>
    axiosInstance.put(`/notifications/${notificationId}/read`),

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  markAllAsRead: () => axiosInstance.put('/notifications/read-all'),

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  getUnreadCount: () => axiosInstance.get('/notifications/unread-count'),
};

export default notificationApi;
