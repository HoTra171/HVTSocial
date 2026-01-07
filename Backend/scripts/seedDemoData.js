// scripts/seedDemoData.js
// Run: DB_DRIVER=postgres node scripts/seedDemoData.js
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
    'weekend mood 😎',
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

// Random images
const getRandomAvatar = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
const getRandomPostImage = () => {
    const topics = ['nature', 'city', 'food', 'travel', 'technology', 'people', 'architecture'];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    return `https://source.unsplash.com/800x600/?${topic}&sig=${Math.random()}`;
};

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedData() {
    console.log('🌱 Starting demo data seed...');

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    // Direct PostgreSQL queries
    const userIds = [];

    // 1. Create 50 demo users
    console.log('👤 Creating users...');
    for (let i = 1; i <= 50; i++) {
        const fullName = `${randomElement(firstNames)} ${randomElement(middleNames)} ${randomElement(lastNames)}`;
        const username = `user${i}_${Date.now() % 10000}`;
        const email = `user${i}@demo.com`;
        const avatar = getRandomAvatar(username);
        const bio = `Xin chào! Mình là ${fullName.split(' ').pop()} 👋`;

        try {
            const result = await pool.query(
                `INSERT INTO users (full_name, username, email, password, avatar, bio)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
                [fullName, username, email, hashedPassword, avatar, bio]
            );
            if (result.rows.length > 0) {
                userIds.push(result.rows[0].id);
            }
        } catch (err) {
            console.log(`User ${i} skipped:`, err.message);
        }
    }
    console.log(`✅ Created ${userIds.length} new users`);

    // Get all user IDs including existing ones
    const allUsersResult = await pool.query(`SELECT id FROM users ORDER BY id`);
    const allUserIds = allUsersResult.rows.map(r => r.id);
    console.log(`📊 Total users available: ${allUserIds.length}`);

    if (allUserIds.length < 2) {
        console.log('Not enough users. Exiting.');
        process.exit(0);
    }

    // 2. Create friendships
    console.log('🤝 Creating friendships...');
    let friendshipCount = 0;
    for (let i = 0; i < Math.min(allUserIds.length, 30); i++) {
        const numFriends = randomInt(3, 8);
        for (let j = 0; j < numFriends; j++) {
            const friendId = allUserIds[randomInt(0, allUserIds.length - 1)];
            if (friendId !== allUserIds[i]) {
                try {
                    await pool.query(
                        `INSERT INTO friendships (user_id, friend_id, status)
             VALUES ($1, $2, 'accepted')
             ON CONFLICT DO NOTHING`,
                        [allUserIds[i], friendId]
                    );
                    friendshipCount++;
                } catch (err) { /* duplicate */ }
            }
        }
    }
    console.log(`✅ Created ${friendshipCount} friendships`);

    // 3. Create posts
    console.log('📝 Creating posts...');
    const postIds = [];
    for (let i = 0; i < 100; i++) {
        const userId = allUserIds[randomInt(0, allUserIds.length - 1)];
        const content = randomElement(postTemplates);
        const hasImage = Math.random() > 0.3;
        const mediaUrl = hasImage ? getRandomPostImage() : null;

        try {
            const result = await pool.query(
                `INSERT INTO posts (user_id, content, media_url, visibility)
         VALUES ($1, $2, $3, 'public')
         RETURNING id`,
                [userId, content, mediaUrl]
            );
            postIds.push(result.rows[0].id);
        } catch (err) {
            console.log(`Post ${i} error:`, err.message);
        }
    }
    console.log(`✅ Created ${postIds.length} posts`);

    // 4. Create likes
    console.log('❤️ Creating likes...');
    let likeCount = 0;
    for (const postId of postIds) {
        const numLikes = randomInt(5, 25);
        for (let i = 0; i < numLikes; i++) {
            const userId = allUserIds[randomInt(0, allUserIds.length - 1)];
            try {
                await pool.query(
                    `INSERT INTO likes (post_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
                    [postId, userId]
                );
                likeCount++;
            } catch (err) { /* duplicate */ }
        }
    }
    console.log(`✅ Created ${likeCount} likes`);

    // 5. Create comments
    console.log('💬 Creating comments...');
    let commentCount = 0;
    for (const postId of postIds) {
        const numComments = randomInt(2, 8);
        for (let i = 0; i < numComments; i++) {
            const userId = allUserIds[randomInt(0, allUserIds.length - 1)];
            const content = randomElement(commentTemplates);
            try {
                await pool.query(
                    `INSERT INTO comments (post_id, user_id, content)
           VALUES ($1, $2, $3)`,
                    [postId, userId, content]
                );
                commentCount++;
            } catch (err) {
                console.log(`Comment error:`, err.message);
            }
        }
    }
    console.log(`✅ Created ${commentCount} comments`);

    console.log('\n🎉 Demo data seeding complete!');
    console.log(`
Summary:
- New Users: ${userIds.length}
- Total Users: ${allUserIds.length}
- Posts: ${postIds.length}  
- Likes: ${likeCount}
- Comments: ${commentCount}
- Friendships: ${friendshipCount}

Demo accounts: user1@demo.com to user50@demo.com
Password: ${DEMO_PASSWORD}
  `);

    process.exit(0);
}

seedData().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});
