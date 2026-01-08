import axios from 'axios';
import { API_URL } from '../constants/api';
import toast from 'react-hot-toast';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Request interceptor - Add token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized (token expired or invalid)
      if (status === 401) {
        const message = data?.message || 'Phiên đăng nhập đã hết hạn';

        // Check if it's token expired
        if (
          message.includes('hết hạn') ||
          message.includes('expired') ||
          data?.message === 'Token đã hết hạn, vui lòng đăng nhập lại'
        ) {
          // Clear local storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          // Show toast
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');

          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          toast.error(message);
        }
      }

      // Handle other errors
      else if (status === 403) {
        toast.error('Bạn không có quyền thực hiện thao tác này');
      } else if (status === 404) {
        // Don't show toast for 404, let components handle it
        console.warn('404 Not Found:', error.config?.url);
      } else if (status >= 500) {
        toast.error('Lỗi server. Vui lòng thử lại sau!');
      }
    } else if (error.request) {
      // Network error
      toast.error('Không thể kết nối đến server. Kiểm tra kết nối mạng!');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
