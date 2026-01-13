// src/components/CallWindow.jsx
import React, { useEffect, useRef } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Volume2, VolumeX } from "lucide-react";

const CallWindow = ({
  localStream,
  remoteStream,
  onEnd,
  micOn,
  camOn,
  toggleMic,
  toggleCam,
  isVideoCall,
}) => {
  const [needsUserInteraction, setNeedsUserInteraction] = React.useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = React.useState(true);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // 1. Local Stream Handling (Restored)
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // 2. Remote Stream Handling (Moved from bottom)
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;

      // Log tracks for debugging
      console.log("📺 Remote Stream Tracks:", remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}`));

      const playVideo = async () => {
        try {
          if (remoteVideoRef.current.paused) {
            await remoteVideoRef.current.play();
          }
          setNeedsUserInteraction(false);
        } catch (e) {
          console.error("Error playing remote video:", e);
          if (e.name === 'NotAllowedError') {
            setNeedsUserInteraction(true);
          }
        }
      };

      playVideo();
    }
  }, [remoteStream]);

  // 3. Sync mute state with speaker toggle
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isSpeakerOn;
    }
  }, [isSpeakerOn]);

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
      setIsSpeakerOn(!remoteVideoRef.current.muted);
    }
  };

  const handleManualPlay = async () => {
    if (remoteVideoRef.current) {
      try {
        await remoteVideoRef.current.play();
        setNeedsUserInteraction(false);
        // Ensure mute state matches isSpeakerOn after manual play
        remoteVideoRef.current.muted = !isSpeakerOn;
      } catch (e) {
        console.error("Manual play failed:", e);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
      {/* Video remote - Always render to ensure audio plays */}
      <div className={`relative w-full max-w-3xl aspect-video ${!isVideoCall ? 'hidden' : ''}`}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full bg-black rounded-2xl object-cover"
        />
        {needsUserInteraction && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <button
              onClick={handleManualPlay}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold animate-pulse"
            >
              Bấm để bật âm thanh
            </button>
          </div>
        )}
      </div>

      {/* Avatar placeholder for Voice Call */}
      {!isVideoCall && (
        <div className="w-40 h-40 rounded-full bg-slate-700 flex items-center justify-center text-white text-3xl mb-4 relative">
          📞
          {/* Hidden audio player for voice call if needed manually */}
          {needsUserInteraction && (
            <div className="absolute -bottom-16 w-full flex justify-center">
              <button
                onClick={handleManualPlay}
                className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm whitespace-nowrap animate-pulse"
              >
                Bật loa
              </button>
            </div>
          )}
        </div>
      )}

      {/* Video local (góc nhỏ giống Messenger) */}
      {isVideoCall && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-40 aspect-video bg-black rounded-xl object-cover fixed bottom-6 right-6 border border-white/40 shadow-lg"
        />
      )}

      {/* Thanh control */}
      <div className="flex items-center gap-6 mt-8 bg-black/40 px-6 py-4 rounded-full">
        {/* Speaker Toggle */}
        <button
          onClick={toggleSpeaker}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${isSpeakerOn ? "bg-white/10" : "bg-white/10 text-red-500"} text-white`}
          title={isSpeakerOn ? "Tắt loa ngoài" : "Bật loa ngoài"}
        >
          {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {/* Mic */}
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${micOn ? "bg-white/10" : "bg-red-600"} text-white`}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Camera (chỉ với video call) */}
        {isVideoCall && (
          <button
            onClick={toggleCam}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${camOn ? "bg-white/10" : "bg-yellow-500"} text-white`}
          >
            {camOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
          </button>
        )}

        {/* End call */}
        <button
          onClick={onEnd}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 text-white"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
};

export default CallWindow;
