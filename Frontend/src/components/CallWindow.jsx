// src/components/CallWindow.jsx
import React, { useEffect, useRef } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from "lucide-react";

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
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
      {/* Video remote */}
      {isVideoCall ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full max-w-3xl aspect-video bg-black rounded-2xl object-cover"
        />
      ) : (
        <div className="w-40 h-40 rounded-full bg-slate-700 flex items-center justify-center text-white text-3xl mb-4">
          📞
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
        {/* Mic */}
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            micOn ? "bg-white/10" : "bg-red-600"
          } text-white`}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Camera (chỉ với video call) */}
        {isVideoCall && (
          <button
            onClick={toggleCam}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              camOn ? "bg-white/10" : "bg-yellow-500"
            } text-white`}
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
