import { io } from "socket.io-client";

// WebSocket URL từ environment variable
// In production, use Render backend. In development, use localhost
const WS_URL = import.meta.env.VITE_WS_URL
  || import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://hvtsocial-backend.onrender.com' : 'http://localhost:5000');

console.log('🔌 WebSocket Configuration:', {
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  PROD: import.meta.env.PROD,
  WS_URL
});

let registeredUserId = null;

export const socket = io(WS_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  if (registeredUserId) {
    socket.emit("register_user", registeredUserId); // join room user_{id}
  }
});

export const connectSocket = (userId) => {
  if (!userId) return;

  registeredUserId = Number(userId);

  if (!socket.connected) socket.connect();
  else socket.emit("register_user", registeredUserId);
};

export const disconnectSocket = () => {
  registeredUserId = null;
  if (socket.connected) socket.disconnect();
};
