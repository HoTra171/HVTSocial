import { CallHistoryService } from '../services/callHistoryService.js';

/**
 * POST /api/call-history
 * Create a new call history record
 */
export const createCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiverId, callType, status, duration } = req.body;

    // Validation
    if (!receiverId || !callType || !status) {
      return res.status(400).json({
        success: false,
        message: 'receiverId, callType, and status are required',
      });
    }

    if (!['video', 'voice'].includes(callType)) {
      return res.status(400).json({
        success: false,
        message: 'callType must be "video" or "voice"',
      });
    }

    if (!['completed', 'missed', 'rejected', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status must be "completed", "missed", "rejected", or "failed"',
      });
    }

    const callHistory = await CallHistoryService.createCallHistory(
      userId,
      receiverId,
      callType,
      status,
      duration || 0
    );

    res.status(201).json({
      success: true,
      message: 'Call history created',
      data: callHistory,
    });
  } catch (error) {
    console.error('createCallHistory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /api/call-history/:userId
 * Get call history between current user and specified user
 */
export const getCallHistoryBetweenUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = Number(req.params.userId);
    const limit = Number(req.query.limit) || 50;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId',
      });
    }

    const history = await CallHistoryService.getCallHistoryBetweenUsers(
      currentUserId,
      otherUserId,
      limit
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('getCallHistoryBetweenUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /api/call-history
 * Get all call history for current user
 */
export const getCallHistoryForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || 100;

    const history = await CallHistoryService.getCallHistoryForUser(userId, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('getCallHistoryForUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /api/call-history/missed/count
 * Get missed calls count for current user
 */
export const getMissedCallsCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await CallHistoryService.getMissedCallsCount(userId);

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('getMissedCallsCount error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
