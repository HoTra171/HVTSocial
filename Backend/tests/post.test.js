import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// 1. Setup Mocks
const mockRequest = {
  input: jest.fn().mockReturnThis(),
  query: jest.fn(),
};

const mockPool = {
  request: jest.fn(() => mockRequest),
  connect: jest.fn(),
};

// Mock DB (for updatePost which uses pool directly)
jest.unstable_mockModule('../config/db.js', () => ({
  pool: mockPool,
  getPool: () => mockPool,
}));

// Mock PostService (for create/get methods)
const mockPostService = {
  getFeed: jest.fn(),
  getPostsByUser: jest.fn(),
  getPostById: jest.fn(),
  createPost: jest.fn(),
  deletePost: jest.fn(),
};

jest.unstable_mockModule('../services/postService.js', () => ({
  PostService: mockPostService
}));

// 2. Import app
const postRoutes = (await import('../routes/postRoutes.js')).default;
// Helper function to create test app with auth middleware
const authMiddleware = (await import('../middlewares/authMiddleware.js')).default;

const app = express();
app.use(express.json());

// Mock user injection via middleware for testing
app.use((req, res, next) => {
  // If authorization header exists, we trust it for unit test isolation 
  // (middleware logic is tested separately or we assume it works as it uses jwt.verify)
  if (req.headers.authorization) {
    // Manually decode to skip DB checks if any
    try {
      const token = req.headers.authorization.split(' ')[1];
      // In Unit Test, we can mock the middleware or just let it run if it is pure logic
      // authMiddleware uses jwt.verify(process.env.JWT_SECRET)
    } catch (e) { }
  }
  next();
});

// Actually use the real authMiddleware? 
// It requires process.env.JWT_SECRET.
app.use('/api/posts', authMiddleware, postRoutes);

describe('Post Controller Unit Tests', () => {
  const TEST_SECRET = 'test-secret-key';
  let validToken;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = TEST_SECRET;
    validToken = jwt.sign({ id: 1, userId: 1, email: 'test@e.com', username: 'test' }, TEST_SECRET, { expiresIn: '1h' });
  });

  describe('POST /', () => {
    test('Success: Should create post', async () => {
      const newPost = { id: 10, content: 'Hello World', user_id: 1, status: 'public' };
      mockPostService.createPost.mockResolvedValue(newPost);

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'Hello World', privacy: 'public' });

      expect(res.status).toBe(200);
      expect(res.body.post).toEqual(newPost);
      expect(mockPostService.createPost).toHaveBeenCalledWith(1, 'Hello World', null, 'public');
    });

    test('Fail: No content', async () => {
      // Logic handled by controller or DB constraint. 
      // Controller doesn't validate content presence explicitly in code (Step 1275), 
      // but DB would fail. Service mock can throw.
      mockPostService.createPost.mockRejectedValue(new Error('Content required'));

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: '', privacy: 'public' });

      expect(res.status).toBe(500); // Controller catches and returns 500
    });
  });

  describe('GET /', () => {
    test('Success: Get Feed', async () => {
      const feedData = {
        posts: [{ id: 1, content: 'Feed' }],
        nextCursor: '2023-01-01'
      };
      mockPostService.getFeed.mockResolvedValue(feedData);

      const res = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(feedData);
      expect(mockPostService.getFeed).toHaveBeenCalled();
    });
  });

  describe('PUT /:id', () => {
    test('Success: Update Post', async () => {
      // Controller calls:
      // 1. Check Ownership (pool.request)
      // 2. Update (pool.request)

      // Mock Check Ownership
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ id: 1 }]
      });

      // Mock Update
      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ id: 1, content: 'Updated' }]
      });

      const res = await request(app)
        .put('/api/posts/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'Updated', status: 'public' });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Updated');
    });

    test('Fail: Not Owner', async () => {
      // Mock Check Ownership (Empty)
      mockRequest.query.mockResolvedValueOnce({
        recordset: []
      });

      const res = await request(app)
        .put('/api/posts/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ content: 'Try' });

      expect(res.status).toBe(403);
    });
  });
});
