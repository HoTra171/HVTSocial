
// Base64 encoded "Crystal/Chime" sound
const NOTIFICATION_SOUND = "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG84AA0WAgAAAAAAAAAAAA0WAgAAAAAAAAAA//uQZAZAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZCSAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZDyAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZEsAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZFYaaB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZGkaaB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA";

let audioContext = null;
let audioBuffer = null;

// Convert Base64 to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const initAudio = async () => {
  try {
    // 1. Create AudioContext if not exists
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 2. Resume context (Mobile unlock)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // 3. Decode audio data once and cache it
    if (!audioBuffer) {
      const arrayBuffer = base64ToArrayBuffer(NOTIFICATION_SOUND);
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    }

  } catch (error) {
    console.error("Audio unlock failed:", error);
  }
};

export const playNotificationSound = async () => {
  try {
    // VIBRATION support (Android)
    if ("vibrate" in navigator) {
      navigator.vibrate([200]); // Vibrate for 200ms
    }

    // AUDIO playback
    if (!audioContext) {
      // Try to init if not ready (might fail if no interaction, but worth a shot)
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === 'suspended') {
      // Try to resume again
      await audioContext.resume();
    }

    if (!audioBuffer) {
      const arrayBuffer = base64ToArrayBuffer(NOTIFICATION_SOUND);
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    }

    // Create source and play
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);

  } catch (error) {
    console.error("Play sound error:", error);
  }
};
