// src/components/CallWindow.jsx
import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Volume2, VolumeX, Shield } from "lucide-react";

const CallWindow = ({
  localStream,
  remoteStream,
  onEnd,
  micOn,
  camOn,
  toggleMic,
  toggleCam,
  isVideoCall,
  partner,
}) => {
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // 1. Local Stream Handling
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // 2. Remote Stream Handling & Video Track Detection
  useEffect(() => {
    if (!remoteStream) {
      setHasRemoteVideo(false);
      return;
    }

    const checkVideoState = () => {
      const vTracks = remoteStream.getVideoTracks();
      const active = vTracks.length > 0 && vTracks.some((t) => t.enabled && t.readyState === "live");
      setHasRemoteVideo(active);
    };

    checkVideoState();

    remoteStream.onaddtrack = checkVideoState;
    remoteStream.onremovetrack = checkVideoState;

    remoteStream.getVideoTracks().forEach((track) => {
      track.onmute = checkVideoState;
      track.onunmute = checkVideoState;
      track.onended = checkVideoState;
    });

    if (remoteVideoRef.current) {
      const videoEl = remoteVideoRef.current;
      if (videoEl.srcObject !== remoteStream) {
        videoEl.srcObject = remoteStream;
      }

      const attemptPlay = async () => {
        try {
          if (videoEl.paused) {
            await videoEl.play();
          }
          setNeedsUserInteraction(false);
        } catch (err) {
          console.warn("Direct play failed (autoplay policy), fallback to muted play:", err);
          // Mute trước để video luôn hiển thị khung hình, tránh màn hình đen!
          videoEl.muted = true;
          try {
            await videoEl.play();
            setNeedsUserInteraction(true);
          } catch (mutedErr) {
            console.error("Muted play also failed:", mutedErr);
          }
        }
      };

      const handleCanPlay = () => attemptPlay();
      videoEl.addEventListener("loadedmetadata", handleCanPlay);
      videoEl.addEventListener("canplay", handleCanPlay);

      attemptPlay();

      return () => {
        videoEl.removeEventListener("loadedmetadata", handleCanPlay);
        videoEl.removeEventListener("canplay", handleCanPlay);
      };
    }
  }, [remoteStream]);

  // 3. Sync mute state with speaker toggle
  useEffect(() => {
    if (remoteVideoRef.current && !needsUserInteraction) {
      remoteVideoRef.current.muted = !isSpeakerOn;
    }
  }, [isSpeakerOn, needsUserInteraction]);

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      const newMuted = !remoteVideoRef.current.muted;
      remoteVideoRef.current.muted = newMuted;
      setIsSpeakerOn(!newMuted);
    }
  };

  const handleManualPlay = async () => {
    if (remoteVideoRef.current) {
      try {
        remoteVideoRef.current.muted = !isSpeakerOn;
        await remoteVideoRef.current.play();
        setNeedsUserInteraction(false);
      } catch (e) {
        console.error("Manual play failed:", e);
      }
    }
  };

  const partnerName = partner?.name || partner?.full_name || partner?.username || "Người dùng";
  const partnerAvatar = partner?.avatar || "/default.jpg";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950 text-white overflow-hidden select-none"
      onClick={() => {
        if (needsUserInteraction) handleManualPlay();
      }}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-radial from-indigo-900/30 via-slate-950 to-slate-950 -z-10" />

      {/* Top Header Bar */}
      <div className="w-full max-w-4xl pt-6 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold tracking-wide text-emerald-300">
            {formatDuration(duration)}
          </span>
          <span className="text-xs text-white/50">•</span>
          <span className="text-xs text-white/70 flex items-center gap-1">
            <Shield size={12} className="text-indigo-400" /> Mã hóa P2P
          </span>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <span className="text-sm font-medium text-white/90 truncate max-w-[160px]">
            {partnerName}
          </span>
        </div>
      </div>

      {/* Main Call Body */}
      <div className="relative w-full flex-1 flex items-center justify-center p-4">
        {/* VIDEO CALL REMOTE VIEW */}
        {isVideoCall ? (
          <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-white/10 flex items-center justify-center">
            {/* Video chính của đối phương */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                hasRemoteVideo ? "opacity-100" : "opacity-0 absolute pointer-events-none"
              }`}
            />

            {/* Màn hình chờ nếu đối phương tắt camera hoặc track video chưa tới */}
            {!hasRemoteVideo && (
              <div className="flex flex-col items-center justify-center text-center p-6 z-10">
                <div className="relative flex items-center justify-center mb-5">
                  <div className="absolute w-32 h-32 rounded-full bg-indigo-500/20 animate-ping" />
                  <div className="absolute w-40 h-40 rounded-full bg-indigo-500/10 animate-pulse" />
                  <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-indigo-500/50 shadow-2xl bg-slate-800">
                    <img
                      src={partnerAvatar}
                      alt={partnerName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/default.jpg";
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white/90 mb-1">{partnerName}</h3>
                <div className="flex items-center gap-2 text-xs text-white/60 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                  <VideoOff size={14} className="text-amber-400" />
                  <span>Đối phương đang tắt camera hoặc đang kết nối...</span>
                </div>
              </div>
            )}

            {/* Thông báo bật âm thanh nếu browser chặn autoplay */}
            {needsUserInteraction && (
              <div className="absolute top-4 left-4 z-40">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManualPlay();
                  }}
                  className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 backdrop-blur-md border border-white/20 animate-bounce"
                >
                  <Volume2 size={16} /> Bấm để bật âm thanh
                </button>
              </div>
            )}

            {/* Picture-in-Picture Local Video */}
            <div className="absolute top-4 right-4 z-40 w-36 sm:w-48 aspect-video rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/30 shadow-2xl transition-all hover:scale-105">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!camOn ? "hidden" : ""}`}
              />
              {!camOn && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white/70 text-xs gap-1">
                  <VideoOff size={18} className="text-white/40" />
                  <span>Đã tắt camera</span>
                </div>
              )}
              <div className="absolute bottom-1 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-medium text-white/90 backdrop-blur-sm">
                Bạn
              </div>
            </div>
          </div>
        ) : (
          /* VOICE CALL VIEW (Messenger / FaceTime style) */
          <div className="flex flex-col items-center justify-center text-center">
            {/* Animated Pulsing Avatar */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute w-44 h-44 rounded-full bg-indigo-500/20 animate-ping" />
              <div className="absolute w-52 h-52 rounded-full bg-indigo-500/10 animate-pulse" />
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-indigo-500/60 shadow-2xl bg-slate-800">
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/default.jpg";
                  }}
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
              {partnerName}
            </h2>
            <p className="text-sm font-medium text-indigo-300/90 mb-1">
              Đang trong cuộc gọi thoại
            </p>
            <p className="text-xs text-white/50 tracking-wider">
              {formatDuration(duration)}
            </p>

            {/* Hidden audio element for voice calls */}
            <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />

            {needsUserInteraction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleManualPlay();
                }}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 animate-bounce"
              >
                <Volume2 size={16} /> Bấm để bật loa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="pb-8 pt-4 z-20">
        <div className="flex items-center gap-4 sm:gap-6 bg-slate-900/80 backdrop-blur-xl px-6 py-3.5 rounded-full border border-white/10 shadow-2xl">
          {/* Speaker Button */}
          <button
            onClick={toggleSpeaker}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isSpeakerOn
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
            title={isSpeakerOn ? "Tắt loa ngoài" : "Bật loa ngoài"}
          >
            {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          {/* Microphone Toggle */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              micOn
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
            title={micOn ? "Tắt Mic" : "Bật Mic"}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Camera Toggle (Video Call only) */}
          {isVideoCall && (
            <button
              onClick={toggleCam}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                camOn
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
              title={camOn ? "Tắt Camera" : "Bật Camera"}
            >
              {camOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={onEnd}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
            title="Kết thúc cuộc gọi"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallWindow;
