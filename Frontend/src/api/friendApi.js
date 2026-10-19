import axiosInstance from '../utils/axios';

export const friendApi = {
  /**
   * Gửi lời mời kết bạn
   * @param {number|string} targetUserId
   */
  sendRequest: (targetUserId) =>
    axiosInstance.post('/friendships/request', { targetUserId }),

  /**
   * Chấp nhận lời mời kết bạn
   * @param {number|string} requesterId
   */
  acceptRequest: (requesterId) =>
    axiosInstance.post('/friendships/accept', { requesterId }),

  /**
   * Từ chối lời mời kết bạn
   * @param {number|string} requesterId
   */
  rejectRequest: (requesterId) =>
    axiosInstance.post('/friendships/reject', { requesterId }),

  /**
   * Hủy lời mời kết bạn đã gửi
   * @param {number|string} targetUserId
   */
  cancelRequest: (targetUserId) =>
    axiosInstance.post('/friendships/cancel', { targetUserId }),

  /**
   * Hủy kết bạn (unfriend)
   * @param {number|string} friendId
   */
  unfriend: (friendId) =>
    axiosInstance.delete(`/friendships/unfriend/${friendId}`),

  /**
   * Lấy danh sách lời mời kết bạn đang chờ duyệt
   */
  getPendingRequests: () =>
    axiosInstance.get('/friendships/requests/pending'),

  /**
   * Kiểm tra trạng thái quan hệ bạn bè với một người dùng
   * @param {number|string} otherUserId
   */
  getStatus: (otherUserId) =>
    axiosInstance.get(`/friendships/status/${otherUserId}`),

  /**
   * Lấy danh sách bạn bè
   * @param {Object} params { page, limit }
   */
  getFriendList: (params = {}) =>
    axiosInstance.get('/friendships/list', { params }),
};

export default friendApi;
