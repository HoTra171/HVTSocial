
// notificationSound.js
// Sử dụng AudioContext để tạo âm thanh (Synthesized Sound)
// Cách này KHÔNG bị lỗi decode và load cực nhanh.
// Hỗ trợ đầy đủ cho iOS Safari

let audioContext = null;
let isAudioUnlocked = false;

// Detect iOS device
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const initAudio = async () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Mở khóa AudioContext trên Mobile (Resume khi user chạm)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // ĐẶC BIỆT CHO iOS: Phát âm thanh câm để unlock
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

export const playNotificationSound = async () => {
  try {
    // 1. RUNG (Vibration) - Chỉ Android hỗ trợ
    if ("vibrate" in navigator) {
      navigator.vibrate([200]);
    }

    // 2. KHỞI TẠO CONTEXT
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 3. RESUME CONTEXT (Quan trọng cho iOS)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // 4. KIỂM TRA CONTEXT STATE
    if (audioContext.state !== 'running') {
      console.warn("AudioContext not running:", audioContext.state);
      return;
    }

    // 5. TẠO ÂM THANH "TING" (Synthesized)
    const t = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Cấu hình âm thanh: Sine wave (tiếng chuông trong)
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, t); // 880Hz (Nốt A5) - Tiếng cao, rõ
    oscillator.frequency.exponentialRampToValueAtTime(110, t + 0.5); // Giảm dần cao độ chút (Hiệu ứng Ping)

    // Cấu hình âm lượng (Fade out - Hiệu ứng ngân)
    // iOS thường có âm lượng thấp hơn nên tăng lên 0.7
    const volume = isIOS() ? 0.7 : 0.5;
    gainNode.gain.setValueAtTime(volume, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    // Nối mạch: Oscillator -> Gain -> Loa
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Phát và dừng sau 0.5s
    oscillator.start(t);
    oscillator.stop(t + 0.5);

    console.log("Notification sound played");

  } catch (error) {
    console.error("Play sound error:", error);
  }
};
