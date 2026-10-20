import axiosInstance from '../utils/axios';

export const postApi = {
  /**
   * Lấy danh sách bài viết trên newsfeed (hỗ trợ phân trang)
   * @param {Object} params { page, limit }
   */
  getFeed: (params = {}) => axiosInstance.get('/posts', { params }),

  /**
   * Lấy danh sách bài viết của 1 người dùng cụ thể
   * @param {number|string} userId
   * @param {Object} params { page, limit }
   */
  getByUserId: (userId, params = {}) =>
    axiosInstance.get(`/posts/user/${userId}`, { params }),

  /**
   * Lấy chi tiết một bài viết theo ID
   * @param {number|string} postId
   */
  getById: (postId) => axiosInstance.get(`/posts/${postId}`),

  /**
   * Tìm kiếm bài viết theo từ khóa
   * @param {Object} params { q, page, limit }
   */
  search: (params = {}) => axiosInstance.get('/posts/search', { params }),

  /**
   * Tạo bài viết mới
   * @param {Object} data { content, media_url, privacy }
   */
  create: (data) => axiosInstance.post('/posts', data),

  /**
   * Cập nhật bài viết
   * @param {number|string} postId
   * @param {Object} data { content, media_url, privacy }
   */
  update: (postId, data) => axiosInstance.put(`/posts/${postId}`, data),

  /**
   * Xóa bài viết
   * @param {number|string} postId
   */
  delete: (postId) => axiosInstance.delete(`/posts/${postId}`),

  // ===== LIKES & REACTIONS =====
  /**
   * Thích hoặc bỏ thích bài viết
   * @param {number|string} postId
   */
  toggleLike: (postId) => axiosInstance.post(`/likes/post/${postId}`),

  /**
   * Kiểm tra user đã like bài viết chưa
   * @param {number|string} postId
   */
  checkLike: (postId) => axiosInstance.get(`/likes/check/${postId}`),

  /**
   * Lấy danh sách người đã thích bài viết
   * @param {number|string} postId
   */
  getLikingUsers: (postId) => axiosInstance.get(`/likes/post/${postId}`),

  /**
   * Lấy danh sách các bài viết mà user hiện tại đã thích
   */
  getLikedPosts: () => axiosInstance.get('/likes/posts'),

  // ===== SHARES =====
  /**
   * Chia sẻ bài viết
   * @param {Object} data { original_post_id, content, privacy }
   */
  share: (data) => axiosInstance.post('/shares', data),

  /**
   * Lấy số lượt chia sẻ của bài viết
   * @param {number|string} postId
   */
  getShares: (postId) => axiosInstance.get(`/shares/post/${postId}`),

  // ===== SAVED POSTS (BOOKMARKS) =====
  /**
   * Lưu hoặc bỏ lưu bài viết
   * @param {number|string} postId
   */
  toggleSave: (postId) => axiosInstance.post(`/saved-posts/${postId}`),

  /**
   * Kiểm tra user đã lưu bài viết chưa
   * @param {number|string} postId
   */
  checkSave: (postId) => axiosInstance.get(`/saved-posts/check/${postId}`),

  /**
   * Lấy danh sách bài viết đã lưu
   * @param {Object} params { page, limit }
   */
  getSavedPosts: (params = {}) => axiosInstance.get('/saved-posts', { params }),
};

export default postApi;
