import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Radio,
  Eye,
  MessageSquare,
  Send,
  X,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Clock,
  Heart,
  Flame,
  Laugh,
  PartyPopper,
  ThumbsUp,
  Share2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, useSocket } from '../contexts';
import { liveStreamApi } from '../api/liveStreamApi';
import { playNotificationSound, initAudio } from '../utils/notificationSound';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
};

const REACTION_EMOJIS = ['❤️', '🔥', '👏', '😂', '🎉'];

const LiveStreamView = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { socket } = useSocket();

  const [streamInfo, setStreamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [isStreamEnded, setIsStreamEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(false);

  // Chat & Reactions
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [reactions, setReactions] = useState([]);

  // Media & WebRTC Refs
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const retryCountRef = useRef(0);
  const commentsEndRef = useRef(null);
  const containerRef = useRef(null);

  // 1. Tải thông tin phòng Live
  useEffect(() => {
    let isMounted = true;

    const loadStream = async () => {
      try {
        const res = await liveStreamApi.getById(streamId);
        if (isMounted) {
          setStreamInfo(res.data);
          setViewerCount(res.data?.viewer_count || 0);

          if (res.data?.status === 'ended') {
            setIsStreamEnded(true);
          }
        }

        // Tải lịch sử bình luận
        const commentsRes = await liveStreamApi.getComments(streamId);
        if (isMounted && commentsRes.data) {
          setComments(commentsRes.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải stream:', err);
        toast.error('Không tìm thấy buổi phát trực tiếp');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStream();

    return () => {
      isMounted = false;
      cleanupWebRTC();
    };
  }, [streamId]);

  const cleanupWebRTC = () => {
    if (peerRef.current) {
      try {
        peerRef.current.close();
      } catch {}
      peerRef.current = null;
    }
  };

  // 2. WebRTC Viewer Connection & Socket Listeners
  useEffect(() => {
    if (!socket || isStreamEnded) return;

    // Khi nhận được WebRTC Offer từ Host
    const handleOffer = async ({ fromHostSocketId, offer }) => {
      console.log(`[Viewer] Received WebRTC offer from host ${fromHostSocketId}`);
      cleanupWebRTC();
      pendingCandidatesRef.current = [];

      try {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerRef.current = pc;

        // Giám sát trạng thái kết nối WebRTC
        pc.onconnectionstatechange = () => {
          console.log('[Viewer] WebRTC connection state:', pc.connectionState);
          if (pc.connectionState === 'connected') {
            console.log('[Viewer] WebRTC connected successfully!');
          } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            console.warn('[Viewer] WebRTC disconnected, requesting stream refresh...');
            setIsVideoPlaying(false);
          }
        };

        // Nhận track media từ host
        pc.ontrack = (event) => {
          console.log('[Viewer] Received host media stream track:', event.track.kind);
          if (remoteVideoRef.current) {
            let stream = (event.streams && event.streams[0]) ? event.streams[0] : null;
            if (!stream) {
              if (!remoteVideoRef.current.srcObject) {
                stream = new MediaStream();
                remoteVideoRef.current.srcObject = stream;
              } else {
                stream = remoteVideoRef.current.srcObject;
              }
              stream.addTrack(event.track);
            } else {
              remoteVideoRef.current.srcObject = stream;
            }

            // Gọi play() và xử lý chính sách Autoplay của trình duyệt
            const playPromise = remoteVideoRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('[Viewer] Video playback started with sound');
                  setIsVideoPlaying(true);
                  setShowUnmutePrompt(false);
                })
                .catch((err) => {
                  console.warn('[Viewer] Autoplay with sound blocked. Muting to display video:', err);
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.muted = true;
                    setIsMuted(true);
                    setShowUnmutePrompt(true);
                    remoteVideoRef.current.play()
                      .then(() => setIsVideoPlaying(true))
                      .catch((e) => console.error('[Viewer] Muted play failed:', e));
                  }
                });
            }
          }
        };

        // ICE candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('livestream_ice_candidate', {
              targetSocketId: fromHostSocketId,
              candidate: event.candidate,
            });
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Thêm các ICE candidate đã đến sớm trước khi remoteDescription hoàn tất
        while (pendingCandidatesRef.current.length > 0) {
          const cand = pendingCandidatesRef.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn('[Viewer] Error adding queued ICE candidate:', e);
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Gửi answer về cho host
        socket.emit('livestream_answer', {
          streamId,
          toHostSocketId: fromHostSocketId,
          answer,
        });
      } catch (err) {
        console.error('[Viewer] Error handling offer:', err);
      }
    };

    // Khi nhận ICE candidate từ Host
    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const pc = peerRef.current;
      if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
        console.log('[Viewer] Queueing early ICE candidate from host');
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[Viewer] Add ICE candidate error:', err);
      }
    };

    // Khi cập nhật số người xem
    const handleViewerCount = ({ count }) => {
      setViewerCount(count);
    };

    // Khi nhận bình luận mới
    const handleNewComment = (comment) => {
      setComments((prev) => [...prev.slice(-40), comment]);
      // Phát tiếng chuông thông báo khi có tin nhắn mới trên live
      if (comment.user?.id !== currentUser?.id) {
        playNotificationSound();
      }
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    };

    // Khi nhận cảm xúc / tim bay lên
    const handleNewReaction = ({ id, emoji }) => {
      setReactions((prev) => [...prev, { id, emoji, left: Math.random() * 80 + 10 }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2500);
    };

    // Khi buổi live kết thúc
    const handleStreamEnded = () => {
      setIsStreamEnded(true);
      cleanupWebRTC();
      setIsVideoPlaying(false);
      toast('Buổi phát trực tiếp đã kết thúc', { icon: 'ℹ️' });
    };

    socket.on('livestream_offer', handleOffer);
    socket.on('livestream_ice_candidate', handleIceCandidate);
    socket.on('livestream_viewer_count', handleViewerCount);
    socket.on('livestream_new_comment', handleNewComment);
    socket.on('livestream_new_reaction', handleNewReaction);
    socket.on('livestream_ended', handleStreamEnded);

    // Báo server tham gia phòng xem
    socket.emit('viewer_join_livestream', {
      streamId,
      user: currentUser,
    });

    // Định kỳ kiểm tra nếu sau 3s chưa nhận được video thì tự động gửi yêu cầu kết nối lại tới Host
    const checkStreamTimer = setInterval(() => {
      const video = remoteVideoRef.current;
      const hasTracks = video?.srcObject && video.srcObject.getTracks().length > 0;
      if (!hasTracks && retryCountRef.current < 4 && !isStreamEnded) {
        retryCountRef.current += 1;
        console.log(`[Viewer] Requesting stream refresh (${retryCountRef.current}/4)...`);
        socket.emit('viewer_request_stream', { streamId, user: currentUser });
      }
    }, 2800);

    return () => {
      clearInterval(checkStreamTimer);
      socket.emit('viewer_leave_livestream', { streamId });
      socket.off('livestream_offer', handleOffer);
      socket.off('livestream_ice_candidate', handleIceCandidate);
      socket.off('livestream_viewer_count', handleViewerCount);
      socket.off('livestream_new_comment', handleNewComment);
      socket.off('livestream_new_reaction', handleNewReaction);
      socket.off('livestream_ended', handleStreamEnded);
    };
  }, [socket, streamId, isStreamEnded]);

  // Gửi bình luận
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

  // Thả cảm xúc
  const handleSendReaction = (emoji) => {
    if (!socket) return;
    socket.emit('livestream_send_reaction', {
      streamId,
      emoji,
      user: currentUser,
    });
  };

  // Toggle Mute
  const toggleMute = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
      setIsMuted(remoteVideoRef.current.muted);
    }
  };

  // Toggle Toàn màn hình
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-sm text-slate-400">Đang tham gia phòng phát trực tiếp...</p>
        </div>
      </div>
    );
  }

  const host = streamInfo?.user || {};

  return (
    <div
      ref={containerRef}
      onClick={() => {
        initAudio();
        if (showUnmutePrompt && remoteVideoRef.current) {
          remoteVideoRef.current.muted = false;
          setIsMuted(false);
          setShowUnmutePrompt(false);
        }
      }}
      className="fixed inset-0 bg-slate-950 text-white flex flex-col z-50 select-none overflow-hidden"
    >
      {/* 1. TOP OVERLAY HEADER */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-5 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Host Info & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white transition cursor-pointer"
            title="Thoát"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            onClick={() => host?.id && navigate(`/profile/${host.id}`)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative">
              <img
                src={host.avatar || '/default.jpg'}
                alt={host.full_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-red-500 ring-2 ring-red-500/30"
                onError={(e) => {
                  e.currentTarget.src = '/default.jpg';
                }}
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-600 border-2 border-black rounded-full" />
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-sm text-white group-hover:text-red-400 transition truncate max-w-[150px] sm:max-w-xs leading-tight">
                {host.full_name || 'Người dùng'}
              </h2>
              <p className="text-xs text-slate-300 truncate max-w-[150px] sm:max-w-xs">
                {streamInfo?.title || 'Phát trực tiếp'}
              </p>
            </div>
          </div>
        </div>

        {/* Live Pill & Viewers Counter */}
        <div className="flex items-center gap-2">
          {!isStreamEnded && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 tracking-wider animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>TRỰC TIẾP</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-semibold">
            <Eye className="w-3.5 h-3.5 text-slate-300" />
            <span>{viewerCount}</span>
          </div>

          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white transition cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white transition cursor-pointer"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. MAIN VIDEO DISPLAY */}
      <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          onLoadedMetadata={() => {
            console.log('[Viewer] Video metadata loaded');
            remoteVideoRef.current?.play().catch(() => {});
          }}
          onPlaying={() => {
            console.log('[Viewer] Video stream is actively playing');
            setIsVideoPlaying(true);
          }}
          className="w-full h-full object-cover"
        />

        {/* CONNECTING / BUFFERING OVERLAY - KHÔNG ĐỂ MÀN HÌNH BỊ TỐI THUI */}
        {!isVideoPlaying && !isStreamEnded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm z-10 p-6 text-center animate-in fade-in">
            <div className="relative mb-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 animate-spin">
                <div className="w-full h-full bg-slate-950 rounded-full" />
              </div>
              <img
                src={host.avatar || '/default.jpg'}
                alt=""
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover absolute inset-0 m-auto ring-4 ring-black"
                onError={(e) => { e.currentTarget.src = '/default.jpg'; }}
              />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
              Đang kết nối luồng phát của {host.full_name || 'Host'}...
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">
              Vui lòng đợi giây lát, hình ảnh và âm thanh trực tiếp đang được đồng bộ qua WebRTC
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (socket) {
                  socket.emit('viewer_request_stream', { streamId, user: currentUser });
                  toast('Đang gửi lại yêu cầu kết nối video tới Host...', { icon: '🔄' });
                }
              }}
              className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold backdrop-blur-md transition flex items-center gap-2 cursor-pointer border border-white/10"
            >
              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              <span>Làm mới kết nối video</span>
            </button>
          </div>
        )}

        {/* UNMUTE FLOATING PROMPT KHI TRÌNH DUYỆT CHẶN TIẾNG AUTOPLAY */}
        {showUnmutePrompt && isVideoPlaying && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (remoteVideoRef.current) {
                remoteVideoRef.current.muted = false;
                setIsMuted(false);
                setShowUnmutePrompt(false);
              }
            }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xl backdrop-blur-md transition-all flex items-center gap-2 animate-bounce cursor-pointer border border-white/20"
          >
            <VolumeX className="w-4 h-4" />
            <span>Chạm để bật âm thanh live</span>
          </button>
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
        <div className="absolute bottom-20 left-3 sm:left-6 max-w-sm sm:max-w-md w-full max-h-[300px] overflow-y-auto no-scrollbar pointer-events-auto z-20 space-y-2 flex flex-col justify-end">
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

        {/* STREAM ENDED OVERLAY */}
        {isStreamEnded && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
              <Radio className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
              Buổi phát trực tiếp đã kết thúc
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
              Cảm ơn bạn đã tham gia và theo dõi buổi phát sóng của{' '}
              <span className="font-semibold text-slate-200">{host.full_name}</span>.
            </p>
            <button
              type="button"
              onClick={() => navigate('/feed')}
              className="px-6 py-2.5 rounded-2xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-slate-200 active:scale-95 transition shadow-lg"
            >
              Quay lại Bảng tin
            </button>
          </div>
        )}
      </div>

      {/* 3. BOTTOM CHAT & REACTION BAR */}
      {!isStreamEnded && (
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20 flex items-center justify-between gap-3">
          {/* Comment Form */}
          <form onSubmit={handleSendComment} className="flex-1 max-w-md flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Bình luận trong buổi trực tiếp..."
              className="flex-1 px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition"
              maxLength={150}
            />
            <button
              type="submit"
              className="p-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition cursor-pointer"
              title="Gửi"
            >
              <Send size={15} />
            </button>
          </form>

          {/* Quick Reaction Emojis Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendReaction(emoji)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 backdrop-blur-md hover:bg-white/25 active:scale-125 transition-transform flex items-center justify-center text-lg sm:text-xl cursor-pointer"
                title={`Thả ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamView;
