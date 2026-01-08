import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3000/api';

async function testNotificationsAPI() {
  try {
    console.log('🔐 Logging in...\n');

    // Login to get token
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'trabn1712003@gmail.com',
      password: 'trabn1712003',
    });

    if (!loginRes.data?.success) {
      console.error('❌ Login failed');
      return;
    }

    const token = loginRes.data.data.token;
    console.log('✅ Logged in successfully\n');

    // Get notifications
    console.log('📬 Fetching notifications...\n');
    const notifRes = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!notifRes.data?.success) {
      console.error('❌ Failed to fetch notifications');
      return;
    }

    const notifications = notifRes.data.data;
    console.log(`Total notifications: ${notifications.length}\n`);

    if (notifications.length > 0) {
      console.log('Notification details:');
      console.log('─'.repeat(80));
      notifications.forEach((n, i) => {
        const status = n.status === 'read' ? '✓' : '○';
        console.log(
          `${i + 1}. [${status}] ${n.sender_name || 'Unknown'}: ${n.content} (${n.type})`
        );
        console.log(`   Created: ${new Date(n.created_at).toLocaleString()}`);
        if (n.post_id) console.log(`   Post ID: ${n.post_id}`);
        console.log('');
      });
    } else {
      console.log('No notifications found.');
    }

    // Get unread count
    const countRes = await axios.get(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(`🔔 Unread notifications: ${countRes.data.count}\n`);

    // Test mark one as read
    if (notifications.length > 0 && notifications[0].status === 'unread') {
      const firstUnread = notifications.find((n) => n.status === 'unread');
      if (firstUnread) {
        console.log(`📖 Marking notification #${firstUnread.id} as read...`);
        await axios.patch(
          `${API_URL}/notifications/${firstUnread.id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Marked as read\n');

        // Get updated count
        const newCountRes = await axios.get(`${API_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(`🔔 Updated unread count: ${newCountRes.data.count}\n`);
      }
    }

    console.log('✅ All tests passed!');
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ Server not responding. Is the backend running on port 3000?');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testNotificationsAPI();
