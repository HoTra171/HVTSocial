import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

// Parse DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createTestNotifications() {
  try {
    console.log('🔗 Connecting to Railway PostgreSQL...\n');

    // Get user ID 1 (your account)
    const userResult = await pool.query('SELECT id, full_name FROM users WHERE id = 1');

    if (userResult.rows.length === 0) {
      console.error('❌ User ID 1 not found');
      return;
    }

    const mainUser = userResult.rows[0];
    console.log(`👤 Creating notifications for: ${mainUser.full_name} (ID: ${mainUser.id})\n`);

    // Get some other users to act as notification senders
    const otherUsers = await pool.query('SELECT id, full_name FROM users WHERE id != 1 LIMIT 5');

    if (otherUsers.rows.length === 0) {
      console.error('❌ No other users found to create notifications from');
      return;
    }

    console.log('📝 Creating test notifications...\n');

    const notifications = [
      {
        user_id: mainUser.id,
        actor_id: otherUsers.rows[0].id,
        type: 'like',
        message: 'đã thích bài viết của bạn',
        target_type: 'post',
        target_id: 34,
        is_read: false,
      },
      {
        user_id: mainUser.id,
        actor_id: otherUsers.rows[1]?.id || otherUsers.rows[0].id,
        type: 'comment',
        message: 'đã bình luận: "Bài viết hay quá!"',
        target_type: 'post',
        target_id: 35,
        is_read: false,
      },
      {
        user_id: mainUser.id,
        actor_id: otherUsers.rows[2]?.id || otherUsers.rows[0].id,
        type: 'friend_request',
        message: 'đã gửi lời mời kết bạn',
        target_type: null,
        target_id: null,
        is_read: false,
      },
      {
        user_id: mainUser.id,
        actor_id: otherUsers.rows[3]?.id || otherUsers.rows[0].id,
        type: 'follow',
        message: 'đã bắt đầu theo dõi bạn',
        target_type: 'user',
        target_id: mainUser.id,
        is_read: true, // This one is already read
      },
      {
        user_id: mainUser.id,
        actor_id: otherUsers.rows[4]?.id || otherUsers.rows[0].id,
        type: 'like',
        message: 'đã thích bài viết của bạn',
        target_type: 'post',
        target_id: 36,
        is_read: false,
      },
    ];

    let count = 0;
    for (const notif of notifications) {
      const result = await pool.query(
        `INSERT INTO notifications
         (user_id, actor_id, type, message, target_type, target_id, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [
          notif.user_id,
          notif.actor_id,
          notif.type,
          notif.message,
          notif.target_type,
          notif.target_id,
          notif.is_read,
        ]
      );

      const sender = otherUsers.rows.find(u => u.id === notif.actor_id);
      console.log(`✅ Created: ${sender?.full_name} ${notif.message} (ID: ${result.rows[0].id})`);
      count++;
    }

    console.log(`\n🎉 Successfully created ${count} test notifications!\n`);

    // Show summary
    const summary = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_read = false) as unread,
        COUNT(*) FILTER (WHERE is_read = true) as read
       FROM notifications
       WHERE user_id = $1`,
      [mainUser.id]
    );

    console.log('📊 Summary:');
    console.log(`   Total: ${summary.rows[0].total}`);
    console.log(`   Unread: ${summary.rows[0].unread}`);
    console.log(`   Read: ${summary.rows[0].read}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    console.log('\n✅ Connection closed');
  }
}

createTestNotifications();
