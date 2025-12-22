import { ChatModel } from "../models/chatModel.js";
import { pool } from "../config/db.js";

export const ChatService = {
  getUserChats: (userId) => ChatModel.getUserChats(pool, userId),

  getMessagesByChat: (chatId) => ChatModel.getMessagesByChat(pool, chatId),

  sendMessage: (payload) => ChatModel.sendMessage(pool, payload),

  markMessagesRead: (chatId, userId) =>
    ChatModel.markMessagesRead(pool, chatId, userId),

  recallMessage: async (messageId) => {
    const result = await ChatModel.recallMessage(pool, messageId);
    return result;
  },

  editMessage: async (messageId, newContent) => {
    const result = await ChatModel.editMessage(pool, messageId, newContent);
    return result;
  },

  getUnreadCount: async (userId) => {
    const count = await ChatModel.getUnreadCount(pool, userId);
    return count;
  },

  getMessageMeta: (messageId) => ChatModel.getMessageMeta(pool, messageId),

  getChatUsers: (chatId) => ChatModel.getChatUsers(pool, chatId),

  getOrCreateDm: (userA, userB) => ChatModel.getOrCreateDm(pool, userA, userB),

};
