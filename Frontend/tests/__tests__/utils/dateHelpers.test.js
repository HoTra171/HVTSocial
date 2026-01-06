import { describe, it, expect } from 'vitest';
import { safeFromNow, dayjs } from '../../src/utils/dateHelpers.js';

describe('dateHelpers', () => {
  describe('safeFromNow', () => {
    it('should return empty string for null date', () => {
      expect(safeFromNow(null)).toBe('');
    });

    it('should return empty string for undefined date', () => {
      expect(safeFromNow(undefined)).toBe('');
    });

    it('should return relative time for valid date', () => {
      const now = new Date();
      const result = safeFromNow(now);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle past dates', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = safeFromNow(yesterday);
      expect(result).toContain('trước'); // Vietnamese locale
    });

    it('should handle invalid dates gracefully', () => {
      const result = safeFromNow('invalid-date');
      expect(result).toBe('');
    });
  });

  describe('dayjs export', () => {
    it('should export dayjs instance', () => {
      expect(dayjs).toBeDefined();
      expect(typeof dayjs).toBe('function');
    });

    it('should format dates correctly', () => {
      const date = new Date('2024-01-01');
      const formatted = dayjs(date).format('YYYY-MM-DD');
      expect(formatted).toBe('2024-01-01');
    });
  });
});
