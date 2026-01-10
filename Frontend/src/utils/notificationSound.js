
// Base64 encoded "Ting" sound (Bell/Glass)
const NOTIFICATION_SOUND = "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG84AA0WAgAAAAAAAAAAAA0WAgAAAAAAAAAA//uQZAZAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZCSAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZDyAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZEsAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZFYaaB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZGkaaB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA";

// Create a single Audio instance to reuse
let audioInstance = null;

export const initAudio = () => {
  if (!audioInstance) {
    audioInstance = new Audio(NOTIFICATION_SOUND);
    audioInstance.volume = 0.5;
  }

  // Play and immediately pause to unlock audio context on mobile
  audioInstance.play().then(() => {
    audioInstance.pause();
    audioInstance.currentTime = 0;
  }).catch(error => {
    console.log("Audio autoplay prevented (normal before interaction)", error);
  });
};

export const playNotificationSound = () => {
  try {
    if (!audioInstance) {
      audioInstance = new Audio(NOTIFICATION_SOUND);
      audioInstance.volume = 0.5;
    }

    // Reset time to play from start if rapid calls
    audioInstance.currentTime = 0;

    const playPromise = audioInstance.play();

    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Could not play notification sound:", error);
      });
    }
  } catch (error) {
    console.error("Audio error:", error);
  }
};
