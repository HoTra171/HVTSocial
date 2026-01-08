/**
 * Test script for unread notification count query
 * Run: node test-unread-count.js
 */

import { db } from './config/db-wrapper.js';

async function testUnreadCount() {
  try {
    console.log('Testing unread count query...\n');

    // Test với userId = 1 (thay đổi nếu cần)
    const userId = 1;

    const result = await db.request().input('userId', userId).query(`
        SELECT COUNT(*) AS unread_count
        FROM notifications
        WHERE user_id = @userId
          AND is_read = false
      `);

    console.log('✅ Query executed successfully!');
    console.log('Result:', result.recordset[0]);
    console.log('\nUnread count:', result.recordset[0].unread_count);

    // Test query với is_read = true để so sánh
    const resultRead = await db.request().input('userId', userId).query(`
        SELECT COUNT(*) AS read_count
        FROM notifications
        WHERE user_id = @userId
          AND is_read = true
      `);

    console.log('Read count:', resultRead.recordset[0].read_count);

    // Test total
    const resultTotal = await db.request().input('userId', userId).query(`
        SELECT COUNT(*) AS total_count
        FROM notifications
        WHERE user_id = @userId
      `);

    console.log('Total count:', resultTotal.recordset[0].total_count);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

testUnreadCount();
