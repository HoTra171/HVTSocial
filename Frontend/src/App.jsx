import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./page/Login";
import SignUp from "./page/SignUp";
import Feed from "./page/Feed";
import CreatePost from "./page/CreatePost";
import Connections from "./page/Connections";
import ChatBox from "./page/Chatbox";
import Profile from "./page/Profile";
import Messages from "./page/Messages";
import Discover from "./page/Discover";
import Layout from "./page/Layout";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import VoiceCall from "./page/VoiceCall";
import VideoCall from "./page/VideoCall";
import ForgotPassword from "./page/ForgotPassword";
import ChangePassword from "./page/ChangePassword";
import NotificationsPage from "./page/NotificationsPage";
import PostDetail from "./page/PostDetail";
import PrivacySettings from "./page/PrivacySettings";
import { useNavigate } from 'react-router-dom';
import DebugEnv from "./debug-env";
import AdminDashboard from "./page/Admin/AdminDashboard";

// SOCKET
import { socket, connectSocket, disconnectSocket } from "./socket";

// MODAL CUỘC GỌI ĐẾN
import IncomingCallModal from "./components/IncomingCallModal";

// UTILS
import { initAudio, playNotificationSound } from "./utils/notificationSound";

function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // TRẠNG THÁI CUỘC GỌI ĐẾN
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);

  // UNLOCK AUDIO & REQUEST NOTIFICATION PERMISSION
  useEffect(() => {
    const handleUserInteraction = () => {
      // 1. Initialize Audio
      initAudio();

      // 2. Request Notification Permission
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }

      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // SETUP SOCKET KHI APP LOAD
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);

        // Connect socket và register user
        connectSocket(userData.id);
        console.log("Socket connected for user:", userData.id);
      } catch (e) {
        console.error("Parse user error:", e);
      }
    }

    // Cleanup socket khi unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  // Lắng nghe trạng thái kết nối socket
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  // LẮNG NGHE CUỘC GỌI ĐẾN TOÀN APP
  useEffect(() => {
    if (!currentUser?.id) return;

    const handleIncomingCall = ({
      from,
      offer,
      isVideo,
      callerName,
      callerAvatar,
      chatId,
    }) => {
      console.log("📞 Global incoming call from:", from);

      setIncomingCallData({
        from,
        offer,
        isVideo,
        callerName,
        callerAvatar,
        chatId,
      });
      setShowIncomingCall(true);
    };

    socket.on("incoming_call", handleIncomingCall);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
    };
  }, [currentUser?.id]);

  // LẮNG NGHE NOTIFICATION & SOUND
  useEffect(() => {
    if (!currentUser?.id) return;

    const showSystemNotification = (title, body) => {
      // Chỉ hiện thông báo nếu App đang ẩn (background) hoặc user cho phép
      if (document.hidden && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(title, {
            body: body,
            icon: "/logo.svg", // Đảm bảo logo có trong public/assets hoặc root
          });
        } catch (e) {
          console.error("Notification error:", e);
        }
      }
    };

    const handleNewNotification = (data) => {
      console.log("New notification:", data);
      playNotificationSound();
      showSystemNotification("HVT Social", data.message || "Bạn có thông báo mới");
    };

    const handleNewMessage = () => {
      playNotificationSound();
      showSystemNotification("Tin nhắn mới", "Bạn có một tin nhắn mới");
    };

    const handleUnreadCount = (count) => {
      console.log("Unread count:", count);
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("receive_message", handleNewMessage);
    socket.on("unread_count", handleUnreadCount);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("receive_message", handleNewMessage);
      socket.off("unread_count", handleUnreadCount);
    };
  }, [currentUser?.id]);

  // CHẤP NHẬN CUỘC GỌI
  const handleAcceptCall = () => {
    if (!incomingCallData) return;

    // LƯU VÀO sessionStorage trước khi navigate
    sessionStorage.setItem('pendingCall', JSON.stringify({
      from: incomingCallData.from,
      isVideo: incomingCallData.isVideo,
      offer: incomingCallData.offer,
    }));

    // NAVIGATE không reload page
    navigate(`/messages/${incomingCallData.chatId || incomingCallData.from}`);

    setShowIncomingCall(false);
    setIncomingCallData(null);
  };

  // TỪ CHỐI CUỘC GỌI
  const handleRejectCall = () => {
    if (incomingCallData) {
      socket.emit("end_call", { to: incomingCallData.from });
    }

    setShowIncomingCall(false);
    setIncomingCallData(null);
    toast("Đã từ chối cuộc gọi");
  };

  return (
    <>
      <Toaster position="top-right" />

      <Routes>
        {/* ================================
            🔹 PUBLIC ROUTES
        ================================= */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/debug-env" element={<DebugEnv />} />

        {/* ================================
            🔹 PRIVATE ROUTES (CÓ LAYOUT)
        ================================= */}
        <Route
          element={<Layout socket={socket} currentUser={currentUser} />}
        >
          <Route
            path="/feed"
            element={<Feed socket={socket} currentUser={currentUser} />}
          />

          <Route
            path="/messages"
            element={<Messages socket={socket} currentUser={currentUser} />}
          />
          <Route
            path="/messages/:chatId"
            element={<ChatBox socket={socket} currentUser={currentUser} />}
          />

          <Route
            path="/voicecall/:chatId"
            element={<VoiceCall socket={socket} currentUser={currentUser} />}
          />
          <Route
            path="/videocall/:chatId"
            element={<VideoCall socket={socket} currentUser={currentUser} />}
          />

          <Route
            path="/connections"
            element={<Connections socket={socket} currentUser={currentUser} />}
          />
          <Route
            path="/discover"
            element={<Discover socket={socket} currentUser={currentUser} />}
          />

          <Route
            path="/profile"
            element={<Profile socket={socket} currentUser={currentUser} />}
          />
          <Route
            path="/profile/:profileId"
            element={<Profile socket={socket} currentUser={currentUser} />}
          />

          <Route
            path="/post/:postId"
            element={<PostDetail socket={socket} currentUser={currentUser} />}
          />

          <Route
            path="/notifications"
            element={
              <NotificationsPage socket={socket} currentUser={currentUser} />
            }
          />

          <Route
            path="/create-post"
            element={<CreatePost socket={socket} currentUser={currentUser} />}
          />

          <Route
            path="/privacy-settings"
            element={<PrivacySettings socket={socket} currentUser={currentUser} />}
          />
        </Route>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>

      {/* MODAL CUỘC GỌI ĐẾN TOÀN APP */}
      {showIncomingCall && incomingCallData && (
        <IncomingCallModal
          caller={{
            name: incomingCallData.callerName || "Unknown",
            avatar: incomingCallData.callerAvatar,
          }}
          isVideoCall={incomingCallData.isVideo}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </>
  );
}

export default App;
