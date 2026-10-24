import { Routes, Route, Navigate } from "react-router-dom";
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
import LiveStreamBroadcast from "./page/LiveStreamBroadcast";
import LiveStreamView from "./page/LiveStreamView";
import { useNavigate } from 'react-router-dom';
import DebugEnv from "./debug-env";
import AdminDashboard from "./page/Admin/AdminDashboard";

// CONTEXTS
import { useAuth, useSocket } from "./contexts";

// MODAL CUỘC GỌI ĐẾN
import IncomingCallModal from "./components/IncomingCallModal";

// UTILS
import { initAudio, playNotificationSound } from "./utils/notificationSound";
import { unlockCallRingtone, playCallRingtone, stopCallRingtone, playCallEndTone } from "./utils/callRingtone";

function App() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { socket } = useSocket();

  // TRẠNG THÁI CUỘC GỌI ĐẾN
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);

  // UNLOCK AUDIO & REQUEST NOTIFICATION PERMISSION
  useEffect(() => {
    const handleUserInteraction = async () => {
      // 1. Initialize Audio (Quan trọng cho iOS)
      await initAudio();
      unlockCallRingtone(); // Unlock ringtone audio

      // 2. Request Notification Permission
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }

      // Remove listeners after first interaction
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('touchend', handleUserInteraction);
    };

    // Listen to multiple events (iOS needs touchend)
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('touchend', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('touchend', handleUserInteraction);
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

      // Play ringtone for incoming call
      playCallRingtone(isVideo ? 'video' : 'voice');

      // Show browser notification (works even when tab is not active)
      if ("Notification" in window && Notification.permission === "granted") {
        const callType = isVideo ? "cuộc gọi video" : "cuộc gọi thoại";
        const notification = new Notification(`${callerName || 'Ai đó'} đang gọi`, {
          body: `Bạn có ${callType} đến từ ${callerName || 'người dùng'}`,
          icon: callerAvatar || "/logo.svg",
          tag: 'incoming-call', // Prevents duplicate notifications
          requireInteraction: true, // Notification stays until user interacts
          silent: false, // Use system sound (in addition to our ringtone)
        });

        // Navigate to chat when notification is clicked
        notification.onclick = () => {
          window.focus();
          notification.close();
          handleAcceptCall();
        };
      }
    };

    // Handle when caller cancels the call before we answer
    const handleCallCancelled = () => {
      console.log("📞 Call was cancelled by caller");
      stopCallRingtone();
      setShowIncomingCall(false);
      setIncomingCallData(null);
      toast("Cuộc gọi đã kết thúc");
    };

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_ended", handleCallCancelled);
    socket.on("call_cancelled", handleCallCancelled);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_ended", handleCallCancelled);
      socket.off("call_cancelled", handleCallCancelled);
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

    // Stop ringtone when call is accepted
    stopCallRingtone();

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
    // Stop ringtone when call is rejected
    stopCallRingtone();

    // Play call end tone
    playCallEndTone();

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
            path="/live/:streamId"
            element={<LiveStreamView socket={socket} currentUser={currentUser} />}
          />
          <Route
            path="/live/broadcast/:streamId"
            element={<LiveStreamBroadcast socket={socket} currentUser={currentUser} />}
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
          <Route
            path="/saved"
            element={<Navigate to="/profile?tab=saved" replace />}
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
