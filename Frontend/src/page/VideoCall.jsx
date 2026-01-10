// src/page/VideoCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { Phone, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { dummyConnectionsData } from "../assets/assets";

const VideoCall = () => {
  const { userId } = useParams();            // receiver userId (the person we want to call)
  const navigate = useNavigate();
  const meId = "me"; // replace with your auth user id in real app
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const [callingState, setCallingState] = useState("idle"); // idle | calling | ringing | in-call
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const timerRef = useRef(null);
  const user = dummyConnectionsData.find(u => u._id === userId);

  useEffect(() => {
    // register our "me" id on socket
    socket.emit("register", meId);

    // handle incoming answer
    socket.on("call-answered", async (data) => {
      // data: { fromUserId, answer }
      if (!peerRef.current || !data.answer) return;

      const state = peerRef.current.signalingState;
      if (state === 'have-local-offer') {
        try {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallingState("in-call");
          startTimer();
        } catch (error) {
          console.error("Set remote description error:", error.message);
        }
      } else {
        console.warn("Cannot set remote description, current state:", state);
      }
    });

    // incoming call (if someone calls us while on this page)
    socket.on("incoming-call", async (data) => {
      // if someone calls us, show ringing and auto-accept for demo OR implement UI
      // data: { fromUserId, offer }
      console.log("incoming-call", data);
      // here we can auto-answer (or present 'accept' button). We'll auto-answer for demo.
      await acceptIncomingCall(data.fromUserId, data.offer);
    });

    // ice candidates from remote
    socket.on("ice-candidate", async (data) => {
      if (data.candidate && peerRef.current) {
        const state = peerRef.current.signalingState;
        if (state !== 'closed') {
          try {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.warn("addIceCandidate error:", e.message);
          }
        }
      }
    });

    return () => {
      socket.off("call-answered");
      socket.off("incoming-call");
      socket.off("ice-candidate");
      cleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    setCallTime(0);
    timerRef.current = setInterval(() => setCallTime(t => t + 1), 1000);
  }
  const stopTimer = () => {
    clearInterval(timerRef.current);
  }

  const cleanup = () => {
    stopTimer();
    if (peerRef.current) {
      try { peerRef.current.close() } catch {}
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks?.().forEach(t => t.stop?.());
      remoteStreamRef.current = null;
    }
    setCallingState("idle");
  }

  const createPeerConnection = (toUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { toUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      // attach remote stream to an element
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      const remoteVideo = document.getElementById("remoteVideo");
      if (remoteVideo) remoteVideo.srcObject = remoteStream;
    };

    return pc;
  };

  const callUser = async () => {
    setCallingState("calling");
    try {
      // get local camera+mic
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = localStream;
      const localVideo = document.getElementById("localVideo");
      if (localVideo) localVideo.srcObject = localStream;

      const pc = createPeerConnection(userId);
      peerRef.current = pc;

      // add tracks
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // send offer to callee
      socket.emit("call-user", {
        toUserId: userId,
        fromUserId: meId,
        offer
      });

      setCallingState("ringing");
    } catch (e) {
      console.error("callUser error", e);
      cleanup();
    }
  };

  const acceptIncomingCall = async (fromUserId, offer) => {
    setCallingState("in-call");
    try {
      // get local media
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = localStream;
      const localVideo = document.getElementById("localVideo");
      if (localVideo) localVideo.srcObject = localStream;

      const pc = createPeerConnection(fromUserId);
      peerRef.current = pc;

      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // send answer back
      socket.emit("answer-call", {
        toUserId: fromUserId,
        fromUserId: meId,
        answer
      });

      startTimer();
    } catch (e) {
      console.error("acceptIncomingCall error", e);
      cleanup();
    }
  };

  const endCall = () => {
    socket.emit("hangup", { toUserId: userId }); // optional, server doesn't handle but could
    cleanup();
    navigate(-1);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
    setMuted(prev => !prev);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !t.enabled);
    setCameraOff(prev => !prev);
  };

  return (
    <div className="h-screen w-full bg-black text-white relative">
      <video id="remoteVideo" autoPlay playsInline className="w-full h-full object-cover" />
      <video id="localVideo" autoPlay muted playsInline className="w-40 h-28 rounded-lg border-2 border-white absolute bottom-6 right-6 object-cover" />
      <div className="absolute top-4 left-4 flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur">
        <img src={user?.profile_picture} className="w-10 h-10 rounded-full" alt="" />
        <div>
          <p className="font-medium">{user?.full_name}</p>
          <p className="text-xs text-gray-300">{callingState === "in-call" ? "Connected" : callingState === "ringing" ? "Ringing..." : "Calling..."}</p>
        </div>
      </div>

      <div className="absolute bottom-8 w-full flex items-center justify-center gap-6">
        {callingState === "idle" && (
          <button onClick={callUser} className="p-4 bg-green-600 rounded-full">
            <Video size={24} />
          </button>
        )}

        <button onClick={toggleCamera} className="p-4 bg-white/20 rounded-full">
          {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button onClick={toggleMute} className="p-4 bg-white/20 rounded-full">
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button onClick={endCall} className="p-4 bg-red-600 rounded-full text-white">
          <Phone size={20} />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
