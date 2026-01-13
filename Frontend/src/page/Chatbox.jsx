import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  SendHorizonal,
  ImageIcon,
  Video,
  Phone,
  X,
  ArrowLeft,
  Mic,
  Check,
  CheckCheck,
  AlertCircle,
  Home,
  MessageCircle,
  Search,
  UserIcon,
  Users,
  Bell,
} from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import Loading from "../components/Loading.jsx";
import CallWindow from "../components/CallWindow.jsx";
import { useNavigate } from 'react-router-dom';
import IncomingCallModal from "../components/IncomingCallModal.jsx";
import toast from "react-hot-toast";
import MessageBubble from "../components/MessageWithRetry.jsx";
import { API_URL, SERVER_ORIGIN } from '../constants/api';
import { getFullImageUrl, handleImageError } from '../utils/imageHelper.js';
import Sidebar from "../components/Sidebar.jsx";
import { saveCallHistory, getCallHistoryBetweenUsers } from '../api/callHistory';
import CallHistoryItem from "../components/CallHistoryItem.jsx";

const PAGE = 15;

const Chatbox = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [socketReady, setSocketReady] = useState(false);

  // Force reload marker - v2.0
  console.log("🔄 Chatbox component loaded - Version 2.0");

  const myIdRaw = localStorage.getItem("user");

  const myId = myIdRaw
    ? JSON.parse(myIdRaw).id
    : null;

  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!myId || !chatId || isNaN(Number(chatId)) || Number(chatId) <= 0 || hasRedirected) return;

    const loadChatData = async () => {
      const partnerLoaded = await fetchPartner();
      // Chỉ fetch messages nếu partner load thành công
      if (partnerLoaded) {
        fetchMessages();
      }
    };

    loadChatData();
  }, [chatId, myId, hasRedirected]);


  // Debug: Kiểm tra chatId
  useEffect(() => {
    console.log("🔍 chatId từ URL:", chatId);
    console.log("🔍 chatId type:", typeof chatId);
    console.log("🔍 chatId số:", Number(chatId));
    console.log("🔍 chatId valid?:", !isNaN(Number(chatId)) && Number(chatId) > 0);
  }, [chatId]);

  const [partner, setPartner] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [failedMessages, setFailedMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [text, setText] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [chatSearch, setChatSearch] = useState("");
  const [historyList, setHistoryList] = useState([]);

  const [previewImages, setPreviewImages] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [reactMenuFor, setReactMenuFor] = useState(null);
  const [fullImage, setFullImage] = useState(null);

  // Typing & Online
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const typingTimeoutRef = useRef(null);
  // typing: tránh gửi true liên tục, và tự gửi false khi dừng gõ
  const typingStopTimeoutRef = useRef(null);
  const typingSentRef = useRef(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioStreamRef = useRef(null);

  const scrollRef = useRef(null);
  const socketRef = useRef(null);
  const isSubmittingRef = useRef(false);

  // Call states
  const [inCall, setInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [callStartTime, setCallStartTime] = useState(null);
  const pcRef = useRef(null);
  const remoteUserIdRef = useRef(null);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [showIncomingCall, setShowIncomingCall] = useState(false);

  const fetchCallHistory = async () => {
    if (partner?.target_id) {
      const history = await getCallHistoryBetweenUsers(partner.target_id);
      setHistoryList(history);
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, [partner?.target_id]);


  const partnerIdRef = useRef(null);
  const iceCandidatesQueue = useRef([]); // Queue for early ICE candidates

  useEffect(() => {
    partnerIdRef.current = partner?.target_id || null;
  }, [partner?.target_id]);

  // AUTO ANSWER CALL
  useEffect(() => {
    const pendingCallStr = sessionStorage.getItem('pendingCall');

    if (pendingCallStr && partner?.target_id && socketRef.current) {
      const pendingCall = JSON.parse(pendingCallStr);

      // Clear ngay để không bị gọi lại
      sessionStorage.removeItem('pendingCall');

      console.log('Auto answering call...', pendingCall);

      //  HÀM ĐỢI DEVICE RELEASE
      const waitForDeviceRelease = async (maxAttempts = 5) => {
        for (let i = 0; i < maxAttempts; i++) {
          try {
            // Thử request device
            const testStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: pendingCall.isVideo,
            });

            // Thành công → stop test stream và return
            testStream.getTracks().forEach(track => track.stop());
            return true;
          } catch (err) {
            if (err.name === 'NotReadableError' && i < maxAttempts - 1) {
              // Device vẫn busy → đợi thêm
              console.log(`Device busy, retry ${i + 1}/${maxAttempts}...`);
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              throw err;
            }
          }
        }
        return false;
      };

      // Delay để socket + UI settle
      setTimeout(async () => {
        try {
          //  STOP OLD STREAM NẾU CÓ
          if (localStream) {
            console.log('Stopping old stream...');
            localStream.getTracks().forEach(track => {
              track.stop();
              console.log('Stopped:', track.kind);
            });
            setLocalStream(null);

            // Đợi browser thực sự release device
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          //  ĐỢI DEVICE SẴN SÀNG
          console.log('Waiting for device release...');
          await waitForDeviceRelease();

          console.log('Device ready, requesting stream...');
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: pendingCall.isVideo,
          });

          console.log('Stream obtained, setting up call...');
          setLocalStream(stream);
          setMicOn(true);
          setCamOn(pendingCall.isVideo);
          setIsVideoCall(pendingCall.isVideo);

          const pc = createPeerConnection();
          pcRef.current = pc;
          remoteUserIdRef.current = pendingCall.from;

          stream.getTracks().forEach((t) => pc.addTrack(t, stream));

          await pc.setRemoteDescription(new RTCSessionDescription(pendingCall.offer));

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socketRef.current.emit("answer_call", {
            to: pendingCall.from,
            answer
          });

          setInCall(true);
          setCallStartTime(Date.now());
          toast.success('Đã kết nối cuộc gọi');
        } catch (err) {
          console.error("Auto answer error:", err);

          if (err.name === 'NotReadableError') {
            toast.error('Camera/mic đang được sử dụng bởi ứng dụng khác. Vui lòng đóng tab/ứng dụng đang dùng camera.');
          } else if (err.name === 'NotAllowedError') {
            toast.error('Vui lòng cho phép truy cập camera/mic');
          } else {
            toast.error('Không thể kết nối cuộc gọi: ' + err.message);
          }

          // Gửi end_call nếu lỗi
          socketRef.current?.emit("end_call", { to: pendingCall.from });
        }
      }, 1500); // Tăng delay lên 1.5s
    }
  }, [partner?.target_id, socketReady]);

  const parseShared = (msg) => {
    try {
      return JSON.parse(msg.media_url || "{}");
    } catch {
      return null;
    }
  };

  const parseStoryMeta = (msg) => {
    try {
      return JSON.parse(msg.media_url || "{}");
    } catch {
      return null;
    }
  };


  const openSharedPost = (postId) => {
    if (!postId) return;
    navigate(`/post/${postId}`);
  };


  // Window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Click outside close menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        e.target.closest(".msg-menu") ||
        e.target.closest(".msg-react-menu") ||
        e.target.closest(".msg-icon-bar")
      ) {
        return;
      }
      setOpenMenuId(null);
      setReactMenuFor(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Socket.IO
  useEffect(() => {
    if (!chatId || isNaN(Number(chatId)) || Number(chatId) <= 0) return;
    if (!myId) return;

    const socket = io(SERVER_ORIGIN, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketReady(true);
      socket.emit("register_user", myId);
      socket.emit("join_chat", Number(chatId));
    });

    // Xử lý lỗi kết nối
    socket.on("connect_error", (error) => {
      console.warn("Socket connection error:", error.message);
    });

    socket.on("receive_message", (msg) => {
      if (Number(msg.chat_id) !== Number(chatId)) return;

      setAllMessages((prev) => [...prev, msg]);
      setMessages((prev) => [...prev, msg].slice(-PAGE));

      // Phát âm thanh nếu tin nhắn không phải từ mình
      if (msg.sender_id !== myId) {
        // playMessageSound(); - Removed (Handled globally in App.jsx)
      }

      // nếu muốn tự mark read khi đang mở phòng
      socket.emit("mark_messages_read", { chatId: Number(chatId), userId: myId });
    });


    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setSocketReady(false);
    });

    // nhận call
    socket.on("incoming_call", ({ from, offer, isVideo }) => {
      remoteUserIdRef.current = from;
      setIsVideoCall(!!isVideo);
      setIncomingCallData({
        from,
        offer,
        isVideo,
        callerName: partner?.name || "Unknown",
        callerAvatar: partner?.avatar,
      });
      setShowIncomingCall(true);
    });

    socket.on("call_answered", async ({ answer }) => {
      if (pcRef.current && answer) {
        const state = pcRef.current.signalingState;
        if (state === 'have-local-offer') {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            console.log("Remote description set successfully");

            // Process queued candidates
            while (iceCandidatesQueue.current.length > 0) {
              const candidate = iceCandidatesQueue.current.shift();
              try {
                await pcRef.current.addIceCandidate(candidate);
                console.log("Added queued ICE candidate");
              } catch (e) {
                console.error("Error adding queued candidate:", e);
              }
            }
          } catch (error) {
            console.error("Set remote description error:", error.message);
          }
        } else {
          console.warn("Cannot set remote description, current state:", state);
        }
      }
    });

    socket.on("ice_candidate", async ({ candidate }) => {
      // Validate connection state before adding candidate
      if (pcRef.current && candidate) {
        if (pcRef.current.signalingState === 'closed') {
          console.warn("⚠️ Ignored ICE candidate because PC is closed");
          return;
        }

        // If remote description is set, add directly
        if (pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
          try {
            await pcRef.current.addIceCandidate(candidate);
          } catch (error) {
            console.error("Add ICE candidate error:", error);
          }
        } else {
          // Queue if not ready
          console.log("Queueing ICE candidate (remote desc not ready)");
          iceCandidatesQueue.current.push(candidate);
        }
      }
    });

    socket.on("call_ended", () => cleanupCall());

    // Xử lý khi người gọi hủy cuộc gọi (Missed Call)
    socket.on("call_cancelled", async () => {
      // Chỉ lưu history nếu mình là người nhận và chưa bắt máy
      if (showIncomingCall) {
        console.log("📞 Call missed (cancelled by caller)");
        try {
          // Fetch lại history để hiện missed call mới
          fetchCallHistory();
        } catch (error) {
          console.error("Fetch history error:", error);
        }
      }
      setShowIncomingCall(false);
      setIncomingCallData(null);
    });

    // Khi có cuộc gọi đến, cũng fetch lại history (để hiện Incoming Call nếu muốn, hoặc chuẩn bị)
    socket.on("incoming_call", () => {
      fetchCallHistory();
    });

    // status online
    socket.on("user_status_changed", ({ userId, status }) => {
      if (Number(userId) === Number(partnerIdRef.current)) {
        setIsPartnerOnline(status === "online");
      }
    });

    // typing: dọn timer và báo ngừng gõ trước khi disconnect
    if (typingStopTimeoutRef.current) clearTimeout(typingStopTimeoutRef.current);
    if (typingSentRef.current) {
      socket.emit("typing", { chatId: Number(chatId), userId: myId, isTyping: false });
      typingSentRef.current = false;
    }

    // LISTENER: Typing
    socket.on("user_typing", ({ userId, isTyping }) => {
      if (Number(userId) === Number(partnerIdRef.current)) {
        setIsPartnerTyping(isTyping);
      }
    });

    // LISTENER: Mesages Read
    socket.on("messages_read", ({ chatId: readChatId, readBy }) => {
      if (Number(readChatId) === Number(chatId) && Number(readBy) !== Number(myId)) {
        setMessages(prev => prev.map(m => m.sender_id === myId ? { ...m, status: 'read' } : m));
        setAllMessages(prev => prev.map(m => m.sender_id === myId ? { ...m, status: 'read' } : m));
      }
    });


    return () => {
      socket.emit("leave_chat", Number(chatId));
      socket.off("receive_message");

      // Cleanup: chỉ disconnect nếu socket đã connected hoặc connecting
      if (socket && (socket.connected || socket.connecting)) {
        socket.disconnect();
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [chatId, myId]);



  const handleAcceptCall = async () => {
    if (!incomingCallData || !socketRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCallData.isVideo,
      });

      setLocalStream(stream);
      setMicOn(true);
      setCamOn(incomingCallData.isVideo);

      const pc = createPeerConnection();
      pcRef.current = pc;
      remoteUserIdRef.current = incomingCallData.from;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));

      // Process queued candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        try {
          await pc.addIceCandidate(candidate);
        } catch (e) {
          console.error("Error adding queued candidate in accept:", e);
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit("answer_call", { to: incomingCallData.from, answer });

      setInCall(true);
      setCallStartTime(Date.now());
      setShowIncomingCall(false);
      setIncomingCallData(null);
    } catch (err) {
      console.error("Accept call error:", err);
      handleRejectCall();
    }
  };

  const handleRejectCall = async () => {
    if (incomingCallData && socketRef.current) {
      socketRef.current.emit("end_call", { to: incomingCallData.from });

      // Save rejected call to history
      if (incomingCallData.from) {
        await saveCallHistory(
          incomingCallData.from, // Caller ID
          incomingCallData.isVideo ? 'video' : 'voice',
          'rejected',
          0
        );
        fetchCallHistory(); // Update list
      }
    }
    setShowIncomingCall(false);
    setIncomingCallData(null);
    remoteUserIdRef.current = null;
  };


  // Fetch partner
  const fetchPartner = async () => {
    try {
      console.log("📡 Fetching partner for chatId:", chatId);

      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/chat/user/${myId}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📡 Partner response:", res.data);

      // Nếu không có conversation nào, thử load thông tin user trực tiếp
      if (!res.data || res.data.length === 0) {
        console.log("📡 No conversations found, trying to load user directly...");
        try {
          const userRes = await axios.get(
            `${API_URL}/users/${chatId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (userRes.data) {
            console.log("📡 Loaded user info:", userRes.data);
            setPartner({
              target_id: userRes.data.id,
              name: userRes.data.full_name,
              username: userRes.data.username,
              avatar: userRes.data.avatar,
              is_group_chat: false,
            });
            return true;
          }
        } catch (userErr) {
          console.error("Failed to load user:", userErr);
        }

        setHasRedirected(true);
        toast.error("Không tìm thấy người dùng");
        setTimeout(() => navigate('/messages'), 100);
        return false;
      }

      const unique = Object.values(
        res.data.reduce((acc, row) => {
          acc[row.chat_id] = row;
          return acc;
        }, {})
      );

      // Tìm conversation theo chat_id
      const row = unique.find((c) => Number(c.chat_id) === Number(chatId));

      // Nếu không tìm thấy conversation, thử load user info theo chatId (có thể là userId)
      if (!row) {
        console.log("📡 Conversation not found, trying to load user directly...");
        try {
          const userRes = await axios.get(
            `${API_URL}/users/${chatId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (userRes.data) {
            console.log("📡 Loaded user info:", userRes.data);
            setPartner({
              target_id: userRes.data.id,
              name: userRes.data.full_name,
              username: userRes.data.username,
              avatar: userRes.data.avatar,
              is_group_chat: false,
            });
            return true;
          }
        } catch (userErr) {
          console.error("Failed to load user:", userErr);
        }

        setHasRedirected(true);
        toast.error("Không tìm thấy cuộc trò chuyện");
        setTimeout(() => navigate('/messages'), 100);
        return false;
      }

      setPartner({
        chat_id: row.chat_id,
        name: row.target_name || row.chat_name,
        avatar: row.avatar,
        username: row.target_username,
        target_id: row.target_id,
        is_group_chat: row.is_group_chat,
      });

      return true; // Trả về true khi thành công
    } catch (err) {
      console.error("fetchPartner error:", err);
      return false; // Trả về false khi có lỗi
    }
  };

  // Fetch chat list for sidebar
  const fetchChatList = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !myId) return;

      const res = await axios.get(
        `${API_URL}/chat/user/${myId}/chats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const raw = res.data || [];
      const uniqueChats = Object.values(
        raw.reduce((acc, chat) => {
          const id = chat.chat_id;
          if (!acc[id] || new Date(chat.last_time) > new Date(acc[id].last_time)) {
            acc[id] = chat;
          }
          return acc;
        }, {})
      );
      const sorted = [...uniqueChats].sort((a, b) => {
        if ((a.unread_count || 0) > 0 && (b.unread_count || 0) === 0) return -1;
        if ((a.unread_count || 0) === 0 && (b.unread_count || 0) > 0) return 1;
        return new Date(b.last_time || 0) - new Date(a.last_time || 0);
      });

      setChatList(sorted);
    } catch (err) {
      console.error("fetchChatList error:", err);
    }
  };

  // Fetch chat list on mount
  useEffect(() => {
    if (myId) fetchChatList();
  }, [myId]);

  // Fetch messages
  const fetchMessages = async () => {
    // Validate chatId
    if (!chatId || isNaN(Number(chatId)) || Number(chatId) <= 0) {
      console.error("Invalid chatId for fetchMessages:", chatId);
      return;
    }

    try {
      console.log("📡 Fetching messages for chatId:", Number(chatId));

      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${API_URL}/chat/messages/${Number(chatId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 Messages response:", res.data);

      const sorted = res.data.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      setAllMessages(sorted);
      setMessages(sorted.slice(-PAGE));

      console.log("Messages loaded:", sorted.length);

      if (socketRef.current) {
        socketRef.current.emit("mark_messages_read", {
          chatId: Number(chatId),
          userId: myId,
        });
      }
    } catch (err) {
      console.error("fetchMessages error:", err);
      console.error("Error details:", err.response?.data);

      // If 403 Forbidden, redirect back to messages list
      if (err.response?.status === 403) {
        setHasRedirected(true);
        toast.error("Bạn không có quyền truy cập cuộc trò chuyện này");
        setTimeout(() => navigate('/messages'), 100);
      }
    }
  };

  // useEffect bị xóa vì trùng lặp với useEffect ở trên (dòng 43-55)
  // useEffect cũ này không kiểm tra hasRedirected nên gây ra lỗi 403

  // Load more
  const loadMore = () => {
    const total = allMessages.length;
    const current = messages.length;
    if (current >= total) return;

    const next = Math.min(total, current + PAGE);
    setMessages(allMessages.slice(total - next));
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setTimeout(() => {
      el.scrollTop = el.scrollHeight;
    }, 80);
  }, [messages]);

  useEffect(() => {
    return () => {
      // Cleanup khi rời khỏi trang chat
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);


  const handleTyping = () => {
    if (!socketRef.current) return;

    // báo đang gõ chỉ 1 lần
    if (!typingSentRef.current) {
      typingSentRef.current = true;
      socketRef.current.emit("typing", {
        chatId: Number(chatId),
        userId: myId,
        isTyping: true,
      });
    }

    // reset timer, nếu người dùng dừng gõ thì gửi isTyping false
    if (typingStopTimeoutRef.current) clearTimeout(typingStopTimeoutRef.current);
    typingStopTimeoutRef.current = setTimeout(() => {
      typingSentRef.current = false;
      socketRef.current?.emit("typing", {
        chatId: Number(chatId),
        userId: myId,
        isTyping: false,
      });
    }, 1200);
  };


  const sendMessage = async () => {
    if (!socketRef.current || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      // SỬA TIN NHẮN
      if (editingMessage) {
        try {
          socketRef.current.emit("edit_message", {
            messageId: editingMessage.id,
            newContent: text,
            chatId: Number(chatId),
          });

          setEditingMessage(null);
          setText("");
          setReplyingTo(null);
        } catch (err) {
          console.error("Edit message error:", err);
        }
        return;
      }

      // GỬI TIN NHẮN TEXT
      if (text.trim()) {
        const payload = replyingTo
          ? {
            chatId: Number(chatId),
            senderId: myId,
            content: text,
            message_type: "text",
            reply_to_id: replyingTo.id,
            reply_content: replyingTo.content,
            reply_type: replyingTo.message_type,
            reply_sender: replyingTo.sender_name,
          }
          : {
            chatId: Number(chatId),
            senderId: myId,
            content: text,
            message_type: "text",
          };

        // CLEAR INPUT NGAY
        setText("");
        setReplyingTo(null);

        try {
          socketRef.current.emit("send_message", payload, (response) => {
            if (!response.ok) {
              toast.error("Không thể gửi tin nhắn");
            }
          });

          socketRef.current.emit("typing", {
            chatId: Number(chatId),
            userId: myId,
            isTyping: false,
          });
        } catch (err) {
          console.error("Send message error:", err);
          toast.error("Không thể gửi tin nhắn");
        }
      }

      // GỬI ẢNH
      const imagesToSend = [...previewImages];
      if (imagesToSend.length > 0) {
        setPreviewImages([]); // Clear state immediately

        for (const img of imagesToSend) {
          try {
            const form = new FormData();
            form.append("file", img.file);

            const token = localStorage.getItem("token");
            const uploadRes = await axios.post(
              `${API_URL}/upload`,
              form,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  "Authorization": `Bearer ${token}`
                }
              }
            );

            socketRef.current.emit("send_message", {
              chatId: Number(chatId),
              senderId: myId,
              content: "",
              message_type: "image",
              media_url: uploadRes.data.url,
              created_at: new Date().toISOString(),
            });
          } catch (err) {
            console.error("Upload image error:", err);
            toast.error("Gửi ảnh thất bại!");
          }
        }
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };


  const retryMessage = (failedMsg) => {
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    setFailedMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));

    if (failedMsg.message_type === "text") {
      setText(failedMsg.content);
      setTimeout(() => sendMessage(), 100);
    }
  };




  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      // Try to use ogg/opus codec if supported, fallback to default
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')) {
        options = { mimeType: 'audio/ogg; codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
        options = { mimeType: 'audio/webm; codecs=opus' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          // Get the actual MIME type from the recorder
          const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";

          const blob = new Blob(audioChunksRef.current, {
            type: mimeType,
          });

          // Determine file extension based on MIME type
          const extension = mimeType.includes('ogg') ? 'ogg' : 'webm';
          const file = new File([blob], `voice_${Date.now()}.${extension}`, {
            type: mimeType,
          });

          const form = new FormData();
          form.append("file", file);

          const token = localStorage.getItem("token");
          const uploadRes = await axios.post(
            `${API_URL}/upload`,
            form,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${token}`
              }
            }
          );

          socketRef.current.emit("send_message", {
            chatId: Number(chatId),
            senderId: myId,
            message_type: "voice",
            media_url: uploadRes.data.url,
            duration: recordingTime,
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Upload audio error:", err);
        } finally {
          audioStreamRef.current?.getTracks().forEach((t) => t.stop());
          audioStreamRef.current = null;
          audioChunksRef.current = [];
          setRecordingTime(0);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("startRecording error:", err);
    }
  };

  const stopRecording = () => {
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error("stopRecording error:", err);
    }

    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const recallMessage = (messageId) => {
    if (!socketRef.current) return;

    socketRef.current.emit("recall_message", {
      messageId,
      chatId: Number(chatId),
    });

    setAllMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, recalled: true, content: "" } : m
      )
    );
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, recalled: true, content: "" } : m
      )
    );
  };

  const sendReaction = (messageId, emoji) => {
    if (!socketRef.current) return;

    socketRef.current.emit("send_reaction", {
      messageId,
      emoji,
      chatId: Number(chatId),
    });

    setAllMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reaction: emoji } : m))
    );
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reaction: emoji } : m))
    );
  };

  // Parse reply data
  const parseMessage = (msg) => {
    // Không phải text thì khỏi parse JSON
    if (msg.message_type !== "text" || !msg.content) {
      return { ...msg, isReply: false, actualContent: msg.content || "" };
    }
    try {
      const data = JSON.parse(msg.content);
      if (data.reply_to) {
        return {
          ...msg,
          isReply: true,
          replyData: {
            id: data.reply_to,
            content: data.reply_content,
            type: data.reply_type,
            sender: data.reply_sender
          },
          actualContent: data.message
        };
      }
    } catch (e) {
      // Không phải JSON, tin nhắn bình thường
    }
    return { ...msg, isReply: false, actualContent: msg.content };
  };

  // Hiển thị thời gian
  const shouldShowTime = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const diff = new Date(currentMsg.created_at) - new Date(prevMsg.created_at);
    return diff > 5 * 60 * 1000; // 5 phút
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessageStatus = (msg) => {
    if (msg.sender_id !== myId) return null;

    if (msg.failed) {
      return (
        <div className="flex items-center gap-1 text-red-500">
          <AlertCircle size={14} />
          <span className="text-xs">Gửi thất bại</span>
        </div>
      );
    }

    if (msg.status === "read") {
      return <CheckCheck size={14} className="text-blue-500" />;
    } else if (msg.status === "delivered") {
      return <CheckCheck size={14} className="text-gray-400" />;
    } else {
      return <Check size={14} className="text-gray-400" />;
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
    });

    pc.ontrack = (event) => {
      console.log("🎥 Received remote track:", event.streams[0]);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice_candidate", {
          to: remoteUserIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("⚠️ ICE Connection State:", pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        toast.error("Kết nối cuộc gọi không ổn định");
      }
    };

    return pc;
  };

  // Toggle camera
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOn(videoTrack.enabled);
        console.log('📹 Camera', videoTrack.enabled ? 'ON' : 'OFF');
      }
    }
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
        console.log('🎤 Mic', audioTrack.enabled ? 'ON' : 'OFF');
      }
    }
  };

  const startCall = async (isVideo) => {
    // Validate prerequisites
    if (!partner?.target_id) {
      toast.error('Không tìm thấy người nhận');
      return;
    }

    if (!socketRef.current || !socketRef.current.connected) {
      toast.error('Kết nối socket bị mất. Vui lòng tải lại trang.');
      return;
    }

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Trình duyệt không hỗ trợ cuộc gọi');
      return;
    }

    try {
      console.log('🔵 Starting call:', { isVideo, partnerId: partner.target_id, chatId });

      // STOP LOCAL STREAM CŨ TRƯỚC
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped old track:', track.kind);
        });
        setLocalStream(null);
      }

      console.log('📹 Requesting media devices...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      console.log('✅ Media devices granted');

      setLocalStream(stream);
      setMicOn(true);
      setCamOn(isVideo);
      setIsVideoCall(isVideo);

      const pc = createPeerConnection();
      pcRef.current = pc;
      remoteUserIdRef.current = partner.target_id;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('📞 Emitting call_user to:', partner.target_id);
      socketRef.current.emit("call_user", {
        to: partner.target_id,
        offer,
        isVideo,
        chatId: Number(chatId),
      });

      setInCall(true);
      setCallStartTime(Date.now());
      toast.success(isVideo ? 'Đang gọi video...' : 'Đang gọi...');
      console.log('✅ Call initiated successfully');
    } catch (err) {
      console.error("❌ Start call error:", err);

      if (err.name === 'NotReadableError') {
        toast.error('Camera/mic đang được sử dụng bởi ứng dụng khác');
      } else if (err.name === 'NotAllowedError') {
        toast.error('Vui lòng cho phép truy cập camera/mic');
      } else {
        toast.error('Không thể bắt đầu cuộc gọi');
      }
    }
  };

  const cleanupCall = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();

    setLocalStream(null);
    setRemoteStream(null);
    setInCall(false);
  };

  const endCall = async () => {
    console.log('Ending call...');

    // Calculate call duration and save to history
    let duration = 0;
    if (callStartTime) {
      duration = Math.floor((Date.now() - callStartTime) / 1000); // seconds
      console.log('📞 Call duration:', duration, 'seconds');
    }

    // Save call history if call was connected
    if (partner?.target_id && duration > 0) {
      try {
        await saveCallHistory(
          partner.target_id,
          isVideoCall ? 'video' : 'voice',
          'completed',
          duration
        );
        console.log('✅ Call history saved');

        // Format duration for toast
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        toast.success(`Cuộc gọi kết thúc sau ${durationStr}`, { duration: 3000 });

        fetchCallHistory(); // Refresh list immediately
      } catch (error) {
        console.error('Failed to save call history:', error);
        toast('Đã kết thúc cuộc gọi', { duration: 3000 });
      }
    } else {
      toast('Đã kết thúc cuộc gọi', { duration: 3000 });
    }

    // STOP ALL TRACKS
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        console.log('Stopped local track:', track.kind);
      });
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => {
        track.stop();
        console.log('Stopped remote track:', track.kind);
      });
    }

    if (pcRef.current) {
      pcRef.current.close();
      console.log('PeerConnection closed');
    }

    if (socketRef.current && remoteUserIdRef.current) {
      socketRef.current.emit("end_call", { to: remoteUserIdRef.current });
    }

    setInCall(false);
    setLocalStream(null);
    setRemoteStream(null);
    setIsVideoCall(false);
    setCallStartTime(null);
    pcRef.current = null;
    remoteUserIdRef.current = null;
  };

  // Show loading hoặc error
  if (!chatId || isNaN(Number(chatId))) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center h-[100dvh] w-full bg-[#f0f2f5]">
        <div className="text-center">
          <p className="text-red-500 text-lg font-semibold">Chat ID không hợp lệ</p>
          <p className="text-gray-500 mt-2">Vui lòng chọn một cuộc trò chuyện</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center h-[100dvh] w-full bg-[#f0f2f5]">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex h-[100dvh] w-full overflow-hidden bg-[#f0f2f5]">

        {/* MINI SIDEBAR - Icon Only (Instagram Style) */}
        <Sidebar collapsed={true} relative={true} currentUserId={myId} setSidebarOpen={() => { }} />

        {/* RECENT CHATS LIST (like RecentMessages) */}
        <div className="hidden sm:flex flex-col w-80 bg-white border-r overflow-hidden border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-lg mb-3">Tin nhắn</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatList.filter(item =>
              !chatSearch || item.target_name?.toLowerCase().includes(chatSearch.toLowerCase())
            ).map((item) => (
              <div
                key={item.chat_id}
                onClick={() => navigate(`/messages/${item.chat_id}`)}
                className={`flex items-center gap-3 py-2 px-3 cursor-pointer hover:bg-gray-100 transition ${Number(chatId) === Number(item.chat_id) ? 'bg-gray-100' : ''}`}
              >
                <img
                  src={item.avatar || (item.is_group_chat ? "/group.png" : "/default.jpg")}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="font-medium text-sm truncate">{item.target_name}</p>
                    <p className="text-[10px] text-gray-400 flex-shrink-0">
                      {item.last_time ? new Date(item.last_time).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }).split(',')[0] : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 truncate flex-1">
                      {item.last_message ||
                        (item.last_message_type === "image"
                          ? "📷 Ảnh"
                          : item.last_message_type === "voice"
                            ? "🎤 Tin nhắn thoại"
                            : "Chưa có tin nhắn")}
                    </p>
                    {item.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center flex-shrink-0">
                        {item.unread_count > 99 ? "99+" : item.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {chatList.length === 0 && (
              <p className="text-sm text-gray-500 p-4 text-center">Chưa có cuộc trò chuyện nào</p>
            )}
          </div>
        </div>

        {/* CHAT CONTENT */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">

          {/* HEADER - Sticky Top */}
          <div className="shrink-0 flex items-center gap-3 p-3 bg-white shadow z-20">
            {/* Nút quay lại - luôn hiện để thoát fullscreen chat */}
            <button
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Quay lại"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="relative">
              <img
                src={
                  partner.is_group_chat
                    ? "/group.png"
                    : partner.avatar || "/default.jpg"
                }
                className="w-10 h-10 rounded-full"
                alt=""
              />
              {!partner.is_group_chat && (
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isPartnerOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                />
              )}
            </div>

            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="font-medium truncate" title={partner.name}>{partner.name}</p>
              {!partner.is_group_chat && (
                <p className="text-xs text-gray-500 truncate" title={isPartnerOnline ? "Đang hoạt động" : `@${partner.username}`}>
                  {isPartnerOnline ? "Đang hoạt động" : `@${partner.username}`}
                </p>
              )}
            </div>

            <div className="flex-1" />

            <button
              onClick={() => startCall(false)}
              disabled={!partner?.target_id || !socketRef.current?.connected}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title={!partner?.target_id ? 'Đang tải thông tin...' : !socketRef.current?.connected ? 'Mất kết nối' : 'Gọi thoại'}
            >
              <Phone size={18} />
            </button>

            <button
              onClick={() => startCall(true)}
              disabled={!partner?.target_id || !socketRef.current?.connected}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              title={!partner?.target_id ? 'Đang tải thông tin...' : !socketRef.current?.connected ? 'Mất kết nối' : 'Gọi video'}
            >
              <Video size={18} />
            </button>
          </div>

          {/* BODY */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4"
            onScroll={(e) => {
              if (e.target.scrollTop === 0) loadMore();
            }}
          >


            {messages.length === 0 && historyList.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                <p>Chưa có tin nhắn nào</p>
                <p className="text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            )}

            {[...messages, ...historyList]
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
              .map((item, idx, arr) => {
                // CASE 1: Call History Item
                if (item.call_type) {
                  return (
                    <CallHistoryItem
                      key={`call-${item.id}`}
                      callHistory={item}
                      currentUserId={myId}
                    />
                  );
                }

                // CASE 2: Normal Message
                const msg = item; // Alias for clarity

                const isMe = msg.sender_id === myId;
                // Note: We need to check against the previous item in this SORTED list, 
                // but since we are inside the map of an in-line array, we don't have a reference to the array itself easily.
                // However, `map` provides the array as the 3rd argument!
                // .map((item, idx, array) => ...

                // Let's rely on a small trick or just ignore strict timestamp grouping for now for mixed types, 
                // OR better: I will fix this systematically in the next step. 
                // For now, let's just make it runnable:
                const prevMsg = idx > 0 ? arr[idx - 1] : null;

                const showTime = shouldShowTime(msg, prevMsg);
                const parsed = parseMessage(msg);

                const storyMeta = parseStoryMeta(msg);
                const isStoryReply = !!storyMeta?.storyId;

                const keepLegacy =
                  parsed.isReply ||
                  msg.message_type === "shared_post" ||
                  isStoryReply;


                const msgForBubble =
                  msg.message_type === "text" ? { ...msg, content: parsed.actualContent } : msg;

                return (
                  <React.Fragment key={`${msg.id}-${msg.created_at}`}>
                    {showTime && (
                      <div className="text-center text-xs text-gray-400 my-2">
                        {formatTime(msg.created_at)}
                      </div>
                    )}

                    {keepLegacy ? (
                      <div className={`flex items-start gap-2 mb-2 ${isMe ? "justify-end" : "justify-start"}`}>
                        {!isMe && (
                          <img
                            src={partner.avatar || "/default.jpg"}
                            className="w-8 h-8 rounded-full"
                            alt=""
                          />
                        )}

                        <div className="relative max-w-[70%] group">
                          {/* Menu thu hồi cho tin nhắn của mình */}
                          {isMe && !msg.recalled && (
                            <button
                              onClick={() => recallMessage(msg.id)}
                              className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white shadow-md rounded-full text-red-500 hover:bg-red-50"
                              title="Thu hồi"
                            >
                              <X size={16} />
                            </button>
                          )}

                          {parsed.isReply && (
                            <div className="mb-1 px-3 py-2 bg-gray-100 rounded-lg text-xs border-l-2 border-blue-500">
                              <p className="font-semibold text-gray-600">{parsed.replyData.sender}</p>
                              <p className="text-gray-500 truncate">
                                {parsed.replyData.type === "text"
                                  ? parsed.replyData.content
                                  : parsed.replyData.type === "image"
                                    ? "📷 Hình ảnh"
                                    : "🎤 Tin nhắn thoại"}
                              </p>
                            </div>
                          )}

                          {msg.recalled ? (
                            <div className="italic opacity-60 px-3 py-2 bg-gray-200 rounded-2xl text-sm">
                              Tin nhắn đã thu hồi
                            </div>
                          ) : msg.message_type === "image" ? (
                            <div className="flex flex-col gap-1">
                              <img
                                src={getFullImageUrl(msg.media_url)}
                                className="max-w-[220px] rounded-xl cursor-pointer shadow"
                                onClick={() => setFullImage(getFullImageUrl(msg.media_url))}
                                alt=""
                                onError={(e) => handleImageError(e, msg.media_url)}
                              />
                              <div className="flex justify-end">{renderMessageStatus(msg)}</div>
                            </div>
                          ) : msg.message_type === "shared_post" ? (
                            <div className="flex flex-col gap-1">
                              {(() => {
                                const data = parseShared(msg);
                                return (
                                  <button
                                    onClick={() => {
                                      openSharedPost(data?.postId);
                                      console.log("Open shared post:", data?.postId);
                                    }}
                                    className="text-left w-full"
                                  >
                                    <div className="p-3 rounded-xl border bg-white shadow-sm">
                                      <p className="font-semibold text-sm">Bài viết được chia sẻ</p>
                                      <p className="text-xs text-gray-600 line-clamp-2">
                                        {data?.content || "Nhấn để xem bài viết"}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })()}
                              <div className="flex justify-end">{renderMessageStatus(msg)}</div>
                            </div>
                          ) : (
                            <div
                              className={`px-3 py-2 rounded-2xl text-sm shadow ${isMe ? "bg-blue-600 text-white" : "bg-white text-black"}`}
                            >
                              {isStoryReply && (
                                <div className={`text-xs mb-1 ${isMe ? "text-white/80" : "text-gray-500"}`}>
                                  Bạn đã trả lời tin của {storyMeta?.storyOwnerName || partner.name}
                                </div>
                              )}


                              {msg.message_type === "voice" ? (
                                <audio src={msg.media_url} controls className="max-w-[220px]" />
                              ) : (
                                <div>{parsed.actualContent}</div>
                              )}
                              <div className="flex justify-end mt-1">{renderMessageStatus(msg)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <MessageBubble
                        msg={msgForBubble}
                        isMe={isMe}
                        partner={partner}
                        onRetry={retryMessage}
                        onReact={sendReaction}
                        onEdit={(m) => {
                          setEditingMessage(m);
                          setText(parseMessage(m).actualContent || "");
                          setReplyingTo(null);
                        }}
                        onRecall={recallMessage}
                        onImageClick={(url) => setFullImage(url)}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        reactMenuFor={reactMenuFor}
                        setReactMenuFor={setReactMenuFor}
                      />
                    )}
                  </React.Fragment>
                );
              })}

            {/* Typing indicator */}
            {isPartnerTyping && (
              <div className="flex items-center gap-2 px-3 py-2">
                <img
                  src={partner.avatar || "/default.jpg"}
                  className="w-8 h-8 rounded-full"
                  alt=""
                />
                <div className="bg-gray-200 rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PREVIEW IMAGES - Above Input */}
          {previewImages.length > 0 && (
            <div className="sticky bottom-[72px] p-3 bg-white shadow-md border-t z-10">
              <div className="flex overflow-x-auto gap-3 pb-2">
                {previewImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img.url}
                      className="w-[90px] h-[90px] rounded-xl object-cover border shadow"
                      alt=""
                    />
                    <button
                      onClick={() =>
                        setPreviewImages((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="absolute top-0 -right-2 bg-black/70 text-white w-6 h-6 rounded-full flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply preview */}
          {replyingTo && (
            <div className="p-3 bg-gray-50 border-t flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Đang trả lời</p>
                <p className="text-sm truncate">
                  {replyingTo.message_type === 'text' ? replyingTo.content :
                    replyingTo.message_type === 'image' ? '📷 Hình ảnh' : '🎤 Thoại'}
                </p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-gray-200 rounded-full">
                <X size={16} />
              </button>
            </div>
          )}

          {/* INPUT - Sticky Bottom */}
          <div className="sticky bottom-0 shrink-0 p-3 bg-white flex items-center gap-2 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-20">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2.5 rounded-full flex-shrink-0 ${isRecording ? "bg-red-500 text-white" : "bg-gray-200 text-black"
                }`}
            >
              <Mic size={20} />
            </button>

            {isRecording && (
              <span className="text-xs text-red-500 min-w-[40px] flex-shrink-0">
                {recordingTime}s
              </span>
            )}

            <label className="flex-shrink-0 cursor-pointer">
              <ImageIcon className="w-6 h-6 text-gray-700" />
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const previews = files.map((file) => ({
                    file,
                    url: URL.createObjectURL(file),
                  }));
                  setPreviewImages((prev) => [...prev, ...previews]);
                }}
              />
            </label>

            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={editingMessage ? "Chỉnh sửa tin nhắn..." : "Aa"}
              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full outline-none min-w-0"
            />

            <button
              onClick={sendMessage}
              className="p-2.5 bg-blue-600 rounded-full text-white flex-shrink-0 hover:bg-blue-700 transition"
            >
              <SendHorizonal size={20} />
            </button>
          </div>
        </div>
        {/* END CHAT CONTENT */}
      </div>

      {/* FULL IMAGE */}
      {
        fullImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]"
            onClick={() => setFullImage(null)}
          >
            <img
              src={fullImage}
              className="max-w-[92%] max-h-[92%] rounded-xl shadow-2xl object-contain"
              alt=""
            />
          </div>
        )
      }

      {/* CALL WINDOW */}
      {
        inCall && (
          <CallWindow
            localStream={localStream}
            remoteStream={remoteStream}
            onEnd={endCall}
            micOn={micOn}
            camOn={camOn}
            toggleMic={toggleMicrophone}
            toggleCam={toggleCamera}
            isVideoCall={isVideoCall}
          />
        )
      }

      {/*THÊM INCOMING CALL MODAL */}
      {
        showIncomingCall && incomingCallData && (
          <IncomingCallModal
            caller={{
              name: incomingCallData.callerName,
              avatar: incomingCallData.callerAvatar,
            }}
            isVideoCall={incomingCallData.isVideo}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
          />
        )
      }
    </>
  );
};
export default Chatbox;