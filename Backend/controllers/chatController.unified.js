/**
 * Chat Controller - Use PostgreSQL native model when on PostgreSQL
 */
import db from '../config/db.js';
import { ChatModel } from '../models/chatModel.js';
import { ChatModelPG } from '../models/chatModel.pg.js';

// Detect which model to use
const usePostgreSQL = !!process.env.DATABASE_URL;
const chatModel = usePostgreSQL ? ChatModelPG : ChatModel;

console.log(`📦 Chat Controller using: ${usePostgreSQL ? 'PostgreSQL' : 'SQL Server'} model`);

/* ================= GET USER CHATS ================= */
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await chatModel.getUserChats(userId);

    return res.json({ success: true, data: chats });
  } catch (err) {
    console.error('getUserChats error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ================= GET UNREAD COUNT ================= */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await chatModel.getUnreadCount(userId);

    return res.json({ success: true, unread: count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ================= GET MESSAGES BY CHAT ================= */
export const getMessagesByChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user is member of chat
    const membership = await db.pool.query(
      'SELECT 1 FROM chat_users WHERE chat_id = $1 AND user_id = $2',
      [chatId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a member of this chat' });
    }

    const messages = await chatModel.getMessagesByChat(chatId);

    return res.json({ success: true, data: messages });
  } catch (err) {
    console.error('getMessagesByChat error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Export other controller functions as needed...
