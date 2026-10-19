import axiosInstance from '../utils/axios';

export const chatApi = {
  /**
   * Lấy danh sách cuộc trò chuyện gần đây (recent chats)
   */
  getRecentChats: () => axiosInstance.get('/chat/recent'),

  /**
   * Lấy tin nhắn giữa người dùng hiện tại và một người dùng khác
   * @param {number|string} otherUserId
   * @param {Object} params { limit, before, after }
   */
  getMessages: (otherUserId, params = {}) =>
    axiosInstance.get(`/chat/messages/${otherUserId}`, { params }),

  /**
   * Gửi tin nhắn mới
   * @param {Object} data { receiverId, message, media_url, message_type, reply_to_id }
   */
  sendMessage: (data) => axiosInstance.post('/chat/messages', data),

  /**
   * Thu hồi / Xóa tin nhắn
   * @param {number|string} messageId
   */
  recallMessage: (messageId) => axiosInstance.delete(`/chat/messages/${messageId}`),

  /**
   * Đánh dấu cuộc trò chuyện đã đọc
   * @param {number|string} chatId
   */
  markAsRead: (chatId) => axiosInstance.post(`/chat/read/${chatId}`),

  /**
   * Lấy tổng số tin nhắn chưa đọc
   */
  getUnreadCount: () => axiosInstance.get('/chat/unread-count'),

  /**
   * Tạo cuộc trò chuyện mới hoặc lấy cuộc trò chuyện sẵn có
   * @param {Object} data { participant_id }
   */
  createConversation: (data) => axiosInstance.post('/chat/conversations', data),
};

export default chatApi;
