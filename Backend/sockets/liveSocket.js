import { LiveStreamService } from '../services/liveStreamService.js';

// Quản lý các phòng Live Stream đang hoạt động: streamId -> { hostSocketId, hostUserId, viewers: Map(socketId -> viewerInfo) }
const liveRooms = new Map();

export default function liveSocket(io) {
  io.on('connection', (socket) => {
    // 1. HOST BẮT ĐẦU PHÁT TRỰC TIẾP
    socket.on('host_start_livestream', async ({ streamId, title, user }) => {
      const sId = Number(streamId);
      if (!sId) return;

      const roomName = `livestream_${sId}`;
      socket.join(roomName);

      socket.isStreamHost = true;
      socket.activeStreamId = sId;

      liveRooms.set(sId, {
        hostSocketId: socket.id,
        hostUserId: socket.userId || user?.id,
        hostUser: user,
        viewers: new Map(),
      });

      console.log(`[LiveStream] Host started live stream ${sId} on socket ${socket.id}`);

      // Phát thông báo toàn mạng xã hội để hiển thị badge TRỰC TIẾP trên StoriesBar / Profile
      io.emit('new_livestream_started', {
        id: sId,
        title,
        user: user || { id: socket.userId },
        started_at: new Date().toISOString(),
      });
    });

    // 2. VIEWER THAM GIA XEM PHÒNG LIVE
    socket.on('viewer_join_livestream', async ({ streamId, user }) => {
      const sId = Number(streamId);
      if (!sId) return;

      const roomName = `livestream_${sId}`;
      socket.join(roomName);
      socket.activeViewingStreamId = sId;

      let room = liveRooms.get(sId);
      // Fallback: nếu server khởi động lại hoặc host đã vào trước đó
      if (!room) {
        try {
          const socketsInRoom = await io.in(roomName).fetchSockets();
          const hostSocket = socketsInRoom.find((s) => s.isStreamHost && Number(s.activeStreamId) === sId);
          if (hostSocket) {
            room = {
              hostSocketId: hostSocket.id,
              hostUserId: hostSocket.userId,
              hostUser: hostSocket.user,
              viewers: new Map(),
            };
            liveRooms.set(sId, room);
            console.log(`[LiveStream] Recovered room ${sId} with host socket ${hostSocket.id}`);
          }
        } catch (e) {
          console.error('[LiveStream] Error recovering host socket:', e);
        }
      }

      if (room) {
        room.viewers.set(socket.id, {
          socketId: socket.id,
          userId: socket.userId || user?.id,
          user,
        });

        const viewerCount = room.viewers.size;
        // Cập nhật số người xem cho cả phòng
        io.to(roomName).emit('livestream_viewer_count', { streamId: sId, count: viewerCount });

        // Cập nhật ngầm vào DB
        LiveStreamService.updateViewerCount(sId, viewerCount).catch(() => {});

        // Báo cho host biết có viewer mới để Host tạo RTCPeerConnection offer gửi tới viewer này
        if (room.hostSocketId) {
          console.log(`[LiveStream] Emitting viewer_joined to host ${room.hostSocketId} for viewer ${socket.id}`);
          io.to(room.hostSocketId).emit('viewer_joined', {
            viewerSocketId: socket.id,
            viewerUser: user,
          });
        }
      } else {
        console.warn(`[LiveStream] Viewer ${socket.id} joined stream ${sId} but host not found yet.`);
      }
    });

    // 2.1. VIEWER YÊU CẦU LẠI STREAM (NẾU CHƯA NHẬN ĐƯỢC VIDEO HOẶC BỊ ĐEN HÌNH)
    socket.on('viewer_request_stream', async ({ streamId, user }) => {
      const sId = Number(streamId);
      if (!sId) return;

      let room = liveRooms.get(sId);
      if (!room) {
        const roomName = `livestream_${sId}`;
        const socketsInRoom = await io.in(roomName).fetchSockets();
        const hostSocket = socketsInRoom.find((s) => s.isStreamHost && Number(s.activeStreamId) === sId);
        if (hostSocket) {
          room = {
            hostSocketId: hostSocket.id,
            hostUserId: hostSocket.userId,
            hostUser: hostSocket.user,
            viewers: new Map(),
          };
          liveRooms.set(sId, room);
        }
      }

      if (room?.hostSocketId) {
        console.log(`[LiveStream] Viewer ${socket.id} re-requested stream from host ${room.hostSocketId}`);
        io.to(room.hostSocketId).emit('viewer_joined', {
          viewerSocketId: socket.id,
          viewerUser: user,
        });
      }
    });

    // 3. WEBRTC SIGNALING: HOST GỬI OFFER CHO VIEWER
    socket.on('livestream_offer', ({ streamId, toViewerSocketId, offer }) => {
      if (!toViewerSocketId || !offer) return;
      io.to(toViewerSocketId).emit('livestream_offer', {
        fromHostSocketId: socket.id,
        streamId,
        offer,
      });
    });

    // 4. WEBRTC SIGNALING: VIEWER TRẢ LỜI ANSWER CHO HOST
    socket.on('livestream_answer', ({ streamId, toHostSocketId, answer }) => {
      if (!toHostSocketId || !answer) return;
      io.to(toHostSocketId).emit('livestream_answer', {
        fromViewerSocketId: socket.id,
        streamId,
        answer,
      });
    });

    // 5. WEBRTC SIGNALING: TRAO ĐỔI ICE CANDIDATE
    socket.on('livestream_ice_candidate', ({ targetSocketId, candidate }) => {
      if (!targetSocketId || !candidate) return;
      io.to(targetSocketId).emit('livestream_ice_candidate', {
        fromSocketId: socket.id,
        candidate,
      });
    });

    // 6. GỬI BÌNH LUẬN TRONG BUỔI LIVE
    socket.on('livestream_send_comment', async ({ streamId, user, content }) => {
      const sId = Number(streamId);
      if (!sId || !content || !content.trim()) return;

      const roomName = `livestream_${sId}`;
      const commentPayload = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        livestream_id: sId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        user: user || { id: socket.userId, full_name: 'Khán giả' },
      };

      // Phát cho toàn phòng nhận tức thì
      io.to(roomName).emit('livestream_new_comment', commentPayload);

      // Lưu vào database nếu có userId
      const uId = socket.userId || user?.id;
      if (uId) {
        LiveStreamService.addComment(sId, uId, content.trim()).catch((err) => {
          console.error('Error saving live comment:', err);
        });
      }
    });

    // 7. THẢ TIM / THẢ CẢM XÚC BAY LÊN MÀN HÌNH
    socket.on('livestream_send_reaction', ({ streamId, emoji, user }) => {
      const sId = Number(streamId);
      if (!sId) return;

      const roomName = `livestream_${sId}`;
      io.to(roomName).emit('livestream_new_reaction', {
        id: `rx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        emoji: emoji || '❤️',
        user: user || { id: socket.userId },
      });
    });

    // 8. RỜI PHÒNG LIVE (VIEWER)
    socket.on('viewer_leave_livestream', ({ streamId }) => {
      const sId = Number(streamId);
      if (!sId) return;

      const roomName = `livestream_${sId}`;
      socket.leave(roomName);

      const room = liveRooms.get(sId);
      if (room) {
        room.viewers.delete(socket.id);
        const count = room.viewers.size;
        io.to(roomName).emit('livestream_viewer_count', { streamId: sId, count });
        if (room.hostSocketId) {
          io.to(room.hostSocketId).emit('viewer_left', { viewerSocketId: socket.id });
        }
      }
    });

    // 9. HOST KẾT THÚC BUỔI LIVE
    socket.on('host_end_livestream', async ({ streamId }) => {
      const sId = Number(streamId);
      if (!sId) return;

      const roomName = `livestream_${sId}`;
      io.to(roomName).emit('livestream_ended', { streamId: sId });
      io.emit('user_livestream_ended', { streamId: sId, userId: socket.userId });

      const room = liveRooms.get(sId);
      if (room) {
        liveRooms.delete(sId);
      }

      if (socket.userId) {
        LiveStreamService.endStream(sId, socket.userId).catch(() => {});
      }
    });

    // 10. XỬ LÝ KHI NGẮT KẾT NỐI SOCKET
    socket.on('disconnect', () => {
      // Nếu là Host bị disconnect
      if (socket.isStreamHost && socket.activeStreamId) {
        const sId = socket.activeStreamId;
        const roomName = `livestream_${sId}`;

        console.log(`[LiveStream] Host disconnected for stream ${sId}`);
        io.to(roomName).emit('livestream_ended', { streamId: sId });
        io.emit('user_livestream_ended', { streamId: sId, userId: socket.userId });

        liveRooms.delete(sId);
        if (socket.userId) {
          LiveStreamService.endStream(sId, socket.userId).catch(() => {});
        }
      }

      // Nếu là Viewer bị disconnect
      if (socket.activeViewingStreamId) {
        const sId = socket.activeViewingStreamId;
        const room = liveRooms.get(sId);
        if (room) {
          room.viewers.delete(socket.id);
          const count = room.viewers.size;
          io.to(`livestream_${sId}`).emit('livestream_viewer_count', { streamId: sId, count });
          if (room.hostSocketId) {
            io.to(room.hostSocketId).emit('viewer_left', { viewerSocketId: socket.id });
          }
        }
      }
    });
  });
}
