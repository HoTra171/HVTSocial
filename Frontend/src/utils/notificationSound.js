/**
 * Play notification sound for new messages
 * Uses Web Audio API to generate a pleasant notification beep
 */

let audioContext = null;

const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

export const playMessageSound = () => {
  try {
    const ctx = initAudioContext();

    // Create oscillator for the sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configure sound - pleasant notification beep
    oscillator.frequency.setValueAtTime(800, ctx.currentTime); // Higher pitch
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1); // Slight drop

    // Volume envelope
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime); // Start at 30% volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2); // Fade out

    // Play sound
    oscillator.type = 'sine'; // Smooth sine wave
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2); // 200ms duration
  } catch (err) {
    console.error('Error playing notification sound:', err);
  }
};

// Alternative: Load and play an audio file
export const playMessageSoundFromFile = (soundUrl = '/sounds/notification.mp3') => {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = 0.5; // 50% volume
    audio.play().catch(err => {
      console.warn('Could not play notification sound:', err);
    });
  } catch (err) {
    console.error('Error playing notification sound:', err);
  }
};
