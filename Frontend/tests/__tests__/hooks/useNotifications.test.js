import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications } from '../../../src/hooks/useNotifications.js';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useNotifications', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
  };

  const mockUser = {
    id: 1,
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useNotifications(mockSocket, mockUser));

    expect(result.current.loading).toBe(true);
    expect(result.current.notifications).toEqual([]);
  });

  it('should fetch notifications on mount', async () => {
    const mockNotifications = [
      { id: 1, content: 'Test notification', status: 'unread' },
    ];

    axios.get.mockResolvedValueOnce({
      data: { success: true, data: mockNotifications },
    });

    const { result } = renderHook(() => useNotifications(mockSocket, mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toEqual(mockNotifications);
  });

  it('should handle fetch errors gracefully', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useNotifications(mockSocket, mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toEqual([]);
  });

  it('should setup socket listeners', () => {
    renderHook(() => useNotifications(mockSocket, mockUser));

    expect(mockSocket.on).toHaveBeenCalledWith(
      'new_notification',
      expect.any(Function)
    );
  });

  it('should cleanup socket listeners on unmount', () => {
    const { unmount } = renderHook(() => useNotifications(mockSocket, mockUser));

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith(
      'new_notification',
      expect.any(Function)
    );
  });
});
