import React, { useEffect, useState, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Pause,
  Play,
  SendHorizonal,
  Globe2,
  Users,
  UserCog,
  Eye,
} from "lucide-react";
import dayjs from "dayjs";
import axios from "axios";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import toast from "react-hot-toast";
import { API_URL, SERVER_ORIGIN } from '../constants/api';
import { useNavigate } from 'react-router-dom';

dayjs.extend(relativeTime);
dayjs.locale("vi");


const StoryViewer = ({ viewStory, setViewStory, allStories }) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const stickerPos = { x: 50, y: 50 }; // Default center position for sticker
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const API_BASE = SERVER_ORIGIN;
  const toUrl = (path) => {
    if (!path || path === 'null' || path === 'undefined') {
      return '/default-avatar.png'; // Fallback image
    }
    return path?.startsWith("http") ? path : `${API_BASE}${path}`;
  };
  const elapsedRef = useRef(0);

  const me = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserIdVal = me?.id;

  // Sort allStories in the same order as StoriesBar
  const sortedStories = [...(allStories || [])].sort((a, b) => {
    // Current user's story always first
    if (a.user.id === currentUserIdVal) return -1;
    if (b.user.id === currentUserIdVal) return 1;

    // Unseen stories before seen stories
    const aHasUnseen = a.stories.some(s => !s.is_viewed);
    const bHasUnseen = b.stories.some(s => !s.is_viewed);
    if (aHasUnseen && !bHasUnseen) return -1;
    if (!aHasUnseen && bHasUnseen) return 1;

    return 0;
  });

  const currentUserIndex = sortedStories?.findIndex(
    (group) => group.user.id === viewStory?.user?.id
  ) ?? 0;

  const currentStoryIndex = viewStory?.currentIndex ?? 0;
  const stories = viewStory?.stories ?? [];
  const currentStory = stories[currentStoryIndex];
  const user = viewStory?.user;

  const isMyStory = Number(me?.id) === Number(user?.id);
  //  MARK AS VIEWED
  //  SMART VIEW TRACKING
  const [isLoaded, setIsLoaded] = useState(false);
  const storyContainerRef = useRef(null);
  const viewTimerRef = useRef(null);
  const hasViewedRef = useRef(false);

  // Prevent body scroll when story viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // 1. Reset state khi đổi story
  useEffect(() => {
    // Text story coi như đã load xong ngay lập tức
    setIsLoaded(currentStory?.media_type === "text");
    hasViewedRef.current = false;
    if (viewTimerRef.current) {
      clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }

    // Fetch viewer count if it's my story
    if (isMyStory && currentStory?.id) {
      fetchViewers();
    }
  }, [currentStory?.id, currentStory?.media_type, isMyStory]);

  // 2. Logic tracking: Loaded + 80% Visible + 1.5s duration
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!currentStory?.id || hasViewedRef.current || !isLoaded || !token) return;

    const container = storyContainerRef.current;
    if (!container) return;

    const triggerView = async () => {
      if (hasViewedRef.current) return;
      hasViewedRef.current = true; // Optimistic update

      try {
        await axios.post(
          `${API_BASE}/api/stories/${currentStory.id}/view`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Mark viewed error:", err);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // Đủ điều kiện hiển thị > 80% -> Bắt đầu đếm 1.5s
          if (!viewTimerRef.current && !hasViewedRef.current) {
            viewTimerRef.current = setTimeout(triggerView, 1500);
          }
        } else {
          // Mất hiển thị -> Hủy đếm
          if (viewTimerRef.current) {
            clearTimeout(viewTimerRef.current);
            viewTimerRef.current = null;
          }
        }
      },
      { threshold: 0.8 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
    };
  }, [currentStory?.id, isLoaded]);

  //  NEXT STORY (trong cùng user hoặc next user)
  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      // Next story của cùng user
      setViewStory({
        ...viewStory,
        currentIndex: currentStoryIndex + 1,
      });
    } else {
      //  HẾT STORIES CỦA USER NÀY → NEXT USER
      if (sortedStories && currentUserIndex < sortedStories.length - 1) {
        const nextUserStories = sortedStories[currentUserIndex + 1];
        setViewStory({
          user: nextUserStories.user,
          stories: nextUserStories.stories,
          currentIndex: 0,
        });
      } else {
        // Hết tất cả stories
        setViewStory(null);
      }
    }
  };

  //  PREV STORY
  const prevStory = () => {
    if (currentStoryIndex > 0) {
      // Prev story của cùng user
      setViewStory({
        ...viewStory,
        currentIndex: currentStoryIndex - 1,
      });
    } else if (sortedStories && currentUserIndex > 0) {
      //  PREV USER
      const prevUserStories = sortedStories[currentUserIndex - 1];
      setViewStory({
        user: prevUserStories.user,
        stories: prevUserStories.stories,
        currentIndex: prevUserStories.stories.length - 1, // Last story của user đó
      });
    }
  };

  //  TOGGLE PAUSE
  const togglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;

      if (currentStory?.media_type === "video" && videoRef.current) {
        if (next) videoRef.current.pause();
        else videoRef.current.play().catch(() => { });
      }

      if (currentStory?.music_url && audioRef.current) {
        if (next) audioRef.current.pause();
        else audioRef.current.play().catch(() => { });
      }

      return next;
    });
  };

  const resumeStory = () => {
    setIsPaused(false);

    if (videoRef.current && currentStory?.media_type === "video") {
      videoRef.current.play().catch(() => { });
    }
    if (audioRef.current && currentStory?.music_url) {
      audioRef.current.play().catch(() => { });
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;

      if (videoRef.current) videoRef.current.muted = next;
      if (audioRef.current) audioRef.current.muted = next;

      return next;
    });
  };


  //  AUTO PLAY + PROGRESS BAR
  useEffect(() => {
    if (!currentStory) return;

    elapsedRef.current = 0;
    setProgress(0);
    setIsPaused(false);

    if (audioRef.current) {
      audioRef.current.pause();
      if (currentStory.music_url) {
        audioRef.current.src = toUrl(currentStory.music_url);
        audioRef.current.currentTime = 0;
        audioRef.current.muted = isMuted;
        audioRef.current.play().catch(() => { });
      }
    }

    if (videoRef.current) {
      videoRef.current.pause();
      if (currentStory.media_type === "video") {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = isMuted;
        videoRef.current.play().catch(() => { });
      }
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (videoRef.current) videoRef.current.pause();
    };
  }, [currentStory?.id]);


  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (!currentStory) return;

    if (currentStory.media_type === "video" && videoRef.current) {
      const video = videoRef.current;

      const onTimeUpdate = () => {
        if (!video.duration) return;
        const percent = (video.currentTime / video.duration) * 100;
        setProgress(percent);
      };


      video.addEventListener("timeupdate", onTimeUpdate);
      return () => video.removeEventListener("timeupdate", onTimeUpdate);
    }

    const total = 5000;
    const step = 50;

    progressIntervalRef.current = setInterval(() => {
      if (isPaused) return;

      elapsedRef.current += step;
      const percent = (elapsedRef.current / total) * 100;
      setProgress(percent);

      if (percent >= 100) {
        clearInterval(progressIntervalRef.current);
        nextStory();
      }
    }, step);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentStory?.id, isPaused]);


  // SEND REPLY
  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      const token = localStorage.getItem("token");

      // 1) get or create dm
      const dmRes = await axios.post(
        `${API_URL}/chat/dm`,
        { receiverId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatId = dmRes.data.chatId;

      // 2) send message
      await axios.post(
        `${API_URL}/chat/send`,
        {
          chatId,
          content: replyText,
          message_type: "text",
          media_url: JSON.stringify({
            storyId: currentStory?.id,
            storyOwnerName: user?.full_name,
          }),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Đã gửi tin nhắn");
      setReplyText("");
    } catch (err) {
      console.error("Send reply error:", err);
    }
  };

  // FETCH STORY VIEWERS
  const fetchViewers = async () => {
    if (!currentStory?.id || !isMyStory) return;

    setLoadingViewers(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/stories/${currentStory.id}/viewers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setViewers(res.data.viewers || []);
      }
    } catch (err) {
      console.error("Fetch viewers error:", err);
      toast.error("Không thể tải danh sách người xem");
    } finally {
      setLoadingViewers(false);
    }
  };

  // SHOW VIEWERS MODAL
  const handleShowViewers = () => {
    setShowViewers(true);
    fetchViewers();
  };

  // GO TO VIEWER PROFILE
  const goToProfile = (userId) => {
    setViewStory(null); // Close story viewer
    navigate(`/profile/${userId}`);
  };


  if (!user?.id || !currentStory?.id) return;


  const privacyRaw = (currentStory?.privacy || "public").toLowerCase();

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case "public":
        return <Globe2 className="w-4 h-4 text-white/90" />;
      case "friends":
        return <Users className="w-4 h-4 text-white/90" />;
      case "custom":
        return <UserCog className="w-4 h-4 text-white/90" />;
      default:
        return <Globe2 className="w-4 h-4 text-white/90" />;
    }
  };


  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-0 right-0 flex gap-1 px-4 z-20">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width:
                  idx < currentStoryIndex
                    ? "100%"
                    : idx === currentStoryIndex
                      ? `${progress}%`
                      : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar || user?.profile_picture || '/default.jpg'}
            alt=""
            className="w-10 h-10 rounded-full border-2 border-white object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold">{user?.full_name}</p>

              <span className="p-1 rounded-full bg-white/15 border border-white/20">
                {getPrivacyIcon(privacyRaw)}
              </span>
            </div>
            <p className="text-white/70 text-xs">
              {dayjs(currentStory.created_at).fromNow()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause/Play */}
          <button
            onClick={togglePause}
            className="text-white p-2 hover:bg-white/20 rounded-full"
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>

          {/* Mute/Unmute (if video or music) */}
          {(currentStory.media_type === 'video' || currentStory.music_url) && (
            <button
              onClick={toggleMute}
              className="text-white p-2 hover:bg-white/20 rounded-full"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          )}

          {/* Close */}
          <button
            onClick={() => setViewStory(null)}
            className="text-white p-2 hover:bg-white/20 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div
        ref={storyContainerRef}
        className="relative w-full max-w-md h-full flex items-center justify-center"
      >
        {/* Text Story */}
        {currentStory.media_type === "text" && (
          <div
            className="w-full h-full flex items-center justify-center p-10"
            style={{ backgroundColor: currentStory.background_color || '#6366f1' }}
          >
            <div
              className={`${currentStory.show_frame ? 'bg-black/30 p-6 rounded-lg' : ''}`}
              style={{
                color: currentStory.text_color || '#FFFFFF',
                fontSize: `${currentStory.font_size || 24}px`,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              {currentStory.caption}
            </div>
          </div>
        )}

        {/* Image Story */}
        {currentStory.media_type === "image" && (
          <img
            src={toUrl(currentStory.media_url)}
            onLoad={() => setIsLoaded(true)}
            alt="Story"
            className="w-full h-full object-contain"
          />
        )}

        {/* Video Story */}
        {currentStory.media_type === "video" && (
          <video
            ref={videoRef}
            src={toUrl(currentStory.media_url)}
            onLoadedData={() => setIsLoaded(true)}
            className="w-full h-full object-contain"
            playsInline
            onEnded={nextStory}
          />
        )}

        {/*  STICKER OVERLAY */}
        {currentStory.sticker && (
          <div
            className="absolute text-5xl pointer-events-none"
            style={{
              left: `${stickerPos.x}%`,
              top: `${stickerPos.y}%`,
              transform: 'translate(-50%, -50%)',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {currentStory.sticker}
          </div>
        )}

        {/* Navigation Areas */}
        <button
          onClick={prevStory}
          className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-start p-4 hover:bg-gradient-to-r hover:from-black/20"
        >
          {currentStoryIndex > 0 || currentUserIndex > 0 ? (
            <ChevronLeft className="text-white" size={32} />
          ) : null}
        </button>

        <button
          onClick={nextStory}
          className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end p-4 hover:bg-gradient-to-l hover:from-black/20"
        >
          <ChevronRight className="text-white" size={32} />
        </button>
      </div>

      {/* Music audio element (hidden) */}
      {currentStory.music_url && (
        <audio ref={audioRef} loop />
      )}

      {/* Reply Input */}
      {!isMyStory && (
        <div className="absolute bottom-4 left-0 right-0 px-4 z-20">
          <div className="max-w-md mx-auto flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onFocus={togglePause}
              onBlur={resumeStory}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              placeholder={`Trả lời ${user?.full_name}...`}
              className="flex-1 px-4 py-2 rounded-full border-2 border-white/50 bg-black/30 text-white placeholder-white/70 focus:outline-none focus:border-white"
            />
            <button
              onClick={handleSendReply}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full"
            >
              <SendHorizonal className="text-white" size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Viewers button (bottom-left, only for my story) */}
      {isMyStory && (
        <div className="absolute bottom-4 left-4 z-20">
          <button
            onClick={handleShowViewers}
            className="text-white p-2 hover:bg-white/20 rounded-full flex items-center gap-2 bg-black/30 backdrop-blur-sm"
          >
            <Eye size={20} />
            <span className="text-sm font-medium">{viewers.length || 0}</span>
          </button>
        </div>
      )}

      {/* Viewers Modal */}
      {showViewers && isMyStory && (
        <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowViewers(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[70vh] sm:max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Người xem ({viewers.length})
              </h3>
              <button
                onClick={() => setShowViewers(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Viewers List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingViewers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : viewers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Eye size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Chưa có ai xem story này</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {viewers.map((viewer) => (
                    <div
                      key={viewer.viewer_id}
                      onClick={() => goToProfile(viewer.viewer_id)}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
                    >
                      <img
                        src={toUrl(viewer.avatar)}
                        alt={viewer.full_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {viewer.full_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          @{viewer.username}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {dayjs(viewer.viewed_at).fromNow()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;