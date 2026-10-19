import axiosInstance from '../utils/axios';

export const authApi = {
  /**
   * Đăng ký tài khoản mới
   * @param {Object} data { username, email, password }
   */
  register: (data) => axiosInstance.post('/auth/register', data),

  /**
   * Đăng nhập
   * @param {Object} credentials { email, password }
   */
  login: (credentials) => axiosInstance.post('/auth/login', credentials),

  /**
   * Yêu cầu gửi mã OTP đặt lại mật khẩu qua email
   * @param {string} email
   */
  requestResetOtp: (email) => axiosInstance.post('/auth/request-reset-otp', { email }),

  /**
   * Đặt lại mật khẩu bằng mã OTP
   * @param {Object} data { email, otp, newPassword }
   */
  resetPasswordWithOtp: (data) => axiosInstance.post('/auth/reset-password-otp', data),

  /**
   * Đổi mật khẩu (khi đã đăng nhập)
   * @param {Object} data { oldPassword, newPassword }
   */
  changePassword: (data) => axiosInstance.put('/auth/change-password', data),

  /**
   * Làm mới Access Token bằng Refresh Token
   * @param {string} refreshToken
   */
  refreshToken: (refreshToken) => axiosInstance.post('/auth/refresh-token', { refreshToken }),

  /**
   * Đăng xuất
   * @param {string} refreshToken
   */
  logout: (refreshToken) => axiosInstance.post('/auth/logout', { refreshToken }),
};

export default authApi;
