/**
 * Call Ringtone Utility
 * - Incoming Call Ringtone: Nhạc chuông cuộc gọi đến du dương, ngân vang.
 * - Outgoing Call Ringtone: Tiếng chuông gọi đi (tút... tút...) chuẩn viễn thông.
 * - Call End Tone: Tiếng bíp dứt khoát khi ngắt cuộc gọi.
 * Hoạt động mượt mà trên cả Web Desktop và Mobile (iOS / Android) với Web Audio API.
 */

let audioContext = null;
let incomingRingtoneNodes = [];
let outgoingRingtoneNodes = [];
let incomingRingtoneInterval = null;
let outgoingRingtoneInterval = null;
let isIncomingRingtonePlaying = false;
let isOutgoingRingtonePlaying = false;
let isAudioUnlocked = false;

/**
 * Khởi tạo AudioContext
 */
const initAudioContext = () => {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
};

/**
 * Kiểm tra thiết bị iOS
 */
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Mở khóa Audio cho Web & iOS (chạy khi người dùng tương tác lần đầu)
 */
export const unlockCallRingtone = () => {
  if (isAudioUnlocked) return;
  try {
    const ctx = initAudioContext();
    const silentBuffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = silentBuffer;
    source.connect(ctx.destination);
    source.start(0);
    isAudioUnlocked = true;
    console.log("🔊 Call ringtone audio unlocked");
  } catch (error) {
    console.warn("Failed to unlock audio:", error);
  }
};

/**
 * Tạo một chu kỳ chuông gọi đến (Melodic Chime Pattern kiểu Marimba / iPhone)
 */
const playIncomingPatternCycle = () => {
  const ctx = initAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  const vol = isIOS() ? 0.65 : 0.5;

  // Chuỗi nốt nhạc vui tươi: E5 (659Hz), G#5 (830Hz), B5 (987Hz), E6 (1318Hz)
  const notes = [
    { freq: 659.25, time: 0.00, dur: 0.18 },
    { freq: 830.61, time: 0.14, dur: 0.18 },
    { freq: 987.77, time: 0.28, dur: 0.18 },
    { freq: 1318.51, time: 0.42, dur: 0.40 },

    // Lặp lại đoạn 2 cao hơn chút
    { freq: 659.25, time: 0.90, dur: 0.18 },
    { freq: 830.61, time: 1.04, dur: 0.18 },
    { freq: 1318.51, time: 1.18, dur: 0.18 },
    { freq: 1661.22, time: 1.32, dur: 0.45 },
  ];

  notes.forEach(({ freq, time, dur }) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.linearRampToValueAtTime(vol, now + time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);

      incomingRingtoneNodes.push(osc);
    } catch (e) {
      // Bỏ qua nếu context bị gián đoạn
    }
  });
};

/**
 * Phát chuông cuộc gọi đến (Lặp lại cho đến khi nhận hoặc từ chối)
 */
export const playCallRingtone = (callType = 'video') => {
  try {
    stopCallRingtone();
    stopOutgoingCallRingtone();

    const ctx = initAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    isIncomingRingtonePlaying = true;

    // Phát chu kỳ đầu tiên ngay lập tức
    playIncomingPatternCycle();

    // Lặp lại chu kỳ chuông mỗi 2.2 giây
    incomingRingtoneInterval = setInterval(() => {
      if (!isIncomingRingtonePlaying) {
        clearInterval(incomingRingtoneInterval);
        return;
      }
      playIncomingPatternCycle();
    }, 2200);

    // Rung điện thoại nếu có hỗ trợ
    if (navigator.vibrate) {
      const vibratePattern = [400, 200, 400, 1200];
      navigator.vibrate(vibratePattern);
    }

    console.log(`📞 Incoming ${callType} call ringtone started`);
  } catch (error) {
    console.error("Play incoming ringtone error:", error);
  }
};

/**
 * Dừng chuông cuộc gọi đến
 */
export const stopCallRingtone = () => {
  try {
    isIncomingRingtonePlaying = false;

    if (incomingRingtoneInterval) {
      clearInterval(incomingRingtoneInterval);
      incomingRingtoneInterval = null;
    }

    incomingRingtoneNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    });
    incomingRingtoneNodes = [];

    if (navigator.vibrate) {
      navigator.vibrate(0);
    }

    console.log("🔇 Incoming call ringtone stopped");
  } catch (error) {
    console.error("Stop incoming ringtone error:", error);
  }
};

/**
 * Tạo một nhịp chuông gọi đi (tiếng tút... kéo dài 1.2s)
 */
const playOutgoingPatternCycle = () => {
  const ctx = initAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  const vol = isIOS() ? 0.35 : 0.25;

  try {
    // Chuẩn âm báo gọi đi: 440Hz + 480Hz
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(440, now);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(480, now);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(vol, now + 0.05);
    gainNode.gain.setValueAtTime(vol, now + 1.15);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);

    outgoingRingtoneNodes.push(osc1, osc2);
  } catch (e) {
    // Context có thể tạm dừng
  }
};

/**
 * Phát tiếng chuông gọi đi (tút... tút...) khi đang chờ đối phương bắt máy
 */
export const playOutgoingCallRingtone = () => {
  try {
    stopOutgoingCallRingtone();
    stopCallRingtone();

    const ctx = initAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    isOutgoingRingtonePlaying = true;

    // Phát tiếng tút đầu tiên
    playOutgoingPatternCycle();

    // Lặp lại chu kỳ mỗi 3.2 giây (1.2s kêu + 2.0s im lặng)
    outgoingRingtoneInterval = setInterval(() => {
      if (!isOutgoingRingtonePlaying) {
        clearInterval(outgoingRingtoneInterval);
        return;
      }
      playOutgoingPatternCycle();
    }, 3200);

    console.log("📞 Outgoing call ringtone started (tut... tut...)");
  } catch (error) {
    console.error("Play outgoing call ringtone error:", error);
  }
};

/**
 * Dừng tiếng chuông gọi đi
 */
export const stopOutgoingCallRingtone = () => {
  try {
    isOutgoingRingtonePlaying = false;

    if (outgoingRingtoneInterval) {
      clearInterval(outgoingRingtoneInterval);
      outgoingRingtoneInterval = null;
    }

    outgoingRingtoneNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    });
    outgoingRingtoneNodes = [];

    console.log("🔇 Outgoing call ringtone stopped");
  } catch (error) {
    console.error("Stop outgoing call ringtone error:", error);
  }
};

/**
 * Phát 3 tiếng bíp dứt khoát khi cuộc gọi kết thúc
 */
export const playCallEndTone = () => {
  try {
    // Dừng mọi âm thanh chuông đang chạy
    stopCallRingtone();
    stopOutgoingCallRingtone();

    const ctx = initAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const vol = isIOS() ? 0.4 : 0.3;

    // 3 tiếng bíp ngắn cách nhau 0.1s
    [0, 0.16, 0.32].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now + offset);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(vol, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.11);
    });

    console.log("📴 Call end tone played");
  } catch (error) {
    console.error("Play call end tone error:", error);
  }
};

export const isRingtoneActive = () => {
  return isIncomingRingtonePlaying || isOutgoingRingtonePlaying;
};

// Tự động mở khóa audio khi user click / chạm lần đầu trên trang
if (typeof window !== 'undefined') {
  const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
  const handleFirstInteraction = () => {
    unlockCallRingtone();
    events.forEach((ev) => window.removeEventListener(ev, handleFirstInteraction));
  };
  events.forEach((ev) => window.addEventListener(ev, handleFirstInteraction, { passive: true }));
}
