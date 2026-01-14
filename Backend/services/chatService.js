import { ChatModel } from '../models/chatModel.js';
import { ChatModelPG } from '../models/chatModel.pg.js';
import { pool } from '../config/db.js';

// Auto-detect which model to use based on DATABASE_URL
const usePostgreSQL = !!process.env.DATABASE_URL;

console.log(
  `📦 ChatService using: ${usePostgreSQL ? 'PostgreSQL (Railway)' : 'SQL Server (Local)'} model`
);

export const ChatService = {
  // Methods với PostgreSQL support
  getUserChats: (userId) =>
    usePostgreSQL ? ChatModelPG.getUserChats(userId) : ChatModel.getUserChats(pool, userId),

  getMessagesByChat: (chatId, limit, beforeId) =>
    usePostgreSQL
      ? ChatModelPG.getMessagesByChat(chatId, limit, beforeId)
      : ChatModel.getMessagesByChat(pool, chatId, limit, beforeId),

  getUnreadCount: async (userId) =>
    usePostgreSQL
      ? await ChatModelPG.getUnreadCount(userId)
      : await ChatModel.getUnreadCount(pool, userId),

  // Methods chỉ dùng SQL Server (chưa có PostgreSQL version)
  sendMessage: (payload) =>
    usePostgreSQL ? ChatModelPG.sendMessage(payload) : ChatModel.sendMessage(pool, payload),

  markMessagesRead: (chatId, userId) => ChatModel.markMessagesRead(pool, chatId, userId),

  recallMessage: (messageId) => ChatModel.recallMessage(pool, messageId),

  editMessage: (messageId, newContent) => ChatModel.editMessage(pool, messageId, newContent),

  getMessageMeta: (messageId) => ChatModel.getMessageMeta(pool, messageId),

  getChatUsers: (chatId) => ChatModel.getChatUsers(pool, chatId),

  getOrCreateDm: (userA, userB) => ChatModel.getOrCreateDm(pool, userA, userB),

  checkChatAccess: (userId, chatId) =>
    usePostgreSQL
      ? ChatModelPG.checkChatAccess(userId, chatId)
      : ChatModel.checkChatAccess(pool, userId, chatId),
};
