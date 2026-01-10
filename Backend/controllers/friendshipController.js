import { FriendshipService } from '../services/friendshipService.js';
import { emitNotification } from '../helpers/notificationHelper.js';

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    const result = await FriendshipService.sendFriendRequest(userId, friendId);

    // Emit notification (luôn tạo record; nếu có socket thì emit realtime)
    await emitNotification(req.app.get('io') || null, {
      userId: friendId,
      senderId: userId,
      type: 'friend_request',
    });

    res.status(201).json({
      success: true,
      message: 'Đã gửi lời mời kết bạn',
      data: result,
    });
  } catch (err) {
    console.error('sendFriendRequest error:', err);
    res.status(400).json({ message: err.message });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    const result = await FriendshipService.acceptFriendRequest(userId, friendId);

    // Lấy đúng người đã gửi request (sender) từ DB/Service
    const senderId = result?.requester_id || result?.sender_id || friendId;

    console.log(
      '[ACCEPT] senderId =',
      senderId,
      'receiver(userId) =',
      userId,
      'type =',
      'friend_accept'
    );

    await emitNotification(req.app.get('io') || null, {
      userId: senderId,
      senderId: userId,
      type: 'friend_accept',
    });

    // Emit socket event to update friend request count
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('friend_request_updated');
    }

    res.json({ success: true, message: 'Đã chấp nhận lời mời kết bạn', data: result });
  } catch (err) {
    console.error('acceptFriendRequest error:', err);
    res.status(400).json({ message: err.message });
  }
};

// POST /api/friendships/reject
export const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ message: 'friendId is required' });
    }

    const result = await FriendshipService.rejectFriendRequest(userId, friendId);

    // Emit socket event to update friend request count
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('friend_request_updated');
    }

    res.json(result);
  } catch (err) {
    console.error('rejectFriendRequest error:', err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// DELETE /api/friendships/unfriend
export const unfriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ message: 'friendId is required' });
    }

    const result = await FriendshipService.unfriend(userId, friendId);

    res.json(result);
  } catch (err) {
    console.error('unfriend error:', err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// DELETE /api/friendships/cancel
export const cancelFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ message: 'friendId is required' });
    }

    const result = await FriendshipService.cancelFriendRequest(userId, friendId);

    res.json(result);
  } catch (err) {
    console.error('cancelFriendRequest error:', err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// GET /api/friendships/status/:friendId
export const getFriendshipStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = Number(req.params.friendId);

    if (!friendId) {
      return res.status(400).json({ message: 'Invalid friendId' });
    }

    const result = await FriendshipService.getFriendshipStatus(userId, friendId);

    res.json(result);
  } catch (err) {
    console.error('getFriendshipStatus error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// GET /api/friendships/friends
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const friends = await FriendshipService.getFriends(userId, page, limit);

    res.json({
      success: true,
      data: friends,
      page,
      limit,
    });
  } catch (err) {
    console.error('getFriends error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// GET /api/friendships/pending
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const requests = await FriendshipService.getPendingRequests(userId, page, limit);

    res.json({
      success: true,
      data: requests,
      page,
      limit,
    });
  } catch (err) {
    console.error('getPendingRequests error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// GET /api/friendships/pending-count
export const getPendingRequestsCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await FriendshipService.getPendingRequestsCount(userId);

    res.json({
      success: true,
      count,
    });
  } catch (err) {
    console.error('getPendingRequestsCount error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// GET /api/friendships/sent
export const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const requests = await FriendshipService.getSentRequests(userId, page, limit);

    res.json({
      success: true,
      data: requests,
      page,
      limit,
    });
  } catch (err) {
    console.error('getSentRequests error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// GET /api/friendships/suggestions
export const getSuggestedFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    // lấy giới hạn nếu từ 1 đến 50 nếu không dùng hoặc truyền sai thì là 10
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Math.max(1, Math.min(Number.isFinite(limitRaw) ? limitRaw : 10, 50));

    const suggestions = await FriendshipService.getSuggestedFriends(userId, limit);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (err) {
    console.error('getSuggestedFriends error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// GET /api/friendships/count/:userId
export const getFriendsCount = async (req, res) => {
  try {
    const targetUserId = Number(req.params.userId);

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId'
      });
    }

    const count = await FriendshipService.getFriendsCount(targetUserId);

    res.json({
      success: true,
      count,
    });
  } catch (err) {
    console.error('getFriendsCount error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
