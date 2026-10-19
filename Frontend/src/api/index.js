export { authApi } from './authApi';
export { postApi } from './postApi';
export { userApi } from './userApi';
export { commentApi } from './commentApi';
export { friendApi } from './friendApi';
export { chatApi } from './chatApi';
export { notificationApi } from './notificationApi';
export { storyApi } from './storyApi';
export { uploadApi } from './uploadApi';
export { callHistoryApi, saveCallHistory, getCallHistoryBetweenUsers, getAllCallHistory, getMissedCallsCount } from './callHistory';

// Default export object containing all APIs
export const api = {
  auth: () => import('./authApi').then((m) => m.authApi),
  post: () => import('./postApi').then((m) => m.postApi),
  user: () => import('./userApi').then((m) => m.userApi),
  comment: () => import('./commentApi').then((m) => m.commentApi),
  friend: () => import('./friendApi').then((m) => m.friendApi),
  chat: () => import('./chatApi').then((m) => m.chatApi),
  notification: () => import('./notificationApi').then((m) => m.notificationApi),
  story: () => import('./storyApi').then((m) => m.storyApi),
  upload: () => import('./uploadApi').then((m) => m.uploadApi),
  callHistory: () => import('./callHistory').then((m) => m.callHistoryApi),
};

export default api;
