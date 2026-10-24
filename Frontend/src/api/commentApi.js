import axiosInstance from '../utils/axios';

export const commentApi = {
  /**
   * Lấy danh sách bình luận của bài viết
   * @param {number|string} postId
   * @param {Object} params { page, limit }
   */
  getByPostId: (postId, params = {}) => {
    const queryParams = typeof params === 'string' ? { sort: params } : params;
    return axiosInstance.get(`/comments/post/${postId}`, { params: queryParams });
  },

  /**
   * Tạo bình luận mới cho bài viết
   * @param {number|string} postId
   * @param {Object} data { content, media_url, parent_id }
   */
  create: (postId, data) =>
    axiosInstance.post(`/comments/post/${postId}`, data),

  /**
   * Lấy danh sách câu trả lời của 1 bình luận
   * @param {number|string} commentId
   */
  getReplies: (commentId) =>
    axiosInstance.get(`/comments/${commentId}/replies`),

  /**
   * Cập nhật bình luận
   * @param {number|string} commentId
   * @param {Object} data { content }
   */
  update: (commentId, data) =>
    axiosInstance.put(`/comments/${commentId}`, data),

  /**
   * Xóa bình luận
   * @param {number|string} commentId
   */
  delete: (commentId) =>
    axiosInstance.delete(`/comments/${commentId}`),
};

export default commentApi;
