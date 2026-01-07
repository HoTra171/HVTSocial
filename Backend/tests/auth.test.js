import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';

// 1. Mock DB Wrapper
const mockRequest = {
  input: jest.fn().mockReturnThis(),
  query: jest.fn(),
};

const mockPool = {
  request: jest.fn(() => mockRequest),
  connect: jest.fn(),
};

jest.unstable_mockModule('../config/db-wrapper.js', () => ({
  db: mockPool,
  getDb: () => mockPool,
}));

// 2. Import app (dynamic)
const authRoutes = (await import('../routes/authRoutes.js')).default;

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    test('Success: Should create user and return 201', async () => {
      // 1. Mock Check User (Return empty -> User not exists)
      mockRequest.query.mockResolvedValueOnce({ recordset: [] });

      // 2. Mock Insert User (Return ID/User)
      // Controller uses RETURNING * so it returns the user
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ id: 1, full_name: 'Test', username: 'test', email: 'test@e.com', role: 'user' }]
      });

      const res = await request(app).post('/api/auth/register').send({
        username: 'test',
        email: 'test@e.com',
        password: 'Pass123!',
        full_name: 'Test',
      });

      // Verify
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockRequest.query).toHaveBeenCalledTimes(2);
    });

    test('Fail: Duplicate Email (400)', async () => {
      // Mock Check User (Return existing user)
      // Controller checks if existing.email === input.email
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ id: 1, email: 'test@e.com' }]
      });

      const res = await request(app).post('/api/auth/register').send({
        username: 'test',
        email: 'test@e.com',
        password: 'Pass123!',
        full_name: 'Test',
      });

      expect(res.status).toBe(400); // Controller returns 400 for duplicate
      expect(res.body.message).toMatch(/sử dụng/i);
    });
  });

  describe('POST /login', () => {
    test('Success: Should return tokens', async () => {
      const hashedPassword = await bcrypt.hash('Pass123!', 10);

      // 1. Mock Find User
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{
          id: 1,
          username: 'test',
          email: 'test@e.com',
          password: hashedPassword, // Column name is 'password' in simple select *
          role: 'user',
          avatar_url: 'http://pic.com'
        }]
      });

      // 2. Mock Save Refresh Token (inside generateTokens)
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@e.com',
        password: 'Pass123!',
      });

      if (res.status !== 200) {
        console.error('Login Failed Response:', res.body);
      }

      expect(res.status).toBe(200);
      // Backend uses successResponse (data wrapping?)
      // Check implementation: successResponse(res, { user, token, ... })
      // Usually { success: true, data: { ... } }
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    test('Fail: Wrong Password (401)', async () => {
      const hashedPassword = await bcrypt.hash('Pass123!', 10);

      // Mock Find User
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{
          id: 1,
          username: 'test',
          email: 'test@e.com',
          password: hashedPassword
        }]
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@e.com',
        password: 'WrongPass!',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /refresh', () => {
    test('Success: Should rotate tokens', async () => {
      // 1. Mock Verify Token DB (Find Token)
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{
          id: 99,
          user_id: 1,
          token: 'valid_refresh_token',
          expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000), // Valid
          revoked: false
        }]
      });

      // 2. Mock Find User (required by controller)
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ id: 1, username: 'test', email: 'test@e.com' }]
      });

      // 3. Mock Insert New Token (generateTokens)
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      // 4. Mock Update Old Token (Revoked) - Wait, in controller:
      //    db.request()...query(UPDATE refreshed_tokens SET revoked=1, replaced_by...)
      // Check order in controller:
      // 1. Find Token
      // 2. Get User
      // 3. Generate New Token (Insert)
      // 4. Update Old Token
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app).post('/api/auth/refresh').send({
        refreshToken: 'valid_refresh_token'
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });
  });

  describe('POST /logout', () => {
    test('Success: Should revoke token', async () => {
      // Mock Revoke Token
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });

      const res = await request(app).post('/api/auth/logout').send({
        refreshToken: 'token_to_revoke'
      });

      expect(res.status).toBe(200);
    });
  });
});
