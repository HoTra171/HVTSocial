import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socket } from '../socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      if (currentUser?.id) {
        socket.emit('register_user', currentUser.id);
        socket.emit('get_online_users', (onlineList) => {
          if (Array.isArray(onlineList)) {
            setOnlineUserIds(new Set(onlineList.map(Number)));
          }
        });
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleUserStatusChanged = ({ userId, status }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (status === 'online') {
          next.add(Number(userId));
        } else {
          next.delete(Number(userId));
        }
        return next;
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('user_status_changed', handleUserStatusChanged);

    // Initial check
    if (socket.connected) {
      setIsConnected(true);
      if (currentUser?.id) {
        socket.emit('register_user', currentUser.id);
        socket.emit('get_online_users', (onlineList) => {
          if (Array.isArray(onlineList)) {
            setOnlineUserIds(new Set(onlineList.map(Number)));
          }
        });
      }
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('user_status_changed', handleUserStatusChanged);
    };
  }, [currentUser?.id]);

  // Kiểm tra 1 user có đang online hay không
  const isUserOnline = useCallback(
    (userId) => {
      return onlineUserIds.has(Number(userId));
    },
    [onlineUserIds]
  );

  // Tham gia phòng chat
  const joinChat = useCallback((chatId) => {
    if (chatId) {
      socket.emit('join_chat', chatId);
    }
  }, []);

  // Rời phòng chat
  const leaveChat = useCallback((chatId) => {
    if (chatId) {
      socket.emit('leave_chat', chatId);
    }
  }, []);

  const value = {
    socket,
    isConnected,
    onlineUserIds,
    isUserOnline,
    joinChat,
    leaveChat,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket phải được sử dụng bên trong SocketProvider');
  }
  return context;
};

export default SocketContext;
