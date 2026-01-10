
// notificationSound.js
// Sử dụng AudioContext để tạo âm thanh (Synthesized Sound)
// Cách này KHÔNG bị lỗi decode và load cực nhanh.

let audioContext = null;

export const initAudio = async () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Mở khóa AudioContext trên Mobile (Resume khi user chạm)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
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

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // 3. TẠO ÂM THANH "TING" (Synthesized)
    const t = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Cấu hình âm thanh: Sine wave (tiếng chuông trong)
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, t); // 880Hz (Nốt A5) - Tiếng cao, rõ
    oscillator.frequency.exponentialRampToValueAtTime(110, t + 0.5); // Giảm dần cao độ chút (Hiệu ứng Ping)

    // Cấu hình âm lượng (Fade out - Hiệu ứng ngân)
    gainNode.gain.setValueAtTime(0.5, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    // Nối mạch: Oscillator -> Gain -> Loa
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Phát và dừng sau 0.5s
    oscillator.start(t);
    oscillator.stop(t + 0.5);

  } catch (error) {
    console.error("Play sound error:", error);
  }
};
