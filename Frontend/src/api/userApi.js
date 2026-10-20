import axiosInstance from '../utils/axios';

export const userApi = {
  /**
   * Lấy thông tin trang cá nhân của người dùng
   * @param {number|string} userId
   */
  getProfile: (userId) => axiosInstance.get(`/users/${userId}`),

  /**
   * Cập nhật thông tin trang cá nhân (hỗ trợ FormData cho avatar, cover)
   * @param {number|string} userId
   * @param {FormData|Object} data
   */
  updateProfile: (userId, data) => {
    const isFormData = data instanceof FormData;
    return axiosInstance.put(`/users/${userId}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },

  /**
   * Tìm kiếm / Khám phá người dùng
   * @param {Object} params { q, page, limit }
   */
  discover: (params = {}) => axiosInstance.get('/users/discover', { params }),

  /**
   * Gợi ý bạn bè / người dùng có thể biết
   */
  getSuggestions: () => axiosInstance.get('/users/suggest'),

  /**
   * Lấy danh sách kết nối (bạn bè) của user
   * @param {number|string} userId
   */
  getConnections: (userId) => axiosInstance.get(`/users/${userId}/connections`),

  /**
   * Lấy cấu hình quyền riêng tư
   */
  getPrivacySettings: () => axiosInstance.get('/users/privacy-settings'),

  /**
   * Cập nhật cấu hình quyền riêng tư
   * @param {Object} settings
   */
  updatePrivacySettings: (settings) =>
    axiosInstance.put('/users/privacy-settings', settings),
};

export default userApi;
