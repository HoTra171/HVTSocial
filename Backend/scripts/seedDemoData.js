// scripts/seedDemoData.js
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

const DEMO_PASSWORD = 'demo123456';

// Vietnamese names
const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Võ', 'Phan', 'Trương', 'Bùi', 'Đặng', 'Đỗ', 'Ngô', 'Hồ', 'Dương'];
const middleNames = ['Văn', 'Thị', 'Hoàng', 'Minh', 'Thanh', 'Quốc', 'Anh', 'Hữu', 'Công', 'Đức'];
const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Hùng', 'Khánh', 'Long', 'Minh', 'Nam', 'Phong', 'Quang', 'Sơn', 'Tài', 'Thắng', 'Tuấn', 'Việt', 'Hoa', 'Lan', 'Mai', 'Ngọc', 'Thảo', 'Trang', 'Vy', 'Yến'];

// Post content templates
const postTemplates = [
  'Hôm nay là một ngày tuyệt vời! ☀️',
  'Cuối tuần rồi, ai đi chơi không? 🎉',
  'Vừa hoàn thành project mới, cảm thấy rất vui! 💪',
  'Chia sẻ với mọi người khoảnh khắc đẹp này 📸',
  'Cuộc sống thật tuyệt vời! ❤️',
  'Đang học coding, cảm thấy rất thú vị 💻',
  'Coffee và code, combo hoàn hảo ☕',
  'Sunset view hôm nay đẹp quá! 🌅',
  'Just finished a great book! 📚',
  'Working from home today 🏠',
  'Exploring new places! 🌍',
  'Good vibes only ✨',
  'Never stop learning 📖',
  'Weekend mood 😎',
  'Grateful for everything 🙏',
];

const commentTemplates = [
  'Tuyệt vời quá! 👍',
  'Đẹp quá bạn ơi!',
  'Thích lắm!',
  'Amazing! ✨',
  'Great post!',
  'Wow, beautiful! 😍',
  'Keep it up! 💪',
  'Love this! ❤️',
  'So cool!',
  'Nice one!',
];

const getRandomAvatar = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
const getRandomPostImage = () => {
  const pics = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  ];
  return pics[Math.floor(Math.random() * pics.length)];
};

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Universal query helper via pool.request()
async function executeQuery(sqlText, params = {}) {
  const req = pool.request();
  for (const [key, val] of Object.entries(params)) {
    req.input(key, val);
  }
  const res = await req.query(sqlText);
  return res.recordset || res.rows || [];
}

async function seedData() {
  console.log('🌱 Starting demo data seed...');
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Create users
  console.log('👤 Creating users...');
  const userIds = [];
  for (let i = 1; i <= 20; i++) {
    const fullName = `${randomElement(firstNames)} ${randomElement(middleNames)} ${randomElement(lastNames)}`;
    const username = `user${i}`;
    const email = `user${i}@demo.com`;
    const avatar = getRandomAvatar(username);
    const bio = `Xin chào! Mình là ${fullName.split(' ').pop()} 👋`;

    try {
      const existing = await executeQuery('SELECT id FROM users WHERE email = @email', { email });
      if (existing.length > 0) {
        userIds.push(existing[0].id);
        continue;
      }

      await executeQuery(
        `INSERT INTO users (full_name, username, email, password, avatar, bio, created_at)
         VALUES (@fullName, @username, @email, @password, @avatar, @bio, GETDATE())`,
        {
          fullName,
          username,
          email,
          password: hashedPassword,
          avatar,
          bio,
        }
      );

      const created = await executeQuery('SELECT id FROM users WHERE email = @email', { email });
      if (created.length > 0) {
        userIds.push(created[0].id);
      }
    } catch (err) {
      console.log(`User ${i} skipped:`, err.message);
    }
  }

  // Get all user IDs
  const allUsersResult = await executeQuery('SELECT id FROM users ORDER BY id');
  const allUserIds = allUsersResult.map((r) => r.id);
  console.log(`✅ Total users available: ${allUserIds.length}`);

  if (allUserIds.length < 2) {
    console.log('Not enough users. Exiting.');
    process.exit(0);
  }

  // 2. Create friendships
  console.log('🤝 Creating friendships...');
  let friendshipCount = 0;
  for (let i = 0; i < Math.min(allUserIds.length, 15); i++) {
    const numFriends = randomInt(2, 5);
    for (let j = 0; j < numFriends; j++) {
      const friendId = allUserIds[randomInt(0, allUserIds.length - 1)];
      if (friendId !== allUserIds[i]) {
        try {
          const check = await executeQuery(
            `SELECT id FROM friendships 
             WHERE (user_id = @u1 AND friend_id = @u2) OR (user_id = @u2 AND friend_id = @u1)`,
            { u1: allUserIds[i], u2: friendId }
          );
          if (check.length === 0) {
            await executeQuery(
              `INSERT INTO friendships (user_id, friend_id, status, created_at)
               VALUES (@u1, @u2, 'accepted', GETDATE())`,
              { u1: allUserIds[i], u2: friendId }
            );
            friendshipCount++;
          }
        } catch {
          // ignore duplicate
        }
      }
    }
  }
  console.log(`✅ Created ${friendshipCount} friendships`);

  // 3. Create posts
  console.log('📝 Creating posts...');
  const postIds = [];
  for (let i = 0; i < 30; i++) {
    const userId = allUserIds[randomInt(0, allUserIds.length - 1)];
    const content = randomElement(postTemplates);
    const hasImage = Math.random() > 0.4;
    const mediaUrl = hasImage ? getRandomPostImage() : null;

    try {
      await executeQuery(
        `INSERT INTO posts (user_id, content, media, media_url, status, visibility, created_at)
         VALUES (@userId, @content, @mediaUrl, @mediaUrl, 'public', 'public', GETDATE())`,
        {
          userId,
          content,
          mediaUrl,
        }
      );
    } catch (err) {
      console.log(`Post ${i} error:`, err.message);
    }
  }

  const postsResult = await executeQuery('SELECT id FROM posts ORDER BY id');
  postIds.push(...postsResult.map((p) => p.id));
  console.log(`✅ Total posts available: ${postIds.length}`);

  // 4. Create likes
  console.log('❤️ Creating likes...');
  let likeCount = 0;
  for (const postId of postIds) {
    const numLikes = randomInt(2, 8);
    for (let i = 0; i < numLikes; i++) {
      const userId = allUserIds[randomInt(0, allUserIds.length - 1)];
      try {
        const check = await executeQuery(
          'SELECT id FROM likes WHERE post_id = @postId AND user_id = @userId',
          { postId, userId }
        );
        if (check.length === 0) {
          await executeQuery(
            'INSERT INTO likes (post_id, user_id) VALUES (@postId, @userId)',
            { postId, userId }
          );
          likeCount++;
        }
      } catch {
        // ignore duplicate
      }
    }
  }
  console.log(`✅ Created ${likeCount} likes`);

  // 5. Create comments
  console.log('💬 Creating comments...');
  let commentCount = 0;
  for (const postId of postIds) {
    const numComments = randomInt(1, 4);
    for (let i = 0; i < numComments; i++) {
      const userId = allUserIds[randomInt(0, allUserIds.length - 1)];
      const content = randomElement(commentTemplates);
      try {
        await executeQuery(
          `INSERT INTO comments (post_id, user_id, content, created_at)
           VALUES (@postId, @userId, @content, GETDATE())`,
          { postId, userId, content }
        );
        commentCount++;
      } catch (err) {
        console.log('Comment error:', err.message);
      }
    }
  }
  console.log(`✅ Created ${commentCount} comments`);

  console.log('\n🎉 Demo data seeding complete!');
  console.log(`
=========================================
Demo Accounts:
- user1@demo.com  đến  user20@demo.com
- Mật khẩu: ${DEMO_PASSWORD}
=========================================
  `);

  process.exit(0);
}

seedData().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
