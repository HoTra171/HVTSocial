
// notificationSound.js
// Sử dụng Web Audio API để tạo âm thanh thông báo hiện đại, sang trọng (Double Chime)
// Không phụ thuộc file mp3/wav ngoài, đảm bảo 100% không lỗi decode và tương thích cao.

let audioContext = null;
let isAudioUnlocked = false;

// Detect iOS device
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const initAudio = async () => {
  try {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (isIOS() && !isAudioUnlocked) {
      const silentBuffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(audioContext.destination);
      source.start();
      isAudioUnlocked = true;
      console.log("iOS Audio unlocked");
    }
  } catch (error) {
    console.error("Audio unlock failed:", error);
  }
};

/**
 * Phát âm thanh thông báo tin nhắn mới (Double Chime: G5 -> C6)
 */
export const playNotificationSound = async () => {
  try {
    // 1. Rung trên thiết bị di động
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    // 2. Khởi tạo & resume AudioContext
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (audioContext.state !== 'running') {
      console.warn("AudioContext not running:", audioContext.state);
      return;
    }

    const t = audioContext.currentTime;
    const baseVolume = isIOS() ? 0.6 : 0.45;

    // Helper tạo nốt chuông trong trẻo
    const playChimeNote = (freq, startTime, duration, vol) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Attack & Exponential decay mượt mà
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Nốt 1: G5 (784Hz)
    playChimeNote(784, t, 0.25, baseVolume * 0.8);
    // Nốt 2: C6 (1046.5Hz) vang hơn
    playChimeNote(1046.5, t + 0.08, 0.4, baseVolume);

    console.log("🔔 Notification sound played successfully");
  } catch (error) {
    console.error("Play notification sound error:", error);
  }
};
