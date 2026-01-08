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

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false;

// Response interceptor - Handle token expiration and rate limiting
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized (token expired or invalid)
      if (status === 401) {
        const message = data?.message || '';

        // Prevent multiple redirects
        if (!isRedirecting) {
          isRedirecting = true;

          // Clear local storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          // Show toast
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');

          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }
      }

      // Handle 429 Too Many Requests (Rate Limiting)
      else if (status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000; // Default 2 seconds

        // Don't show toast for every 429 error to avoid spam
        if (!originalRequest._retryCount) {
          console.warn('Rate limit exceeded. Retrying after', waitTime, 'ms');
        }

        // Retry the request after waiting
        if (!originalRequest._retryCount || originalRequest._retryCount < 3) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, waitTime));

          return axiosInstance(originalRequest);
        } else {
          // Max retries reached
          toast.error('Server đang quá tải. Vui lòng thử lại sau!');
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
