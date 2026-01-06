import { io } from "socket.io-client";

// WebSocket URL từ environment variable
const WS_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";

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
