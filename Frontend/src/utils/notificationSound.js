
// Base64 encoded "Pop" sound (short notification)
const NOTIFICATION_SOUND = "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAG84AA0WAgAAAAAAAAAAAA0WAgAAAAAAAAAA//uQZAZAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZCSAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZDyAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZEsAAB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZFYaaB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA//uQZGkaaB9AA3gAAAA0kAA3gAAAAHOX3cAEDtn//iQBDf/nL7uACA7Z//4kAQ3/wAAAGkAAAAAAAAD/nL7uACA7Z//4kAQ3/5y+7gAgO2f/+JUEN/+AAAADSQAAAAAAA";

export const playNotificationSound = () => {
  try {
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.volume = 0.5; // 50% volume to be subtle
    audio.play().catch(err => {
      // Browsers might block auto-play if no user interaction yet
      console.warn("Could not play notification sound:", err);
    });
  } catch (error) {
    console.error("Audio error:", error);
  }
};
