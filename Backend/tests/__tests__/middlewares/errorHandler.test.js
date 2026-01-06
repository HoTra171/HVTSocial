import { describe, test, expect, jest } from '@jest/globals';
import { errorHandler, notFoundHandler } from '../../../middlewares/errorHandler.js';
import httpMocks from 'node-mocks-http';

describe('Error Handler Middleware', () => {
  describe('errorHandler', () => {
    test('should handle errors with default status code 500', () => {
      const error = new Error('Test error');
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.statusCode).toBe(500);
      const data = res._getJSONData();
      expect(data.success).toBe(false);
      expect(data.message).toBeDefined();
    });

    test('should use custom status code if provided', () => {
      const error = new Error('Not found');
      error.statusCode = 404;

      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.statusCode).toBe(404);
    });

    test('should log error information', () => {
      const error = new Error('Test error');
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/test',
        ip: '127.0.0.1',
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      // Should not throw
      expect(() => {
        errorHandler(error, req, res, next);
      }).not.toThrow();
    });
  });

  describe('notFoundHandler', () => {
    test('should create 404 error for unknown routes', () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/unknown-route',
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('/unknown-route');
    });
  });
});
