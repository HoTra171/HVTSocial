import axiosInstance from '../utils/axios';

export const storyApi = {
  /**
   * Lấy danh sách stories đang hoạt động (trong 24h)
   */
  getStories: () => axiosInstance.get('/stories'),

  /**
   * Đăng story mới
   * @param {Object} data { media_url, media_type, privacy }
   */
  create: (data) => axiosInstance.post('/stories', data),

  /**
   * Xóa story
   * @param {number|string} storyId
   */
  delete: (storyId) => axiosInstance.delete(`/stories/${storyId}`),

  /**
   * Đánh dấu đã xem story
   * @param {number|string} storyId
   */
  markViewed: (storyId) => axiosInstance.post(`/stories/${storyId}/view`),
};

export default storyApi;
