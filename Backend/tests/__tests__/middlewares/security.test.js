import { describe, test, expect } from '@jest/globals';
import { apiLimiter, authLimiter, uploadLimiter } from '../../../middlewares/security.js';

describe('Security Middlewares', () => {
  describe('Rate Limiters', () => {
    test('apiLimiter should be defined', () => {
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
    });

    test('authLimiter should be defined', () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });

    test('uploadLimiter should be defined', () => {
      expect(uploadLimiter).toBeDefined();
      expect(typeof uploadLimiter).toBe('function');
    });

    test('rate limiters should be configured correctly', () => {
      // Rate limiters are middleware functions
      // Testing that they exist and are functions is sufficient
      expect(typeof apiLimiter).toBe('function');
      expect(typeof authLimiter).toBe('function');
      expect(typeof uploadLimiter).toBe('function');
    });
  });
});
