/**
 * Call Ringtone Utility
 * Plays ringtone for incoming video/voice calls
 * Works on both desktop and mobile (iOS/Android)
 */

let audioContext = null;
let ringtoneSource = null;
let isRingtonePlaying = false;
let ringtoneInterval = null;
let isAudioUnlocked = false;

/**
 * Initialize AudioContext (required for iOS)
 */
const initAudioContext = () => {
  if (!audioContext) {
    // Use webkitAudioContext for Safari compatibility
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  return audioContext;
};

/**
 * Detect if device is iOS
 */
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Unlock audio for iOS (must be called on user interaction)
 */
export const unlockCallRingtone = () => {
  if (isAudioUnlocked) return;

  try {
    const ctx = initAudioContext();

    // Create silent buffer
    const silentBuffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = silentBuffer;
    source.connect(ctx.destination);
    source.start(0);

    isAudioUnlocked = true;
    console.log('Call ringtone audio unlocked');
  } catch (error) {
    console.error('Failed to unlock call ringtone audio:', error);
  }
};

/**
 * Create a ringtone pattern (similar to phone ringtone)
 * Plays a repeating tone: beep-beep-pause-beep-beep-pause
 */
const createRingtonePattern = () => {
  const ctx = initAudioContext();

  // Ensure context is running
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Create oscillator for tone
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Ringtone frequency (similar to phone ringtone)
  oscillator.frequency.value = 800; // 800 Hz
  oscillator.type = 'sine';

  // Volume (higher for iOS, lower for others)
  const volume = isIOS() ? 0.8 : 0.6;
  gainNode.gain.value = volume;

  // Start the oscillator
  const currentTime = ctx.currentTime;
  oscillator.start(currentTime);

  // Create beep pattern: 0.3s on, 0.2s off, 0.3s on, 1.5s off
  // This creates: beep-beep-pause pattern
  gainNode.gain.setValueAtTime(volume, currentTime);
  gainNode.gain.setValueAtTime(0, currentTime + 0.3); // First beep
  gainNode.gain.setValueAtTime(volume, currentTime + 0.5); // Second beep
  gainNode.gain.setValueAtTime(0, currentTime + 0.8); // Pause

  // Stop after one cycle (2 seconds total)
  oscillator.stop(currentTime + 2);

  return oscillator;
};

/**
 * Play call ringtone (loops until stopped)
 * @param {string} callType - 'video' or 'voice'
 */
export const playCallRingtone = (callType = 'video') => {
  try {
    // Stop any existing ringtone
    stopCallRingtone();

    isRingtonePlaying = true;

    // Play ringtone pattern repeatedly
    const playPattern = () => {
      if (!isRingtonePlaying) return;

      ringtoneSource = createRingtonePattern();

      // Play next pattern after 2 seconds
      ringtoneInterval = setTimeout(playPattern, 2000);
    };

    // Start playing
    playPattern();

    // Also vibrate on mobile (if available)
    if (navigator.vibrate) {
      // Vibrate pattern: [vibrate, pause, vibrate, pause] in milliseconds
      const vibratePattern = [400, 200, 400, 1400]; // Matches the beep-beep-pause pattern
      const vibrateLoop = () => {
        if (isRingtonePlaying) {
          navigator.vibrate(vibratePattern);
          setTimeout(vibrateLoop, 2000); // Repeat every 2 seconds
        }
      };
      vibrateLoop();
    }

    console.log(`${callType} call ringtone started`);
  } catch (error) {
    console.error('Play call ringtone error:', error);
  }
};

/**
 * Stop call ringtone
 */
export const stopCallRingtone = () => {
  try {
    isRingtonePlaying = false;

    // Clear interval
    if (ringtoneInterval) {
      clearTimeout(ringtoneInterval);
      ringtoneInterval = null;
    }

    // Stop current tone
    if (ringtoneSource) {
      try {
        ringtoneSource.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      ringtoneSource = null;
    }

    // Stop vibration
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }

    console.log('Call ringtone stopped');
  } catch (error) {
    console.error('Stop call ringtone error:', error);
  }
};

/**
 * Check if ringtone is currently playing
 */
export const isRingtoneActive = () => {
  return isRingtonePlaying;
};

/**
 * Play a short "call ended" tone
 */
export const playCallEndTone = () => {
  try {
    const ctx = initAudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Lower frequency for "end" tone
    oscillator.frequency.value = 400; // 400 Hz
    oscillator.type = 'sine';

    const volume = isIOS() ? 0.6 : 0.4;
    gainNode.gain.value = volume;

    const currentTime = ctx.currentTime;
    oscillator.start(currentTime);

    // Short descending tone
    oscillator.frequency.exponentialRampToValueAtTime(200, currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);

    oscillator.stop(currentTime + 0.3);

    console.log('Call end tone played');
  } catch (error) {
    console.error('Play call end tone error:', error);
  }
};

// Auto-unlock on first user interaction
if (typeof window !== 'undefined') {
  const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
  const handleFirstInteraction = () => {
    unlockCallRingtone();
    // Remove listeners after first interaction
    events.forEach(event => {
      window.removeEventListener(event, handleFirstInteraction);
    });
  };

  events.forEach(event => {
    window.addEventListener(event, handleFirstInteraction);
  });
}
