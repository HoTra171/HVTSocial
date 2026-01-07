import { ShareService } from '../services/shareService.js';
import { emitNotification } from '../helpers/notificationHelper.js';
import { PostService } from '../services/postService.js';

// POST /api/shares
export const sharePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.body;

    const result = await ShareService.sharePost(userId, postId);

    const post = await PostService.getPostById(postId);
    const postOwnerId = post?.user_id ?? post?.user?.id;

    console.log('[SHARE DEBUG]', {
      sharerId: userId,
      postOwnerId,
      postId,
      willNotify: postOwnerId && postOwnerId !== userId,
    });

    const io = req.app.get('io') || null;

    if (postOwnerId && postOwnerId !== userId) {
      const notification = await emitNotification(io, {
        userId: postOwnerId,
        senderId: userId,
        type: 'other', // Đã sửa từ "share" → "other"
        postId,
        content: 'đã chia sẻ bài viết của bạn',
      });

      console.log('[SHARE NOTIFICATION]', notification ? '✓ Created' : '✗ Failed');
    }

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('sharePost error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/shares/:id
export const getSharedPost = async (req, res) => {
  try {
    const shareId = Number(req.params.id);

    const share = await ShareService.getSharedPost(shareId);

    if (!share) {
      return res.status(404).json({ message: 'Bài share không tồn tại' });
    }

    res.json(share);
  } catch (err) {
    console.error('getSharedPost error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/shares/post/:postId
export const getPostShares = async (req, res) => {
  try {
    const postId = Number(req.params.postId);

    const shares = await ShareService.getPostShares(postId);

    res.json(shares);
  } catch (err) {
    console.error('getPostShares error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/shares/:id
export const deleteShare = async (req, res) => {
  try {
    const userId = req.user.id;
    const shareId = Number(req.params.id);

    const result = await ShareService.deleteShare(shareId, userId);

    res.json(result);
  } catch (err) {
    console.error('deleteShare error:', err);

    if (err.message.includes('không có quyền')) {
      return res.status(403).json({ message: err.message });
    }

    res.status(500).json({ message: 'Server error' });
  }
};
