import { ChatService } from '../services/chatService.js';

const getAuthUserId = (req) => Number(req.user?.id);

const getIo = (req) => req.app.get('io');

const forbid = (res) => res.status(403).json({ error: 'forbidden' });

const badRequest = (res, msg) => res.status(400).json({ error: msg });

export const getUserChats = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const userId = Number(req.params.userId);

    // chỉ cho phép lấy chat của chính mình
    if (!authId || authId !== userId) return forbid(res);

    const chats = await ChatService.getUserChats(userId);
    return res.json(chats);
  } catch (e) {
    console.error('getUserChats error:', e);
    return res.status(500).json({ error: 'getUserChats_failed' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const chatId = Number(req.params.chatId);

    // Parse query params
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const beforeId = req.query.beforeId ? Number(req.query.beforeId) : null;

    if (!authId) return forbid(res);
    if (!chatId) return badRequest(res, 'invalid_chatId');

    // Check access directly using ChatService
    const allowed = await ChatService.checkChatAccess(authId, chatId);
    if (!allowed) return forbid(res);

    const result = await ChatService.getMessagesByChat(chatId, limit, beforeId);
    return res.json(result.recordset);
  } catch (e) {
    console.error('getMessages error:', e);
    return res.status(500).json({ error: 'getMessages_failed' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    if (!authId) return forbid(res);

    const chatId = Number(req.params.chatId || req.body?.chatId);
    if (!chatId) return badRequest(res, 'invalid_chatId');

    // senderId lấy từ token, không lấy từ body
    const payload = {
      chatId,
      senderId: authId,
      content: req.body?.content || '',
      message_type: req.body?.message_type || 'text',
      media_url: req.body?.media_url ?? null,
      duration: req.body?.duration ?? null,
      reply_to_id: req.body?.reply_to_id ?? null,
      reply_content: req.body?.reply_content ?? null,
      reply_type: req.body?.reply_type ?? null,
      reply_sender: req.body?.reply_sender ?? null,
    };

    const result = await ChatService.sendMessage(payload);
    const row = result.recordset?.[0];

    // bắn realtime vào room của chat
    const io = getIo(req);
    if (io && row?.chat_id) io.to(`chat_${row.chat_id}`).emit('receive_message', row);

    return res.json(row);
  } catch (e) {
    console.error('sendMessage error:', e);
    return res.status(500).json({ error: 'sendMessage_failed' });
  }
};

export const markRead = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const chatId = Number(req.body?.chatId);
    if (!authId) return forbid(res);
    if (!chatId) return badRequest(res, 'invalid_chatId');

    await ChatService.markMessagesRead(chatId, authId);

    // bắn realtime đúng room chat
    const io = getIo(req);
    if (io) io.to(`chat_${chatId}`).emit('messages_read', { chatId, readBy: authId });

    return res.json({ success: true });
  } catch (e) {
    console.error('markRead error:', e);
    return res.status(500).json({ error: 'markRead_failed' });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const messageId = Number(req.params.id);
    if (!authId) return forbid(res);
    if (!messageId) return badRequest(res, 'invalid_messageId');

    // cần get meta để check chủ tin nhắn và lấy chat_id bắn realtime
    const meta = await ChatService.getMessageMeta(messageId);
    if (!meta) return res.status(404).json({ error: 'message_not_found' });
    if (Number(meta.sender_id) !== authId) return forbid(res);

    await ChatService.recallMessage(messageId);

    const io = getIo(req);
    if (io) io.to(`chat_${meta.chat_id}`).emit('message_recalled', { messageId });

    return res.json({ success: true });
  } catch (e) {
    console.error('deleteMessage error:', e);
    return res.status(500).json({ error: 'Cannot recall message' });
  }
};

export const editMessage = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const messageId = Number(req.params.id);
    const newContent = req.body?.newContent;
    if (!authId) return forbid(res);
    if (!messageId) return badRequest(res, 'invalid_messageId');
    if (typeof newContent !== 'string') return badRequest(res, 'invalid_newContent');

    const meta = await ChatService.getMessageMeta(messageId);
    if (!meta) return res.status(404).json({ error: 'message_not_found' });
    if (Number(meta.sender_id) !== authId) return forbid(res);

    await ChatService.editMessage(messageId, newContent);

    const io = getIo(req);
    if (io) io.to(`chat_${meta.chat_id}`).emit('message_edited', { messageId, newContent });

    return res.json({ success: true });
  } catch (e) {
    console.error('editMessage error:', e);
    return res.status(500).json({ error: 'Cannot edit message' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const userId = Number(req.params.userId);
    if (!authId || authId !== userId) return forbid(res);

    const count = await ChatService.getUnreadCount(authId);
    return res.json({ count });
  } catch (e) {
    console.error('getUnreadCount error:', e);
    return res.status(500).json({ error: 'Cannot get unread count' });
  }
};

export const getOrCreateDm = async (req, res) => {
  try {
    const authId = Number(req.user?.id);
    if (!authId) return res.status(403).json({ error: 'forbidden' });

    const receiverId = Number(req.body?.receiverId);
    if (!receiverId) return res.status(400).json({ error: 'invalid_receiverId' });
    if (receiverId === authId) return res.status(400).json({ error: 'cannot_dm_self' });

    const chatId = await ChatService.getOrCreateDm(authId, receiverId);
    return res.json({ chatId });
  } catch (e) {
    console.error('getOrCreateDm error:', e);
    return res.status(500).json({ error: 'getOrCreateDm_failed' });
  }
};

// ===================== GROUP CHAT CONTROLLERS =====================

export const createGroup = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    if (!authId) return forbid(res);

    const { name, memberIds = [], avatar } = req.body;
    if (!name || !name.trim()) return badRequest(res, 'Tên nhóm không được để trống');
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return badRequest(res, 'Vui lòng chọn ít nhất một thành viên cho nhóm');
    }

    const newChat = await ChatService.createGroupChat(authId, name.trim(), memberIds, avatar || null);

    // Bắn realtime tới người tạo và các thành viên được add
    const io = getIo(req);
    if (io) {
      const allMembers = [authId, ...memberIds];
      allMembers.forEach((uid) => {
        io.to(`user_${Number(uid)}`).emit('new_chat_group', newChat);
      });
    }

    return res.status(201).json({ success: true, chat: newChat });
  } catch (e) {
    console.error('createGroup error:', e);
    return res.status(500).json({ error: 'createGroup_failed' });
  }
};

export const getGroupDetails = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const chatId = Number(req.params.chatId);
    if (!authId) return forbid(res);
    if (!chatId) return badRequest(res, 'invalid_chatId');

    const allowed = await ChatService.checkChatAccess(authId, chatId);
    if (!allowed) return forbid(res);

    const group = await ChatService.getGroupDetails(chatId);
    if (!group) return res.status(404).json({ error: 'group_not_found' });

    return res.json(group);
  } catch (e) {
    console.error('getGroupDetails error:', e);
    return res.status(500).json({ error: 'getGroupDetails_failed' });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const chatId = Number(req.params.chatId);
    const { memberIds } = req.body;

    if (!authId) return forbid(res);
    if (!chatId) return badRequest(res, 'invalid_chatId');
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return badRequest(res, 'Danh sách thành viên không hợp lệ');
    }

    const allowed = await ChatService.checkChatAccess(authId, chatId);
    if (!allowed) return forbid(res);

    await ChatService.addGroupMembers(chatId, memberIds, authId);

    const group = await ChatService.getGroupDetails(chatId);
    const io = getIo(req);
    if (io) {
      io.to(`chat_${chatId}`).emit('group_members_updated', group);
      memberIds.forEach((uid) => {
        io.to(`user_${Number(uid)}`).emit('new_chat_group', group);
      });
    }

    return res.json({ success: true, group });
  } catch (e) {
    console.error('addGroupMembers error:', e);
    return res.status(500).json({ error: 'addGroupMembers_failed' });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const chatId = Number(req.params.chatId);
    const memberId = Number(req.params.memberId);

    if (!authId) return forbid(res);
    if (!chatId || !memberId) return badRequest(res, 'invalid_params');

    const allowed = await ChatService.checkChatAccess(authId, chatId);
    if (!allowed) return forbid(res);

    await ChatService.removeGroupMember(chatId, memberId, authId);

    const group = await ChatService.getGroupDetails(chatId);
    const io = getIo(req);
    if (io) {
      io.to(`chat_${chatId}`).emit('group_members_updated', group);
      io.to(`user_${memberId}`).emit('removed_from_group', { chatId });
    }

    return res.json({ success: true, group });
  } catch (e) {
    console.error('removeGroupMember error:', e);
    return res.status(500).json({ error: 'removeGroupMember_failed' });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const chatId = Number(req.params.chatId);

    if (!authId) return forbid(res);
    if (!chatId) return badRequest(res, 'invalid_chatId');

    await ChatService.removeGroupMember(chatId, authId, authId);

    const group = await ChatService.getGroupDetails(chatId);
    const io = getIo(req);
    if (io) {
      io.to(`chat_${chatId}`).emit('group_members_updated', group);
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('leaveGroup error:', e);
    return res.status(500).json({ error: 'leaveGroup_failed' });
  }
};

export const updateGroupInfo = async (req, res) => {
  try {
    const authId = getAuthUserId(req);
    const chatId = Number(req.params.chatId);
    const { name, avatar } = req.body;

    if (!authId) return forbid(res);
    if (!chatId) return badRequest(res, 'invalid_chatId');

    const allowed = await ChatService.checkChatAccess(authId, chatId);
    if (!allowed) return forbid(res);

    await ChatService.updateGroupInfo(chatId, authId, { name, avatar });

    const group = await ChatService.getGroupDetails(chatId);
    const io = getIo(req);
    if (io) {
      io.to(`chat_${chatId}`).emit('group_info_updated', group);
    }

    return res.json({ success: true, group });
  } catch (e) {
    console.error('updateGroupInfo error:', e);
    return res.status(500).json({ error: 'updateGroupInfo_failed' });
  }
};

