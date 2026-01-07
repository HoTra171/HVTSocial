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
} from "lucide-react";
import dayjs from "dayjs";
import axios from "axios";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import toast from "react-hot-toast";
import { API_URL, SERVER_ORIGIN } from '../constants/api';

dayjs.extend(relativeTime);
dayjs.locale("vi");


const StoryViewer = ({ viewStory, setViewStory, allStories }) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const API_BASE = SERVER_ORIGIN;
  const toUrl = (path) => (path?.startsWith("http") ? path : `${API_BASE}${path}`);
  const elapsedRef = useRef(0);

  const currentUserIndex = allStories?.findIndex(
    (group) => group.user.id === viewStory?.user?.id
  ) ?? 0;

  const currentStoryIndex = viewStory?.currentIndex ?? 0;
  const stories = viewStory?.stories ?? [];
  const currentStory = stories[currentStoryIndex];
  const user = viewStory?.user;

  const me = JSON.parse(localStorage.getItem("user") || "{}");
  const isMyStory = Number(me?.id) === Number(user?.id);
  //  MARK AS VIEWED
  useEffect(() => {
    if (!currentStory?.id) return;

    const markAsViewed = async () => {
      try {
        await axios.post(
          `${API_BASE}/api/stories/${currentStory.id}/view`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } catch (err) {
        console.error("Mark viewed error:", err);
      }
    };

    markAsViewed();
  }, [currentStory?.id]);

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
      if (allStories && currentUserIndex < allStories.length - 1) {
        const nextUserStories = allStories[currentUserIndex + 1];
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
    } else if (allStories && currentUserIndex > 0) {
      //  PREV USER
      const prevUserStories = allStories[currentUserIndex - 1];
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
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
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
            src={toUrl(user?.avatar)}
            alt=""
            className="w-10 h-10 rounded-full border-2 border-white"
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
      <div className="relative w-full max-w-md h-full flex items-center justify-center">
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
            alt="Story"
            className="w-full h-full object-contain"
          />
        )}

        {/* Video Story */}
        {currentStory.media_type === "video" && (
          <video
            ref={videoRef}
            src={toUrl(currentStory.media_url)}
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
    </div>
  );
};

export default StoryViewer;