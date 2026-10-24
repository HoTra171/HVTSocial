import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Radio,
  Eye,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Camera,
  MessageSquare,
  Send,
  X,
  PhoneOff,
  Clock,
  Sparkles,
  Users,
  Heart,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, useSocket } from '../contexts';
import { liveStreamApi } from '../api/liveStreamApi';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
};

const LiveStreamBroadcast = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { socket } = useSocket();

  const [streamInfo, setStreamInfo] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMuted, setIsMuted] = useState(Boolean(location.state?.initialMuted));
  const [isCameraOff, setIsCameraOff] = useState(Boolean(location.state?.initialCameraOff));
  const [isScreenSharing, setIsScreenSharing] = useState(location.state?.sourceType === 'screen');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Chat & Reactions
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [reactions, setReactions] = useState([]);

  // Media & WebRTC Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map()); // viewerSocketId -> RTCPeerConnection
  const timerRef = useRef(null);
  const commentsEndRef = useRef(null);

  // 1. Khởi tạo Stream Thông tin và Media
  useEffect(() => {
    let isMounted = true;

    const initBroadcast = async () => {
      try {
        const res = await liveStreamApi.getById(streamId);
        if (isMounted) {
          setStreamInfo(res.data);
        }

        // Khởi tạo Local Media Stream
        let stream;
        if (location.state?.sourceType === 'screen') {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Bắt đầu đếm giờ
        timerRef.current = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, 1000);

        // Báo cho socket biết Host bắt đầu stream
        if (socket) {
          socket.emit('host_start_livestream', {
            streamId,
            title: res.data?.title,
            user: currentUser,
          });
        }
      } catch (err) {
        console.error('Lỗi khởi tạo broadcast:', err);
        toast.error('Không thể truy cập camera hoặc thông tin phòng Live');
        navigate('/feed');
      }
    };

    initBroadcast();

    return () => {
      isMounted = false;
      clearInterval(timerRef.current);
      cleanupMedia();
    };
  }, [streamId, socket]);

  // Dọn dẹp thiết bị và kết nối WebRTC
  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    peersRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    peersRef.current.clear();
  };

  // 2. Lắng nghe Socket Events cho WebRTC 1-to-many & Chat
  useEffect(() => {
    if (!socket) return;

    // Khi có viewer mới tham gia phòng live
    const handleViewerJoined = async ({ viewerSocketId, viewerUser }) => {
      console.log(`[Host] Viewer joined: ${viewerSocketId}`, viewerUser);

      if (!localStreamRef.current) return;

      try {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peersRef.current.set(viewerSocketId, pc);

        // Gắn các track âm thanh/hình ảnh của Host vào PeerConnection cho viewer này
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });

        // ICE candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('livestream_ice_candidate', {
              targetSocketId: viewerSocketId,
              candidate: event.candidate,
            });
          }
        };

        // Tạo offer gửi tới viewer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('livestream_offer', {
          streamId,
          toViewerSocketId: viewerSocketId,
          offer,
        });
      } catch (err) {
        console.error('Lỗi khi thiết lập peer connection cho viewer:', err);
      }
    };

    // Khi nhận answer từ viewer
    const handleViewerAnswer = async ({ fromViewerSocketId, answer }) => {
      const pc = peersRef.current.get(fromViewerSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Set remote description error:', err);
        }
      }
    };

    // Khi nhận ICE candidate từ viewer
    const handleIceCandidate = async ({ fromSocketId, candidate }) => {
      const pc = peersRef.current.get(fromSocketId);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Add ice candidate error:', err);
        }
      }
    };

    // Khi viewer rời phòng
    const handleViewerLeft = ({ viewerSocketId }) => {
      const pc = peersRef.current.get(viewerSocketId);
      if (pc) {
        try {
          pc.close();
        } catch {}
        peersRef.current.delete(viewerSocketId);
      }
    };

    // Cập nhật số người xem
    const handleViewerCount = ({ count }) => {
      setViewerCount(count);
    };

    // Nhận bình luận mới
    const handleNewComment = (comment) => {
      setComments((prev) => [...prev.slice(-40), comment]);
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    };

    // Nhận cảm xúc / tim bay lên
    const handleNewReaction = ({ id, emoji }) => {
      setReactions((prev) => [...prev, { id, emoji, left: Math.random() * 80 + 10 }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2500);
    };

    socket.on('viewer_joined', handleViewerJoined);
    socket.on('livestream_answer', handleViewerAnswer);
    socket.on('livestream_ice_candidate', handleIceCandidate);
    socket.on('viewer_left', handleViewerLeft);
    socket.on('livestream_viewer_count', handleViewerCount);
    socket.on('livestream_new_comment', handleNewComment);
    socket.on('livestream_new_reaction', handleNewReaction);

    return () => {
      socket.off('viewer_joined', handleViewerJoined);
      socket.off('livestream_answer', handleViewerAnswer);
      socket.off('livestream_ice_candidate', handleIceCandidate);
      socket.off('viewer_left', handleViewerLeft);
      socket.off('livestream_viewer_count', handleViewerCount);
      socket.off('livestream_new_comment', handleNewComment);
      socket.off('livestream_new_reaction', handleNewReaction);
    };
  }, [socket, streamId]);

  // Điều khiển Micro
  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  // Điều khiển Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  };

  // Chuyển đổi Chia sẻ màn hình / Camera
  const toggleScreenShare = async () => {
    try {
      let newStream;
      if (!isScreenSharing) {
        newStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } else {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      }

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Thay thế track cho tất cả các viewer đang kết nối
      peersRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && newVideoTrack) {
          sender.replaceTrack(newVideoTrack);
        }
      });

      // Dừng video track cũ
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(newVideoTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      setIsScreenSharing(!isScreenSharing);

      // Tự động revert khi người dùng dừng chia sẻ màn hình qua browser native bar
      newVideoTrack.onended = () => {
        toggleScreenShare();
      };
    } catch (err) {
      console.warn('Lỗi chuyển đổi màn hình/camera:', err);
    }
  };

  // Gửi bình luận từ Host
  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !socket) return;

    socket.emit('livestream_send_comment', {
      streamId,
      user: currentUser,
      content: commentText.trim(),
    });
    setCommentText('');
  };

  // Kết thúc buổi phát trực tiếp
  const handleConfirmEndStream = async () => {
    try {
      if (socket) {
        socket.emit('host_end_livestream', { streamId });
      }
      await liveStreamApi.end(streamId);
      cleanupMedia();
      toast.success('Buổi phát trực tiếp đã kết thúc');
      navigate('/feed');
    } catch (err) {
      console.error('End stream error:', err);
      navigate('/feed');
    }
  };

  // Định dạng thời gian
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col z-50 select-none overflow-hidden">
      {/* 1. TOP HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-5 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          {/* LIVE STATUS PILL */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 tracking-wider animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            <span>TRỰC TIẾP</span>
          </div>

          {/* VIEWER COUNT */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-semibold">
            <Eye className="w-3.5 h-3.5 text-slate-300" />
            <span>{viewerCount}</span>
          </div>

          {/* TIMER */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-medium text-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>

        {/* HOST INFO & END BUTTON */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
            <img
              src={currentUser?.avatar || '/default.jpg'}
              alt={currentUser?.full_name}
              className="w-7 h-7 rounded-full object-cover border border-white/20"
            />
            <span className="text-xs font-bold text-white max-w-[120px] truncate">
              {currentUser?.full_name || 'Host'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowEndConfirm(true)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Kết thúc</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN VIDEO DISPLAY */}
      <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover transition-transform ${
            !isScreenSharing ? '-scale-x-100' : ''
          } ${isCameraOff ? 'hidden' : 'block'}`}
        />

        {isCameraOff && (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <VideoOff className="w-16 h-16 mb-3 text-slate-700" />
            <p className="text-sm font-semibold">Camera đang tắt</p>
          </div>
        )}

        {/* FLOATING REACTIONS CANVAS */}
        <div className="absolute inset-y-0 right-4 sm:right-12 w-24 pointer-events-none overflow-hidden z-20">
          {reactions.map((rx) => (
            <div
              key={rx.id}
              className="absolute bottom-16 text-3xl animate-float-up opacity-90"
              style={{ left: `${rx.left}%` }}
            >
              {rx.emoji}
            </div>
          ))}
        </div>

        {/* CHAT COMMENTS OVERLAY (BOTTOM LEFT) */}
        <div className="absolute bottom-20 left-3 sm:left-6 max-w-sm sm:max-w-md w-full max-h-[320px] overflow-y-auto no-scrollbar pointer-events-auto z-20 space-y-2 flex flex-col justify-end">
          {comments.map((c) => (
            <div
              key={c.id}
              className="inline-flex items-start gap-2.5 p-2 px-3 rounded-2xl bg-black/55 backdrop-blur-md border border-white/10 max-w-[90%] shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              <img
                src={c.user?.avatar || '/default.jpg'}
                alt=""
                className="w-6 h-6 rounded-full object-cover border border-white/20 mt-0.5"
                onError={(e) => {
                  e.currentTarget.src = '/default.jpg';
                }}
              />
              <div className="text-xs leading-snug">
                <span className="font-bold text-slate-200 mr-1.5">{c.user?.full_name || 'Khán giả'}:</span>
                <span className="text-white/90">{c.content}</span>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* 3. BOTTOM CONTROLS BAR */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20 flex items-center justify-between gap-3">
        {/* Comment input form for Host */}
        <form onSubmit={handleSendComment} className="flex-1 max-w-md flex items-center gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Nói gì đó với tư cách là Người phát sóng..."
            className="flex-1 px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition"
          />
          <button
            type="submit"
            className="p-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition cursor-pointer"
            title="Gửi"
          >
            <Send size={15} />
          </button>
        </form>

        {/* Media Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMic}
            className={`p-3 rounded-2xl backdrop-blur-md transition cursor-pointer ${
              isMuted ? 'bg-red-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={isMuted ? 'Bật Mic' : 'Tắt Mic'}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className={`p-3 rounded-2xl backdrop-blur-md transition cursor-pointer ${
              isCameraOff ? 'bg-red-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={isCameraOff ? 'Bật Camera' : 'Tắt Camera'}
          >
            {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>

          <button
            type="button"
            onClick={toggleScreenShare}
            className={`p-3 rounded-2xl backdrop-blur-md transition cursor-pointer ${
              isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title="Chia sẻ màn hình"
          >
            {isScreenSharing ? <Monitor size={18} /> : <Camera size={18} />}
          </button>
        </div>
      </div>

      {/* CONFIRMATION MODAL TO END STREAM */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 mx-auto mb-3 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Kết thúc buổi phát trực tiếp?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Mọi khán giả đang xem sẽ nhận được thông báo buổi Live kết thúc.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Tiếp tục Live
              </button>
              <button
                type="button"
                onClick={handleConfirmEndStream}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition"
              >
                Kết thúc ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamBroadcast;
