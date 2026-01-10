import axios from 'axios';
import { API_URL } from '../constants/api';

/**
 * Save call history to database
 * @param {number} receiverId - ID of the person you called/who called you
 * @param {string} callType - 'video' or 'voice'
 * @param {string} status - 'completed', 'missed', 'rejected', 'failed'
 * @param {number} duration - Duration in seconds (0 for missed/rejected)
 */
export const saveCallHistory = async (receiverId, callType, status, duration = 0) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return null;
    }

    const response = await axios.post(
      `${API_URL}/call-history`,
      {
        receiverId,
        callType,
        status,
        duration,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Save call history error:', error);
    return null;
  }
};

/**
 * Get call history between current user and another user
 * @param {number} userId - ID of the other user
 * @param {number} limit - Number of records to fetch
 */
export const getCallHistoryBetweenUsers = async (userId, limit = 50) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return [];
    }

    const response = await axios.get(
      `${API_URL}/call-history/${userId}?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data?.data || [];
  } catch (error) {
    console.error('Get call history error:', error);
    return [];
  }
};

/**
 * Get all call history for current user
 * @param {number} limit - Number of records to fetch
 */
export const getAllCallHistory = async (limit = 100) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return [];
    }

    const response = await axios.get(
      `${API_URL}/call-history?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data?.data || [];
  } catch (error) {
    console.error('Get call history error:', error);
    return [];
  }
};

/**
 * Get missed calls count
 */
export const getMissedCallsCount = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return 0;
    }

    const response = await axios.get(
      `${API_URL}/call-history/missed/count`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data?.count || 0;
  } catch (error) {
    console.error('Get missed calls count error:', error);
    return 0;
  }
};
