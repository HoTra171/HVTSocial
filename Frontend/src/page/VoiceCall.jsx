// src/page/VoiceCall.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { Phone, Mic, MicOff } from "lucide-react";
import { dummyConnectionsData } from "../assets/assets";

const VoiceCall = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const meId = "me"; // replace with logged-in user id
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [callingState, setCallingState] = useState("idle"); // idle|calling|ringing|in-call
  const [callTime, setCallTime] = useState(0);
  const timerRef = useRef(null);
  const user = dummyConnectionsData.find(u => u._id === userId);

  useEffect(() => {
    socket.emit("register", meId);

    socket.on("incoming-call", async (data) => {
      // auto accept for demo
      await acceptIncomingCall(data.fromUserId, data.offer);
    });

    socket.on("call-answered", async (data) => {
      if (pcRef.current && data.answer) {
        const state = pcRef.current.signalingState;
        if (state === 'have-local-offer') {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            setCallingState("in-call");
            startTimer();
          } catch (error) {
            console.error("Set remote description error:", error.message);
          }
        } else {
          console.warn("Cannot set remote description, current state:", state);
        }
      }
    });

    socket.on("ice-candidate", async (data) => {
      if (data.candidate && pcRef.current) {
        const state = pcRef.current.signalingState;
        if (state !== 'closed') {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.warn("addIceCandidate error:", e.message);
          }
        }
      }
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      cleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    setCallTime(0);
    timerRef.current = setInterval(() => setCallTime(t => t + 1), 1000);
  }

  const stopTimer = () => clearInterval(timerRef.current);

  const cleanup = () => {
    stopTimer();
    if (pcRef.current) { try { pcRef.current.close() } catch {} pcRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    setCallingState("idle");
  }

  const createPc = (toUserId) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { toUserId, candidate: e.candidate });
      }
    };

    pc.ontrack = (event) => {
      const audio = document.getElementById("remoteAudio");
      if (audio) audio.srcObject = event.streams[0];
    };

    return pc;
  };

  const callUser = async () => {
    setCallingState("calling");
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;
      const pc = createPc(userId);
      pcRef.current = pc;
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call-user", { toUserId: userId, fromUserId: meId, offer });
      setCallingState("ringing");
    } catch (e) {
      console.error(e);
      cleanup();
    }
  };

  const acceptIncomingCall = async (fromUser, offer) => {
    setCallingState("in-call");
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;
      const pc = createPc(fromUser);
      pcRef.current = pc;
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer-call", { toUserId: fromUser, fromUserId: meId, answer });
      startTimer();
    } catch (e) {
      console.error(e);
      cleanup();
    }
  };

  const endCall = () => {
    cleanup();
    navigate(-1);
  }

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
    setMuted(m => !m);
  };

  return (
    <div className="h-screen w-full bg-gray-900 text-white flex flex-col items-center justify-center">
      <img src={user?.profile_picture} alt="" className="w-32 h-32 rounded-full mb-4" />
      <p className="text-2xl font-semibold">{user?.full_name}</p>
      <p className="text-gray-400 mt-1">{callingState === "in-call" ? "Connected" : callingState === "ringing" ? "Ringing..." : "Calling..."}</p>

      <audio id="remoteAudio" autoPlay />

      <div className="flex gap-6 mt-10">
        {callingState === "idle" && <button onClick={callUser} className="p-4 bg-green-600 rounded-full"><Phone size={24} /></button>}

        <button onClick={toggleMute} className="p-4 bg-gray-700 rounded-full">
          {muted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button onClick={endCall} className="p-4 bg-red-600 rounded-full">
          <Phone size={24} />
        </button>
      </div>
    </div>
  );
};

export default VoiceCall;
