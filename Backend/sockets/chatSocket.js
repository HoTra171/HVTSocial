import { ChatService } from '../services/chatService.js';
import { NotificationService } from '../services/notificationService.js'; // <-- THÊM

// Lưu trạng thái online của users
const onlineUsers = new Map(); // userId -> Set(socketId)

export default function chatSocket(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // đăng ký user và thông báo online
    socket.on('register_user', (userId) => {
      const uid = Number(userId);
      socket.userId = uid;
      socket.join(`user_${uid}`);

      const set = onlineUsers.get(uid) || new Set();
      const wasOffline = set.size === 0;
      set.add(socket.id);
      onlineUsers.set(uid, set);

      // chỉ báo online khi chuyển từ offline -> online
      if (wasOffline) io.emit('user_status_changed', { userId: uid, status: 'online' });
    });

    // thông báo offline
    socket.on('disconnect', () => {
      if (!socket.userId) return;

      const set = onlineUsers.get(socket.userId);
      if (!set) return;

      set.delete(socket.id);

      // chỉ báo offline khi không còn socket nào
      if (set.size === 0) {
        onlineUsers.delete(socket.userId);
        io.emit('user_status_changed', { userId: socket.userId, status: 'offline' });
      }
    });

    // join 1 phòng chat để nhận receive_message theo room chat_{chatId}
    socket.on('join_chat', (chatId) => {
      const room = `chat_${Number(chatId)}`;
      socket.join(room);
    });

    // rời phòng chat khi không cần nữa
    socket.on('leave_chat', (chatId) => {
      const room = `chat_${Number(chatId)}`;
      socket.leave(room);
    });

    // =========================
    // GỬI TIN NHẮN (gộp luôn phần notification)
    // =========================
    socket.on('send_message', async (data, callback) => {
      try {
        // dùng userId từ socket để tránh giả mạo
        if (!socket.userId) return callback?.({ ok: false, error: 'not_registered' });

        const payload = {
          chatId: Number(data?.chatId),
          senderId: socket.userId,
          content: data?.content || '',
          message_type: data?.message_type || 'text',
          media_url: data?.media_url ?? null,
          duration: data?.duration ?? null,
          reply_to_id: data?.reply_to_id ?? null,
          reply_content: data?.reply_content ?? null,
          reply_type: data?.reply_type ?? null,
          reply_sender: data?.reply_sender ?? null,
        };

        if (!payload.chatId) return callback?.({ ok: false, error: 'invalid_params' });

        // lưu DB
        const result = await ChatService.sendMessage(payload);
        const row = result.recordset[0];

        const message = {
          id: row.id,
          chat_id: row.chat_id,
          sender_id: row.sender_id,
          content: row.content,
          status: row.status,
          message_type: row.message_type,
          media_url: row.media_url,
          duration: row.duration,
          created_at: row.created_at,
          reply_to_id: row.reply_to_id,
          reply_content: row.reply_content,
          reply_type: row.reply_type,
          reply_sender: row.reply_sender,
        };

        // phát message tới phòng chat
        io.to(`chat_${row.chat_id}`).emit('receive_message', message);

        // tạo và phát notification cho người nhận
        try {
          const chatUsers = await ChatService.getChatUsers(row.chat_id);
          const receivers = chatUsers.filter((u) => u.user_id !== row.sender_id);

          const notificationContent =
            row.message_type === 'text'
              ? (row.content || '').substring(0, 50)
              : row.message_type === 'image'
                ? 'Đã gửi một ảnh'
                : 'Đã gửi tin nhắn thoại';

          await Promise.all(
            receivers.map(async (u) => {
              await NotificationService.createMessageNotification({
                userId: u.user_id,
                senderId: row.sender_id,
                chatId: row.chat_id,
                content: notificationContent,
              });

              io.to(`user_${u.user_id}`).emit('new_notification', {
                type: 'message',
                senderId: row.sender_id,
                chatId: row.chat_id,
                content: notificationContent,
              });

              // cập nhật recent realtime cho tất cả user trong chat
              chatUsers.forEach((u) => {
                io.to(`user_${u.user_id}`).emit('recent_chat_updated', {
                  chat_id: row.chat_id,
                  last_message: notificationContent,
                  last_time: row.created_at,
                  sender_id: row.sender_id,
                  message_type: row.message_type,
                  media_url: row.media_url,
                  unread_inc: u.user_id === row.sender_id ? 0 : 1,
                });
              });
              const unreadCount = await NotificationService.getUnreadCount(u.user_id);
              io.to(`user_${u.user_id}`).emit('unread_count', unreadCount);
            })
          );
        } catch (notifyErr) {
          console.error('notification error:', notifyErr);
        }

        callback?.({ ok: true, message });
      } catch (err) {
        console.error('send_message socket error:', err);
        callback?.({ ok: false, error: 'send_message_failed' });
      }
    });

    // Đánh dấu đã xem tin nhắn
    socket.on('mark_messages_read', async ({ chatId, userId }) => {
      try {
        await ChatService.markMessagesRead(Number(chatId), Number(userId));
        socket.to(`chat_${Number(chatId)}`).emit('messages_read', {
          chatId: Number(chatId),
          readBy: Number(userId),
        });
        io.to(`user_${Number(userId)}`).emit('recent_chat_read', { chatId: Number(chatId) });
      } catch (err) {
        console.error('mark_messages_read error:', err);
      }
    });

    // Typing indicator
    socket.on('typing', ({ chatId, userId, isTyping }) => {
      const room = `chat_${Number(chatId)}`;
      socket.to(room).emit('user_typing', { userId: Number(userId), isTyping: !!isTyping });
    });

    // Thu hồi tin nhắn
    socket.on('recall_message', async ({ messageId, chatId }) => {
      try {
        await ChatService.recallMessage(Number(messageId));
        io.to(`chat_${Number(chatId)}`).emit('message_recalled', { messageId: Number(messageId) });
      } catch (err) {
        console.error('recall_message socket error:', err);
      }
    });

    // Chỉnh sửa tin nhắn
    socket.on('edit_message', async ({ messageId, newContent, chatId }) => {
      try {
        await ChatService.editMessage(Number(messageId), newContent);
        io.to(`chat_${Number(chatId)}`).emit('message_edited', {
          messageId: Number(messageId),
          newContent,
        });
      } catch (err) {
        console.error('edit_message socket error:', err);
      }
    });

    // Gửi reaction
    socket.on('send_reaction', async ({ messageId, emoji, chatId }) => {
      try {
        io.to(`chat_${Number(chatId)}`).emit('message_reacted', {
          messageId: Number(messageId),
          emoji,
        });
      } catch (err) {
        console.error('send_reaction error:', err);
      }
    });

    // =========================
    // WEBRTC CALL SIGNALING
    // =========================
    socket.on('call_user', ({ to, offer, isVideo }) => {
      const target = Number(to);
      if (!target) return;
      console.log(`User ${socket.userId} calling user ${target}`);
      io.to(`user_${target}`).emit('incoming_call', {
        from: socket.userId,
        offer,
        isVideo: !!isVideo,
      });
    });

    socket.on('answer_call', ({ to, answer }) => {
      const target = Number(to);
      if (!target) return;
      io.to(`user_${target}`).emit('call_answered', { answer });
    });

    socket.on('ice_candidate', ({ to, candidate }) => {
      const target = Number(to);
      if (!target || !candidate) return;
      io.to(`user_${target}`).emit('ice_candidate', { candidate });
    });

    socket.on('end_call', ({ to }) => {
      const target = Number(to);
      if (!target) return;
      io.to(`user_${target}`).emit('call_ended');
    });
  });

  // -------- Helper trên io --------
  io.isUserOnline = (userId) => {
    const set = onlineUsers.get(Number(userId));
    return !!set && set.size > 0;
  };

  io.getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
  };
}

export { onlineUsers };
