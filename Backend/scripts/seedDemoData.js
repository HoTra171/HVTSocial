// scripts/seedDemoData.js
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

const DEMO_PASSWORD = 'demo123456';

// Vietnamese demo users info
const demoUsersList = [
  { username: 'lan_nguyen', name: 'Nguyễn Thị Lan', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', bio: 'Yêu âm nhạc, nhiếp ảnh và cà phê sáng ☕' },
  { username: 'duc_anh', name: 'Trần Đức Anh', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', bio: 'Software Engineer @ Hanoi | Đam mê công nghệ & du lịch 💻✈️' },
  { username: 'mai_le', name: 'Lê Thuỳ Mai', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', bio: 'Cuộc sống là những chuyến đi! Sống trọn vẹn từng khoảnh khắc ✨' },
  { username: 'hoang_nam', name: 'Hoàng Nam', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', bio: 'Runner | Gym & Healthy lifestyle 💪' },
  { username: 'thao_vy', name: 'Phạm Thảo Vy', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', bio: 'Design & Art Lover 🎨 | Trao đi yêu thương' },
  { username: 'quoc_bao', name: 'Đặng Quốc Bảo', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', bio: 'Khởi nghiệp công nghệ | Kết nối cùng phát triển 🚀' },
  { username: 'ngoc_anh', name: 'Vũ Ngọc Ánh', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', bio: 'Mỗi ngày là một cơ hội mới để học hỏi và tốt hơn hôm qua 🌸' },
  { username: 'minh_tri', name: 'Bùi Minh Trí', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400', bio: 'Foodie 🍜 | Thích nấu ăn và khám phá ẩm thực bốn phương' },
  { username: 'huong_giang', name: 'Đỗ Hương Giang', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', bio: 'Marketing specialist 📈 | Coffee & books' },
  { username: 'tien_dung', name: 'Ngô Tiến Dũng', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400', bio: 'Photography 📸 | Chụp lại những khoảnh khắc đẹp của cuộc đời' }
];

// Rich post templates with high quality Unsplash photos
const postTemplates = [
  {
    content: 'Cuối tuần dạo phố Hà Nội mùa thu thật sự tuyệt vời! Không khí se lạnh, nắng vàng ươm dịu nhẹ qua từng con phố cổ. Ai rảnh ra hồ Gươm làm cốc cà phê trứng nhé! 🍂☕',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000'
  },
  {
    content: 'Vừa hoàn thành dự án HVTSocial sau nhiều tuần nỗ lực! Cảm ơn cả team đã cùng nhau vượt qua bao đêm debug và triển khai. Tự hào về thành quả này! 💪🚀🎉',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000'
  },
  {
    content: 'Một buổi sáng trong lành tại Đà Lạt. Tiếng thông reo và tách trà nóng thơm nồng đánh thức mọi giác quan. Chúc mọi người ngày mới an yên và tràn đầy năng lượng tích cực! 🌲☀️',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1000'
  },
  {
    content: 'Coding combo yêu thích: 1 chiếc Mac, 1 ly cold brew và playlist Lofi chill. Hôm nay giải quyết xong hết bug backlog rồi nhé! 💻🎧',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000'
  },
  {
    content: 'Hoàng hôn Phú Quốc hôm nay đẹp ngỡ ngàng. Đôi khi chỉ cần ngồi yên lắng nghe tiếng sóng vỗ cũng đủ làm tan biến mọi âu lo trong cuộc sống thường nhật 🌅🌊',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000'
  },
  {
    content: 'Món bún chả thơm lừng cho bữa trưa hôm nay! Ai qua khu này nhất định phải thử một lần, thịt nướng than hoa thơm nức mũi 😋🍲',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000'
  },
  {
    content: 'Đọc xong cuốn sách "Atomic Habits - Thay đổi tí hon, hiệu quả bất ngờ". Một bài học rất tâm đắc: Thành công không đến từ những cú nhảy vọt, mà đến từ thói quen 1% tốt hơn mỗi ngày 📚✨',
    image: null
  },
  {
    content: 'Check-in góc làm việc mới setup tại nhà! Ánh sáng tự nhiên ngập tràn phòng làm việc giúp tăng 200% cảm hứng sáng tạo. Mọi người thấy thế nào? 🪴🖥️',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000'
  },
  {
    content: 'Chạy bộ 5km buổi sáng sớm quanh công viên. Hít thở bầu không khí tươi mới và cảm nhận cơ thể tràn đầy sức sống. Hãy vận động mỗi ngày nhé! 🏃‍♂️💨',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1000'
  },
  {
    content: 'Hôm nay trời xanh mây trắng nắng vàng, thích hợp để bắt đầu những dự định mới. Chúc cả nhà một tuần làm việc hiệu quả và gặt hái nhiều niềm vui! ❤️',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000'
  },
  {
    content: 'Những chuyến đi dạy cho ta biết thế giới này bao la đến nhường nào và ta nhỏ bé ra sao. Luôn giữ niềm đam mê khám phá nhé! 🎒🗺️',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1000'
  },
  {
    content: 'Học một ngôn ngữ lập trình mới giống như mở ra một cánh cửa đến cách tư duy mới. Keep learning, keep building! 🔥',
    image: null
  }
];

const commentList = [
  'Ảnh chụp nghệ thuật và đẹp quá bạn ơi! 😍',
  'Tuyệt vời quá, chúc mừng bạn nhé! 👏🎉',
  'Góc máy và màu sắc xuất sắc luôn ấy! Cho mình xin preset màu với ạ.',
  'Đồng quan điểm với bạn! Rất ý nghĩa.',
  'Quán cà phê này ở địa chỉ nào thế bạn ơi?',
  'Hâm mộ bạn ghê, luôn tràn đầy năng lượng tích cực! 💪',
  'Chill quá, hôm nào cho mình ké kèo với nhé hehe 🙌',
  '10 điểm không có nhưng luôn bạn ơi! ❤️',
  'Tuyệt tác luôn ạ! ✨',
  'Hay quá anh/chị ơi, chia sẻ thêm nhiều bài viết như này nhé!'
];

const storyList = [
  {
    content: 'Morning coffee chill ☕',
    media_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    media_type: 'image',
    background_color: null
  },
  {
    content: 'Hôm nay mọi việc đều thuận lợi! Chúc mọi người ngày vui 🌈',
    media_url: null,
    media_type: 'text',
    background_color: '#6366f1'
  },
  {
    content: 'Weekend trip with family 🚗🏖️',
    media_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    media_type: 'image',
    background_color: null
  },
  {
    content: 'Cố gắng 1% mỗi ngày 💪',
    media_url: null,
    media_type: 'text',
    background_color: '#ec4899'
  },
  {
    content: 'Sunset vibing 🌅',
    media_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    media_type: 'image',
    background_color: null
  },
  {
    content: 'Coding mode: ON 💻🔥',
    media_url: null,
    media_type: 'text',
    background_color: '#10b981'
  }
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedData() {
  console.log('🌱 Bắt đầu tạo dữ liệu demo cho HVTSocial trên Neon PostgreSQL...');
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Tạo/cập nhật demo users
  console.log('👤 Đang tạo/cập nhật người dùng demo...');
  for (const u of demoUsersList) {
    const email = `${u.username}@demo.com`;
    const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (check.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (username, email, password, full_name, avatar, bio, account_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())`,
        [u.username, email, hashedPassword, u.name, u.avatar, u.bio]
      );
    } else {
      await pool.query(
        `UPDATE users SET full_name = $1, avatar = $2, bio = $3, account_status = 'active' WHERE id = $4`,
        [u.name, u.avatar, u.bio, check.rows[0].id]
      );
    }
  }

  // Lấy tất cả user IDs
  const allUsers = (await pool.query('SELECT id, username, email FROM users ORDER BY id')).rows;
  const allUserIds = allUsers.map((u) => u.id);
  console.log(`✅ Tổng số users trong hệ thống: ${allUserIds.length}`);

  // Tìm id của hoang/hotra hoặc các tài khoản chính
  const mainUser = allUsers.find(u => u.username === 'hotra171' || u.email.includes('trabn')) || allUsers[0];
  console.log(`⭐ Tài khoản chính: ID ${mainUser.id} (${mainUser.username})`);

  // 2. Tạo quan hệ bạn bè (Friendships)
  console.log('🤝 Đang thiết lập quan hệ bạn bè...');
  let friendCount = 0;
  for (const user of allUsers) {
    // Kết bạn với tài khoản chính
    if (user.id !== mainUser.id) {
      const existing = await pool.query(
        `SELECT id FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
        [mainUser.id, user.id]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
           VALUES ($1, $2, 'accepted', NOW(), NOW())`,
          [mainUser.id, user.id]
        );
        friendCount++;
      }
    }

    // Kết bạn chéo giữa các user ngẫu nhiên
    const otherFriends = allUserIds.filter(id => id !== user.id).slice(0, 4);
    for (const fId of otherFriends) {
      const existing = await pool.query(
        `SELECT id FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
        [user.id, fId]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
           VALUES ($1, $2, 'accepted', NOW(), NOW())`,
          [user.id, fId]
        );
        friendCount++;
      }
    }
  }
  console.log(`✅ Đã thiết lập bạn bè kết nối`);

  // 3. Tạo bài viết (Posts)
  console.log('📝 Đang tạo bài viết (Posts)...');
  const postIds = [];
  for (let i = 0; i < postTemplates.length * 2; i++) {
    const template = postTemplates[i % postTemplates.length];
    const authorId = allUserIds[i % allUserIds.length];
    const hoursAgo = (i * 3) + 1; // Tạo timestamp rải rác trong các ngày gần đây

    const postRes = await pool.query(
      `INSERT INTO posts (user_id, content, media_url, media_type, visibility, is_deleted, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'public', false, NOW() - ($5 || ' hours')::INTERVAL, NOW() - ($5 || ' hours')::INTERVAL)
       RETURNING id`,
      [
        authorId,
        template.content,
        template.image,
        template.image ? 'image' : null,
        hoursAgo
      ]
    );

    if (postRes.rows.length > 0) {
      postIds.push(postRes.rows[0].id);
    }
  }
  console.log(`✅ Đã tạo ${postIds.length} bài viết`);

  // 4. Tạo Likes cho bài viết
  console.log('❤️ Đang tạo Likes cho bài viết...');
  let likeCount = 0;
  for (const postId of postIds) {
    const likers = allUserIds.slice(0, randomInt(3, Math.min(12, allUserIds.length)));
    for (const uId of likers) {
      try {
        await pool.query(
          `INSERT INTO likes (user_id, post_id, comment_id, created_at)
           VALUES ($1, $2, NULL, NOW())
           ON CONFLICT (user_id, post_id, comment_id) DO NOTHING`,
          [uId, postId]
        );
        likeCount++;
      } catch (err) {
        // bỏ qua trùng
      }
    }
  }
  console.log(`✅ Đã tạo tương tác Likes`);

  // 5. Tạo Comments
  console.log('💬 Đang tạo bình luận (Comments)...');
  let commentCount = 0;
  for (const postId of postIds) {
    const numComments = randomInt(2, 5);
    let parentCommentId = null;

    for (let j = 0; j < numComments; j++) {
      const commenterId = allUserIds[randomInt(0, allUserIds.length - 1)];
      const text = randomElement(commentList);
      const isReply = j > 0 && parentCommentId && Math.random() > 0.5;

      const cRes = await pool.query(
        `INSERT INTO comments (post_id, user_id, parent_comment_id, content, is_deleted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, false, NOW(), NOW())
         RETURNING id`,
        [postId, commenterId, isReply ? parentCommentId : null, text]
      );

      if (cRes.rows.length > 0 && !parentCommentId) {
        parentCommentId = cRes.rows[0].id;
      }
      commentCount++;
    }
  }
  console.log(`✅ Đã tạo ${commentCount} bình luận`);

  // 6. Tạo Stories còn hạn (24h)
  console.log('🌟 Đang tạo Stories còn hạn...');
  let storyCount = 0;
  for (let sIdx = 0; sIdx < storyList.length; sIdx++) {
    const st = storyList[sIdx];
    const storyAuthorId = allUserIds[sIdx % allUserIds.length];

    await pool.query(
      `INSERT INTO stories (user_id, content, media_url, media_type, background_color, privacy, expires_at, is_deleted, created_at)
       VALUES ($1, $2, $3, $4, $5, 'public', NOW() + INTERVAL '20 hours', false, NOW())`,
      [
        storyAuthorId,
        st.content,
        st.media_url,
        st.media_type,
        st.background_color
      ]
    );
    storyCount++;
  }
  console.log(`✅ Đã tạo ${storyCount} Stories`);

  // 7. Tạo Cuộc trò chuyện & Tin nhắn (Chats & Messages)
  console.log('💬 Đang tạo tin nhắn mẫu (Chats & Messages)...');
  const chatPartners = allUsers.filter(u => u.id !== mainUser.id).slice(0, 3);

  for (const partner of chatPartners) {
    // Kiểm tra xem chat giữa 2 người đã có chưa
    const existingChat = await pool.query(
      `SELECT c.id FROM chats c
       JOIN chat_users cu1 ON c.id = cu1.chat_id AND cu1.user_id = $1
       JOIN chat_users cu2 ON c.id = cu2.chat_id AND cu2.user_id = $2
       WHERE c.is_group_chat = false`,
      [mainUser.id, partner.id]
    );

    let chatId;
    if (existingChat.rows.length > 0) {
      chatId = existingChat.rows[0].id;
    } else {
      const newChat = await pool.query(
        `INSERT INTO chats (is_group_chat, name, created_by, created_at, updated_at)
         VALUES (false, $1, $2, NOW(), NOW())
         RETURNING id`,
        [partner.full_name || partner.username, mainUser.id]
      );
      chatId = newChat.rows[0].id;

      await pool.query(
        `INSERT INTO chat_users (chat_id, user_id, is_admin, joined_at)
         VALUES ($1, $2, true, NOW()), ($1, $3, false, NOW())`,
        [chatId, mainUser.id, partner.id]
      );
    }

    // Gửi tin nhắn mẫu
    const sampleMsgs = [
      { sender: partner.id, text: `Chào bạn! Rất vui được kết nối trên HVTSocial nhé!` },
      { sender: mainUser.id, text: `Chào bạn nha! Dạo này công việc thế nào rồi?` },
      { sender: partner.id, text: `Dạo này dự án chạy mượt lắm, giao diện mạng xã hội này đẹp ghê!` }
    ];

    for (const msg of sampleMsgs) {
      await pool.query(
        `INSERT INTO messages (chat_id, sender_id, content, message_type, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'text', 'read', NOW(), NOW())`,
        [chatId, msg.sender, msg.text]
      );
    }
  }
  console.log('✅ Đã tạo các cuộc hội thoại tin nhắn');

  console.log(`
🎉 HOÀN TẤT TẠO DỮ LIỆU DEMO THÀNH CÔNG!
======================================================
Tài khoản thử nghiệm:
- Tài khoản chính của bạn: ${mainUser.email} (hoặc đăng nhập bằng email của bạn)
- Các tài khoản demo khác:
  + lan_nguyen@demo.com  (Mật khẩu: ${DEMO_PASSWORD})
  + duc_anh@demo.com     (Mật khẩu: ${DEMO_PASSWORD})
  + mai_le@demo.com      (Mật khẩu: ${DEMO_PASSWORD})
  + hoang_nam@demo.com   (Mật khẩu: ${DEMO_PASSWORD})
  + user1@demo.com ... user20@demo.com (Mật khẩu: ${DEMO_PASSWORD})

Dữ liệu đã tạo:
- Hơn 24 bài viết đầy đủ hình ảnh, captions, likes và bình luận
- Quan hệ bạn bè kết nối giữa các users
- Stories hiển thị trên đầu trang chủ (24h)
- Tin nhắn hội thoại trong mục Chat
======================================================
  `);

  process.exit(0);
}

seedData().catch((err) => {
  console.error('❌ Lỗi khi tạo dữ liệu demo:', err);
  process.exit(1);
});
