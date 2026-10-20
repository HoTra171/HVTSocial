import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { connectSocket, disconnectSocket } from '../socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khởi tạo user và token từ localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        setToken(storedToken);
        connectSocket(parsedUser.id);
      }
    } catch (error) {
      console.error('Lỗi khi đọc auth cache:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng nhập
  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    const payload = res.data?.data || res.data || {};
    const token = payload.token || payload.accessToken;
    const user = payload.user;

    if (res.data?.success && token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (payload.refreshToken) {
        localStorage.setItem('refreshToken', payload.refreshToken);
      }
      setToken(token);
      setCurrentUser(user);
      connectSocket(user.id);
      return user;
    }
    throw new Error(res.data?.message || 'Đăng nhập thất bại');
  }, []);

  // Đăng ký
  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    const payload = res.data?.data || res.data || {};
    const token = payload.token || payload.accessToken;
    const user = payload.user;

    if (res.data?.success && token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (payload.refreshToken) {
        localStorage.setItem('refreshToken', payload.refreshToken);
      }
      setToken(token);
      setCurrentUser(user);
      connectSocket(user.id);
      return user;
    }
    throw new Error(res.data?.message || 'Đăng ký thất bại');
  }, []);

  // Đăng xuất
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => {});
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      disconnectSocket();
      setCurrentUser(null);
      setToken(null);
    }
  }, []);

  // Cập nhật thông tin user (Avatar, bio, full_name...) đồng bộ toàn bộ app
  const updateUser = useCallback((updatedFields) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    currentUser,
    user: currentUser, // Alias tiện dụng
    token,
    isAuthenticated: !!currentUser && !!token,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};

export default AuthContext;
