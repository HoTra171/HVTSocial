import { LiveStreamService } from '../services/liveStreamService.js';

export const createLiveStream = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, thumbnail_url } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập tiêu đề cho buổi phát trực tiếp' });
    }

    const stream = await LiveStreamService.createStream(userId, {
      title: title.trim(),
      description: description?.trim() || '',
      thumbnail_url: thumbnail_url || null,
    });

    // Notify socket if available
    const io = req.app.get('io');
    if (io) {
      io.emit('new_livestream_started', stream);
    }

    return res.status(201).json(stream);
  } catch (err) {
    console.error('createLiveStream error:', err);
    return res.status(500).json({ message: 'Không thể tạo buổi phát trực tiếp' });
  }
};

export const getActiveLiveStreams = async (req, res) => {
  try {
    const streams = await LiveStreamService.getActiveStreams();
    return res.json(streams);
  } catch (err) {
    console.error('getActiveLiveStreams error:', err);
    return res.status(500).json({ message: 'Không thể tải danh sách Live Stream' });
  }
};

export const getLiveStreamById = async (req, res) => {
  try {
    const streamId = Number(req.params.id);
    if (!streamId) return res.status(400).json({ message: 'Invalid stream ID' });

    const stream = await LiveStreamService.getStreamById(streamId);
    if (!stream) {
      return res.status(404).json({ message: 'Không tìm thấy buổi phát trực tiếp' });
    }

    return res.json(stream);
  } catch (err) {
    console.error('getLiveStreamById error:', err);
    return res.status(500).json({ message: 'Lỗi khi tải thông tin Live Stream' });
  }
};

export const endLiveStream = async (req, res) => {
  try {
    const streamId = Number(req.params.id);
    const userId = req.user.id;

    if (!streamId) return res.status(400).json({ message: 'Invalid stream ID' });

    await LiveStreamService.endStream(streamId, userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`livestream_${streamId}`).emit('livestream_ended', { streamId });
      io.emit('user_livestream_ended', { streamId, userId });
    }

    return res.json({ message: 'Đã kết thúc buổi phát trực tiếp' });
  } catch (err) {
    console.error('endLiveStream error:', err);
    return res.status(500).json({ message: 'Không thể kết thúc Live Stream' });
  }
};

export const getUserLiveStatus = async (req, res) => {
  try {
    const targetUserId = Number(req.params.userId);
    if (!targetUserId) return res.status(400).json({ message: 'Invalid user ID' });

    const activeStream = await LiveStreamService.getActiveStreamByUser(targetUserId);
    return res.json({
      is_live: !!activeStream,
      stream: activeStream,
    });
  } catch (err) {
    console.error('getUserLiveStatus error:', err);
    return res.status(500).json({ message: 'Lỗi khi kiểm tra trạng thái Live' });
  }
};

export const getLiveStreamComments = async (req, res) => {
  try {
    const streamId = Number(req.params.id);
    if (!streamId) return res.status(400).json({ message: 'Invalid stream ID' });

    const comments = await LiveStreamService.getComments(streamId);
    return res.json(comments);
  } catch (err) {
    console.error('getLiveStreamComments error:', err);
    return res.status(500).json({ message: 'Không thể tải bình luận' });
  }
};

export const addLiveStreamComment = async (req, res) => {
  try {
    const streamId = Number(req.params.id);
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Nội dung bình luận không được để trống' });
    }

    const comment = await LiveStreamService.addComment(streamId, userId, content.trim());

    const io = req.app.get('io');
    if (io) {
      io.to(`livestream_${streamId}`).emit('livestream_new_comment', comment);
    }

    return res.status(201).json(comment);
  } catch (err) {
    console.error('addLiveStreamComment error:', err);
    return res.status(500).json({ message: 'Không thể gửi bình luận' });
  }
};
