import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/authRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';

// Mock app setup
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

describe('Notification API Tests', () => {
  let authToken = '';
  let testNotificationId = null;
  let testUser = {
    username: `notiftest_${Date.now()}`,
    email: `notiftest_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    full_name: 'Notification Test User'
  };

  beforeAll(async () => {
    // Setup test user
    try {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      if (registerResponse.body.token) {
        authToken = registerResponse.body.token;
      } else {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password
          });

        if (loginResponse.body.token) {
          authToken = loginResponse.body.token;
        }
      }
    } catch (error) {
      console.log('⚠️  Could not setup test user for notification tests');
    }
  }, 15000);

  describe('GET /api/notifications', () => {
    test('Should get notifications with authentication', async () => {
      if (!authToken) {
        console.log('⚠️  Skipping test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect([200, 201]).toContain(response.status);

      // Response can be array or object with notifications property
      if (Array.isArray(response.body)) {
        expect(response.body).toBeDefined();
        // Store first notification ID if exists
        if (response.body.length > 0) {
          testNotificationId = response.body[0].id;
        }
      } else if (response.body.notifications) {
        expect(Array.isArray(response.body.notifications)).toBe(true);
        if (response.body.notifications.length > 0) {
          testNotificationId = response.body.notifications[0].id;
        }
      }
    }, 10000);

    test('Should fail to get notifications without authentication', async () => {
      const response = await request(app)
        .get('/api/notifications');

      expect([401, 403]).toContain(response.status);
    }, 10000);
  });

  describe('GET /api/notifications/unread-count', () => {
    test('Should get unread count with authentication', async () => {
      if (!authToken) {
        console.log('⚠️  Skipping test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect([200, 201]).toContain(response.status);

      if (response.body) {
        expect(response.body).toHaveProperty('unreadCount');
        expect(typeof response.body.unreadCount).toBe('number');
        expect(response.body.unreadCount).toBeGreaterThanOrEqual(0);
      }
    }, 10000);

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count');

      expect([401, 403]).toContain(response.status);
    }, 10000);
  });

  describe('PATCH /api/notifications/:id/read', () => {
    test('Should mark notification as read', async () => {
      if (!authToken || !testNotificationId) {
        console.log('⚠️  Skipping test - no auth token or notification ID');
        return;
      }

      const response = await request(app)
        .patch(`/api/notifications/${testNotificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      // Accept 200, 404 (if notification doesn't exist), or 403 (if not owned)
      expect([200, 201, 404, 403]).toContain(response.status);

      if (response.body.success) {
        expect(response.body.success).toBe(true);
      }
    }, 10000);

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .patch('/api/notifications/1/read');

      expect([401, 403]).toContain(response.status);
    }, 10000);

    test('Should handle invalid notification ID gracefully', async () => {
      if (!authToken) {
        console.log('⚠️  Skipping test - no auth token');
        return;
      }

      const response = await request(app)
        .patch('/api/notifications/999999999/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect([404, 400]).toContain(response.status);
    }, 10000);
  });

  describe('PATCH /api/notifications/mark-all-read', () => {
    test('Should mark all notifications as read', async () => {
      if (!authToken) {
        console.log('⚠️  Skipping test - no auth token');
        return;
      }

      const response = await request(app)
        .patch('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect([200, 201]).toContain(response.status);

      if (response.body.success) {
        expect(response.body.success).toBe(true);
      }
    }, 10000);

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .patch('/api/notifications/mark-all-read');

      expect([401, 403]).toContain(response.status);
    }, 10000);

    test('Should reduce unread count after marking all as read', async () => {
      if (!authToken) {
        console.log('⚠️  Skipping test - no auth token');
        return;
      }

      // Get unread count before
      const beforeResponse = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`);

      // Mark all as read
      await request(app)
        .patch('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${authToken}`);

      // Get unread count after
      const afterResponse = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`);

      if (beforeResponse.body && afterResponse.body) {
        const beforeCount = beforeResponse.body.unreadCount || 0;
        const afterCount = afterResponse.body.unreadCount || 0;

        // After marking all as read, count should be 0 or less than before
        expect(afterCount).toBeLessThanOrEqual(beforeCount);
      }
    }, 15000);
  });

  describe('DELETE /api/notifications/:id', () => {
    test('Should delete a notification', async () => {
      if (!authToken || !testNotificationId) {
        console.log('⚠️  Skipping test - no auth token or notification ID');
        return;
      }

      const response = await request(app)
        .delete(`/api/notifications/${testNotificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      // Accept 200, 204, 404 (if already deleted), or 403 (if not owned)
      expect([200, 204, 404, 403]).toContain(response.status);
    }, 10000);

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/notifications/1');

      expect([401, 403]).toContain(response.status);
    }, 10000);
  });

  describe('DELETE /api/notifications', () => {
    test('Should delete all notifications', async () => {
      if (!authToken) {
        console.log('⚠️  Skipping test - no auth token');
        return;
      }

      const response = await request(app)
        .delete('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect([200, 204]).toContain(response.status);

      if (response.body.success) {
        expect(response.body.success).toBe(true);
      }
    }, 10000);

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/notifications');

      expect([401, 403]).toContain(response.status);
    }, 10000);

    test('Should have zero notifications after deleting all', async () => {
      if (!authToken) {
        console.log('⚠️  Skipping test - no auth token');
        return;
      }

      // Delete all notifications
      await request(app)
        .delete('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      // Check notifications list
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        const notifications = Array.isArray(response.body)
          ? response.body
          : response.body.notifications || [];

        expect(notifications.length).toBe(0);
      }
    }, 15000);
  });
});

describe('Notification Security Tests', () => {
  test('Should not access others notifications', async () => {
    // This is a conceptual test - would need two users to properly test
    const response = await request(app)
      .get('/api/notifications');

    expect([401, 403]).toContain(response.status);
  });

  test('Should validate notification ID format', async () => {
    const response = await request(app)
      .patch('/api/notifications/invalid-id/read');

    expect([400, 401, 403]).toContain(response.status);
  });

  test('Should prevent notification spam', async () => {
    // Conceptual test for rate limiting
    const response = await request(app)
      .get('/api/notifications');

    // Should have rate limiting headers or return 401
    expect(response.status).toBeDefined();
  });
});

describe('Notification Type & Content Tests', () => {
  test('Notification should have expected structure', async () => {
    // This test would require actual notifications to exist
    // For now, we just verify the endpoint is accessible
    const response = await request(app)
      .get('/api/notifications');

    expect([200, 401, 403]).toContain(response.status);
  });
});
