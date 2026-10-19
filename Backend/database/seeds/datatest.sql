/* =============================================================
   SEED DỮ LIỆU CHO TẤT CẢ CÁC BẢNG
   (mỗi bảng ít nhất 15 dòng)
   ============================================================= */

---------------------------------------------------------
-- 1. USERS (15 users)
---------------------------------------------------------
INSERT INTO users (email, password, full_name, username, avatar, bio, address)
VALUES
('user1@gmail.com','123456',N'Nguyễn Văn A', 'nguyenvana', 'https://i.pravatar.cc/150?img=1', N'User demo 1', N'Hà Nội'),
('user2@gmail.com','123456',N'Lê Thị B',     'lethib',    'https://i.pravatar.cc/150?img=2', N'User demo 2', N'Đà Nẵng'),
('user3@gmail.com','123456',N'Trần Văn C',   'tranvanc',  'https://i.pravatar.cc/150?img=3', N'User demo 3', N'Hồ Chí Minh'),
('user4@gmail.com','123456',N'Phạm Nhật D',  'phamnhatd', 'https://i.pravatar.cc/150?img=4', N'User demo 4', N'Cần Thơ'),
('user5@gmail.com','123456',N'Hoàng Thị E',  'hoangthie', 'https://i.pravatar.cc/150?img=5', N'User demo 5', N'Hải Phòng'),
('user6@gmail.com','123456',N'Vũ Văn F',     'vuvanf',    'https://i.pravatar.cc/150?img=6', N'User demo 6', N'Nha Trang'),
('user7@gmail.com','123456',N'Ngô Thị G',    'ngothig',   'https://i.pravatar.cc/150?img=7', N'User demo 7', N'Quảng Ninh'),
('user8@gmail.com','123456',N'Đặng Văn H',   'dangvanh',  'https://i.pravatar.cc/150?img=8', N'User demo 8', N'Bình Dương'),
('user9@gmail.com','123456',N'Lý Thị I',     'lythii',    'https://i.pravatar.cc/150?img=9', N'User demo 9', N'Đồng Nai'),
('user10@gmail.com','123456',N'Bùi Văn K',   'buivank',   'https://i.pravatar.cc/150?img=10',N'User demo 10',N'Huế'),
('user11@gmail.com','123456',N'Nguyễn Thị L','nguyenthil','https://i.pravatar.cc/150?img=11',N'User demo 11',N'An Giang'),
('user12@gmail.com','123456',N'Trần Minh M', 'tranminhm','https://i.pravatar.cc/150?img=12',N'User demo 12',N'Lâm Đồng'),
('user13@gmail.com','123456',N'Phạm Thị N',  'phamthin', 'https://i.pravatar.cc/150?img=13',N'User demo 13',N'Vũng Tàu'),
('user14@gmail.com','123456',N'Đỗ Văn O',    'dovano',   'https://i.pravatar.cc/150?img=14',N'User demo 14',N'Thái Bình'),
('user15@gmail.com','123456',N'Huỳnh Thị P', 'huynhthip','https://i.pravatar.cc/150?img=15',N'User demo 15',N'Nam Định');
GO

---------------------------------------------------------
-- 2. HOBBIES (15)
---------------------------------------------------------
INSERT INTO hobbies (content)
VALUES
('coding'),
('music'),
('football'),
('reading'),
('gaming'),
('travel'),
('cooking'),
('swimming'),
('running'),
('photography'),
(N'đọc sách'),
(N'xem phim'),
(N'uống cà phê'),
(N'chụp ảnh'),
(N'đi du lịch');
GO

---------------------------------------------------------
-- 3. USER_HOBBIES (15)
---------------------------------------------------------
INSERT INTO user_hobbies (user_id, hobby_id)
VALUES
(1,1),(1,2),
(2,3),(2,4),
(3,1),(3,5),
(4,6),(4,7),
(5,2),(5,8),
(6,9),(7,10),
(8,11),(9,12),
(10,13);
GO

---------------------------------------------------------
-- 4. POSTS (ít nhất 15, ở đây 15)
---------------------------------------------------------
INSERT INTO posts (user_id, content, media, status, shared_post_id)
VALUES
(1, N'Chào mừng đến với HVTSocial!', NULL, 'public', NULL),
(2, N'Hôm nay trời đẹp quá.', NULL, 'public', NULL),
(3, N'Đây là bài viết có hình ảnh.', 'https://picsum.photos/600', 'public', NULL),
(4, N'Ăn sáng xong rồi, đi làm thôi.', NULL, 'friends', NULL),
(5, N'Cuối tuần đi chơi đâu nhỉ?', NULL, 'public', NULL),
(6, N'Check-in cà phê sáng.', 'https://picsum.photos/601', 'public', NULL),
(7, N'Đọc sách buổi tối.', NULL, 'friends', NULL),
(8, N'Học code ReactJS.', NULL, 'public', NULL),
(9, N'Tập gym mỗi ngày.', NULL, 'public', NULL),
(10,N'Ảnh thử nghiệm demo.', 'https://picsum.photos/602', 'public', NULL),
(11,N'Bài viết share 1', NULL, 'public', 3),
(12,N'Bài viết share 2', NULL, 'public', 6),
(13,N'Bài viết share 3', NULL, 'friends', 3),
(14,N'Bài viết riêng tư', NULL, 'private', NULL),
(15,N'Bài viết demo cuối', 'https://picsum.photos/603', 'public', NULL);
GO

---------------------------------------------------------
-- 5. COMMENTS (15)
---------------------------------------------------------
INSERT INTO comments (post_id, user_id, content)
VALUES
(1,2,N'Chúc mừng bài viết đầu tiên!'),
(1,3,N'Hay quá bạn ơi.'),
(2,1,N'Hà Nội hôm nay cũng đẹp.'),
(3,4,N'Ảnh đẹp đó.'),
(3,5,N'Chụp ở đâu vậy?'),
(4,6,N'Cố gắng làm việc nhé.'),
(5,7,N'Đi Đà Lạt đi.'),
(5,8,N'Tôi vote Vũng Tàu.'),
(6,9,N'Quán này nhìn đẹp ghê.'),
(7,10,N'Cuốn này hay lắm.'),
(8,11,N'ReactJS khá thú vị.'),
(9,12,N'Ngày nào cũng nên tập.'),
(10,13,N'Ảnh chất lượng cao ghê.'),
(11,14,N'Share bài này hợp lý.'),
(12,15,N'Đồng ý với bạn.');
GO

---------------------------------------------------------
-- 6. LIKES (15) – chỉ like post cho đơn giản
---------------------------------------------------------
INSERT INTO likes (user_id, post_id, comment_id)
VALUES
(1,1,NULL),
(2,1,NULL),
(3,1,NULL),
(4,2,NULL),
(5,2,NULL),
(6,3,NULL),
(7,3,NULL),
(8,4,NULL),
(9,4,NULL),
(10,5,NULL),
(11,6,NULL),
(12,7,NULL),
(13,8,NULL),
(14,9,NULL),
(15,10,NULL);
GO

---------------------------------------------------------
-- 7. CHATS (15)
---------------------------------------------------------
INSERT INTO chats (name, is_group_chat)
VALUES
('Chat 1-1: U1 & U2', 0),
('Chat 1-1: U3 & U4', 0),
('Chat 1-1: U5 & U6', 0),
('Chat 1-1: U7 & U8', 0),
('Chat 1-1: U9 & U10',0),
(N'Nhóm Bạn Cấp 3',1),
(N'Nhóm Lập Trình',1),
(N'Nhóm Đá Bóng',1),
(N'Nhóm Du Lịch',1),
(N'Nhóm Ăn Uống',1),
(N'Nhóm Công Ty',1),
(N'Nhóm Gia Đình',1),
(N'Nhóm CLB Sách',1),
(N'Nhóm CLB Nhạc',1),
(N'Nhóm Random',1);
GO

---------------------------------------------------------
-- 8. CHAT_USERS (≥15)
---------------------------------------------------------
INSERT INTO chat_users (chat_id, user_id, is_admin)
VALUES
(1,1,1),(1,2,0),
(2,3,1),(2,4,0),
(3,5,1),(3,6,0),
(4,7,1),(4,8,0),
(5,9,1),(5,10,0),
(6,1,1),(6,3,0),
(7,2,1),(7,4,0),
(8,5,1),(8,7,0),
(9,6,1),(9,8,0),
(10,9,1),(10,11,0);
GO

---------------------------------------------------------
-- 9. MESSAGES (15)
---------------------------------------------------------
INSERT INTO messages (chat_id, sender_id, content, message_type)
VALUES
(1,1,N'Hello U2!','text'),
(1,2,N'Chào bạn U1.','text'),
(2,3,N'Đi uống cà phê không?','text'),
(2,4,N'Ok chiều nhé.','text'),
(3,5,N'Làm bài tập xong chưa?','text'),
(3,6,N'Gần xong rồi.','text'),
(4,7,N'Cuối tuần đá bóng nhé.','text'),
(4,8,N'Chuẩn luôn.','text'),
(5,9,N'Hôm nay rảnh không?','text'),
(5,10,N'Rảnh nè.','text'),
(6,1,N'Mọi người ơi họp nhóm.','text'),
(7,2,N'Có bug mới cần fix.','text'),
(8,5,N'Lên lịch đi chơi.','text'),
(9,6,N'Chuẩn bị hành lý chưa?','text'),
(10,9,N'Hôm nay ăn gì?','text');
GO

---------------------------------------------------------
-- 10. NOTIFICATIONS (15)
---------------------------------------------------------
INSERT INTO notifications (user_id, sender_id, post_id, content, type, status)
VALUES
(1,2,1,N'đã thích bài viết của bạn','like','unread'),
(1,3,1,N'đã bình luận bài viết của bạn','comment','unread'),
(2,1,2,N'đã thích bài viết của bạn','like','unread'),
(3,4,3,N'đã thích bài viết của bạn','like','read'),
(4,5,4,N'đã gửi lời mời kết bạn','friend_request','unread'),
(5,6,NULL,N'đã gửi tin nhắn mới','message','unread'),
(6,7,5,N'đã bình luận bài viết của bạn','comment','read'),
(7,8,NULL,N'đã nhắc bạn trong bình luận','other','unread'),
(8,9,6,N'đã thích bài viết của bạn','like','unread'),
(9,10,7,N'đã bình luận bài viết của bạn','comment','unread'),
(10,1,8,N'đã chia sẻ bài viết của bạn','other','unread'),
(11,2,9,N'đã thích bài viết của bạn','like','read'),
(12,3,10,N'đã bình luận bài viết của bạn','comment','unread'),
(13,4,11,N'đã gửi lời mời kết bạn','friend_request','unread'),
(14,5,12,N'đã trả lời bình luận của bạn','comment','unread');
GO

---------------------------------------------------------
-- 11. FRIENDSHIPS (15)
---------------------------------------------------------
INSERT INTO friendships (user_id, friend_id, status)
VALUES
(1,2,'accepted'),
(1,3,'accepted'),
(2,3,'accepted'),
(2,4,'pending'),
(3,4,'accepted'),
(3,5,'accepted'),
(4,5,'accepted'),
(4,6,'pending'),
(5,6,'accepted'),
(5,7,'accepted'),
(6,7,'blocked'),
(6,8,'accepted'),
(7,8,'accepted'),
(8,9,'accepted'),
(9,10,'pending');
GO

---------------------------------------------------------
-- 12. STORIES (15) – ĐÃ SỬA ĐỦ TRƯỜNG
---------------------------------------------------------
INSERT INTO stories (
    user_id,
    media_url,
    media_type,
    caption,
    background_color,
    privacy,
    expires_at,
    created_at,
    updated_at
)
VALUES
(1, 'https://picsum.photos/310', N'image', N'Story 1',  N'#4f46e5', N'public',  DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(2, 'https://picsum.photos/311', N'image', N'Story 2',  N'#4f46e5', N'public',  DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(3, 'https://picsum.photos/312', N'image', N'Story 3',  N'#4f46e5', N'friends', DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(4, 'https://picsum.photos/313', N'image', N'Story 4',  N'#4f46e5', N'public',  DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(5, 'https://picsum.photos/314', N'image', N'Story 5',  N'#4f46e5', N'public',  DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(6, 'https://picsum.photos/315', N'image', N'Story 6',  N'#4f46e5', N'friends', DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(7, 'https://picsum.photos/316', N'image', N'Story 7',  N'#4f46e5', N'public',  DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(8, 'https://picsum.photos/317', N'image', N'Story 8',  N'#4f46e5', N'public',  DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(9, 'https://picsum.photos/318', N'image', N'Story 9',  N'#4f46e5', N'friends', DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(10,'https://picsum.photos/319', N'image', N'Story 10', N'#4f46e5', N'public',  DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(11,'https://picsum.photos/320', N'image', N'Story 11', N'#4f46e5', N'public',  DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(12,'https://picsum.photos/321', N'image', N'Story 12', N'#4f46e5', N'public',  DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(13,'https://picsum.photos/322', N'image', N'Story 13', N'#4f46e5', N'public',  DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(14,'https://picsum.photos/323', N'image', N'Story 14', N'#4f46e5', N'friends', DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE()),
(15,'https://picsum.photos/324', N'image', N'Story 15', N'#4f46e5', N'public',  DATEADD(HOUR,24,GETUTCDATE()), GETUTCDATE(), GETUTCDATE());
GO


---------------------------------------------------------
-- 13. STORY_VIEWS (15)
---------------------------------------------------------
INSERT INTO story_views (story_id, viewer_id)
VALUES
(1,2),
(1,3),
(2,1),
(2,3),
(3,1),
(3,4),
(4,5),
(5,6),
(6,7),
(7,8),
(8,9),
(9,10),
(10,11),
(11,12),
(12,13);
GO

---------------------------------------------------------
-- 14. SAVED_POSTS (15)
---------------------------------------------------------
INSERT INTO saved_posts (user_id, post_id)
VALUES
(1,3),
(1,5),
(2,1),
(2,4),
(3,6),
(3,7),
(4,2),
(4,8),
(5,9),
(6,10),
(7,11),
(8,12),
(9,13),
(10,14),
(11,15);
GO

---------------------------------------------------------
-- 15. REACTIONS (15 kiểu reaction)
---------------------------------------------------------
INSERT INTO reactions (name, icon)
VALUES
(N'like',  N'👍'),
(N'love',  N'❤️'),
(N'haha',  N'😆'),
(N'wow',   N'😮'),
(N'sad',   N'😢'),
(N'angry', N'😡'),
(N'care',  N'🤗'),
(N'fire',  N'🔥'),
(N'cool',  N'😎'),
(N'star',  N'⭐'),
(N'clap',  N'👏'),
(N'party', N'🎉'),
(N'think', N'🤔'),
(N'sleep', N'😴'),
(N'ok',    N'👌');
GO

---------------------------------------------------------
-- 16. POST_REACTIONS (15)
---------------------------------------------------------
INSERT INTO post_reactions (user_id, post_id, reaction_id)
VALUES
(1,1,2),
(2,1,1),
(3,1,3),
(4,2,2),
(5,2,1),
(6,3,4),
(7,3,1),
(8,4,2),
(9,5,1),
(10,6,5),
(11,7,2),
(12,8,3),
(13,9,1),
(14,10,2),
(15,11,4);
GO

---------------------------------------------------------
-- 17. COMMENT_REACTIONS (15)
---------------------------------------------------------
INSERT INTO comment_reactions (user_id, comment_id, reaction_id)
VALUES
(1,1,2),
(2,1,3),
(3,2,1),
(4,3,4),
(5,4,1),
(6,5,2),
(7,6,3),
(8,7,1),
(9,8,2),
(10,9,4),
(11,10,1),
(12,11,2),
(13,12,3),
(14,13,1),
(15,14,2);
GO

---------------------------------------------------------
-- 18. POST_TAGS (15)
---------------------------------------------------------
INSERT INTO post_tags (post_id, tagged_user_id)
VALUES
(1,2),
(1,3),
(2,4),
(2,5),
(3,6),
(3,7),
(4,8),
(5,9),
(6,10),
(7,11),
(8,12),
(9,13),
(10,14),
(11,15),
(12,1);
GO

---------------------------------------------------------
-- 19. COMMENT_TAGS (15)
---------------------------------------------------------
INSERT INTO comment_tags (comment_id, tagged_user_id)
VALUES
(1,4),
(2,5),
(3,6),
(4,7),
(5,8),
(6,9),
(7,10),
(8,11),
(9,12),
(10,13),
(11,14),
(12,15),
(13,1),
(14,2),
(15,3);
GO

---------------------------------------------------------
-- 20. USER_BLOCKS (15)
---------------------------------------------------------
INSERT INTO user_blocks (blocker_id, blocked_id)
VALUES
(1,5),
(2,6),
(3,7),
(4,8),
(5,9),
(6,10),
(7,11),
(8,12),
(9,13),
(10,14),
(11,15),
(12,1),
(13,2),
(14,3),
(15,4);
GO

---------------------------------------------------------
-- 21. REPORTS (15)
---------------------------------------------------------
INSERT INTO reports (reporter_id, target_type, target_id, reason, status)
VALUES
(1,'post',1,N'Nội dung spam','pending'),
(2,'post',2,N'Nội dung nhạy cảm','pending'),
(3,'comment',1,N'Ngôn từ không phù hợp','pending'),
(4,'user',5,N'Tài khoản giả mạo','pending'),
(5,'post',3,N'Hình ảnh không rõ nguồn gốc','reviewed'),
(6,'comment',2,N'Bình luận tiêu cực','pending'),
(7,'user',8,N'Nghi ngờ lừa đảo','pending'),
(8,'post',4,N'Vi phạm bản quyền','pending'),
(9,'post',5,N'Truyền bá thông tin sai','pending'),
(10,'comment',3,N'Gây tranh cãi','pending'),
(11,'user',9,N'Hành vi không đúng','pending'),
(12,'post',6,N'Không phù hợp cộng đồng','pending'),
(13,'comment',4,N'Bình luận công kích','pending'),
(14,'user',10,N'Nghi ngờ bot','pending'),
(15,'post',7,N'Quảng cáo quá nhiều','pending');
GO

---------------------------------------------------------
-- 22. FOLLOWS (15)
---------------------------------------------------------
INSERT INTO follows (follower_id, following_id)
VALUES
(1,3),
(1,4),
(2,5),
(2,6),
(3,7),
(3,8),
(4,9),
(4,10),
(5,1),
(6,2),
(7,3),
(8,4),
(9,5),
(10,6),
(11,7);
GO

---------------------------------------------------------
-- 10. NOTIFICATIONS (nhiều thông báo cho user 1)
---------------------------------------------------------
INSERT INTO notifications (user_id, sender_id, post_id, content, type, status)
VALUES
-- Các thông báo cho user 1 (Nguyễn Văn A)
(1,2,1 ,N'đã thích bài viết của bạn','like','unread'),
(1,3,1 ,N'đã bình luận bài viết của bạn','comment','unread'),
(1,4,3 ,N'đã chia sẻ bài viết của bạn','other','unread'),
(1,5,5 ,N'đã thích bài viết của bạn','like','read'),
(1,6,NULL,N'đã gửi lời mời kết bạn','friend_request','unread'),
(1,7,NULL,N'đã gửi tin nhắn mới cho bạn','message','unread'),
(1,8,6 ,N'đã nhắc bạn trong bình luận','other','unread'),
(1,9,7 ,N'đã bình luận thêm vào bài viết của bạn','comment','unread'),
(1,10,8,N'đã thích bình luận của bạn','like','unread'),
(1,11,9,N'đã trả lời bình luận của bạn','comment','read'),

-- Các thông báo cho user khác (vẫn giữ cho demo)
(2,1,2 ,N'đã thích bài viết của bạn','like','unread'),
(3,4,3 ,N'đã thích bài viết của bạn','like','read'),
(4,5,4 ,N'đã gửi lời mời kết bạn','friend_request','unread'),
(5,6,NULL,N'đã gửi tin nhắn mới','message','unread'),
(6,7,5 ,N'đã bình luận bài viết của bạn','comment','read');
GO

-- Thêm dữ liệu kết nối cho user 1 (Nguyễn Văn A)

INSERT INTO friendships (user_id, friend_id, status)
VALUES
    -- Những người khác đã kết bạn với user 1  → Followers
    (2, 1, 'accepted'),
    (3, 1, 'accepted'),
    (6, 1, 'accepted'),
    (7, 1, 'accepted'),

    -- Lời mời kết bạn đang chờ user 1 duyệt  → Pending
    (8, 1, 'pending'),
    (9, 1, 'pending');
-- BỔ SUNG KẾT NỐI CHO USER 1 (Nguyễn Văn A)

INSERT INTO friendships (user_id, friend_id, status)
VALUES
--  Accepted (để hiện Followers / Connections)
(10, 1, 'accepted'),
(11, 1, 'accepted'),
(12, 1, 'accepted'),

--  User 1 theo dõi thêm người khác
(1, 4, 'accepted'),
(1, 5, 'accepted'),
(1, 6, 'accepted'),

-- ⏳ Pending (chờ user 1 chấp nhận)
(13, 1, 'pending'),
(14, 1, 'pending'),
(15, 1, 'pending'),

-- ⏳ Pending do user 1 gửi đi
(1, 8, 'pending'),
(1, 9, 'pending');



/* =============================================================
   THÊM THÊM CÁC CUỘC TRÒ CHUYỆN DEMO CHO USER 1
   ============================================================= */

DECLARE @chatId INT;

-- Chat 1-1: User 1 & User 3
INSERT INTO chats (name, is_group_chat)
VALUES (N'Chat 1-1: U1 & U3', 0);
SET @chatId = SCOPE_IDENTITY();

INSERT INTO chat_users (chat_id, user_id, is_admin)
VALUES (@chatId, 1, 1), (@chatId, 3, 0);

INSERT INTO messages (chat_id, sender_id, content, message_type)
VALUES
(@chatId, 1, N'Chào C, dạo này sao rồi?', 'text'),
(@chatId, 3, N'Mình vẫn ổn, cảm ơn bạn 😄', 'text');


-- Chat 1-1: User 1 & User 4
INSERT INTO chats (name, is_group_chat)
VALUES (N'Chat 1-1: U1 & U4', 0);
SET @chatId = SCOPE_IDENTITY();

INSERT INTO chat_users (chat_id, user_id, is_admin)
VALUES (@chatId, 1, 1), (@chatId, 4, 0);

INSERT INTO messages (chat_id, sender_id, content, message_type)
VALUES
(@chatId, 4, N'Cuối tuần rảnh đi cf không?', 'text'),
(@chatId, 1, N'Ok chủ nhật nha 👍', 'text');


-- Nhóm: Team Code
INSERT INTO chats (name, is_group_chat)
VALUES (N'Team Code', 1);
SET @chatId = SCOPE_IDENTITY();

INSERT INTO chat_users (chat_id, user_id, is_admin)
VALUES
(@chatId, 1, 1),
(@chatId, 5, 0),
(@chatId, 6, 0),
(@chatId, 7, 0);

INSERT INTO messages (chat_id, sender_id, content, message_type)
VALUES
(@chatId, 1, N'Anh em ơi push code chưa?', 'text'),
(@chatId, 5, N'Em vừa push xong branch feature/post 👍', 'text'),
(@chatId, 6, N'Để tối em review.', 'text');


-- Nhóm: Nhóm Ăn Uống
INSERT INTO chats (name, is_group_chat)
VALUES (N'Nhóm Ăn Uống', 1);
SET @chatId = SCOPE_IDENTITY();

INSERT INTO chat_users (chat_id, user_id, is_admin)
VALUES
(@chatId, 1, 1),
(@chatId, 8, 0),
(@chatId, 9, 0),
(@chatId, 10, 0);

INSERT INTO messages (chat_id, sender_id, content, message_type)
VALUES
(@chatId, 8, N'Tối nay ăn lẩu không mọi người?', 'text'),
(@chatId, 9, N'Cho mình tham gia với 😋', 'text'),
(@chatId, 1, N'Ok 7h nha cả nhà.', 'text');




-- Chat 1-1: User 1 & User 2
INSERT INTO chats (name, is_group_chat)
VALUES (N'Chat 1-1: Nguyễn Văn A & Lê Thị B', 0);
SET @chatId = SCOPE_IDENTITY();

INSERT INTO chat_users (chat_id, user_id, is_admin)
VALUES
(@chatId, 1, 1),
(@chatId, 2, 0);

INSERT INTO messages (chat_id, sender_id, content, message_type, media_url)
VALUES
(@chatId, 1, N'Chào B 👋 lâu rồi không nói chuyện.', 'text', NULL),
(@chatId, 2, N'Dạ em chào anh, dạo này anh thế nào?', 'text', NULL),
(@chatId, 1, N'Cũng ổn, đang làm đồ án HVTSocial 😄', 'text', NULL),
(@chatId, 2, N'Nghe hay quá, cho em xem giao diện với!', 'text', NULL),
(@chatId, 1, NULL, 'image', 'https://images.pexels.com/photos/3182763/pexels-photo-3182763.jpeg'),
(@chatId, 1, N'Đây là giao diện phần feed nè.', 'text', NULL),
(@chatId, 2, N'Ui nhìn xịn ghê 😍, làm một mình hả anh?', 'text', NULL),
(@chatId, 1, N'Ừa, mà chắc phải nhờ mọi người test giúp.', 'text', NULL),
(@chatId, 2, N'Ok khi nào cần cứ nói em nha 👍', 'text', NULL);
-- Nhóm: Nhóm Bạn Cấp 3
INSERT INTO chats (name, is_group_chat)
VALUES (N'Nhóm Bạn Cấp 3', 1);
SET @chatId = SCOPE_IDENTITY();

INSERT INTO chat_users (chat_id, user_id, is_admin)
VALUES
(@chatId, 1, 1),
(@chatId, 3, 0),
(@chatId, 4, 0),
(@chatId, 5, 0);

INSERT INTO messages (chat_id, sender_id, content, message_type, media_url)
VALUES
(@chatId, 3, N'Mọi người ơi lâu quá không họp lớp 😆', 'text', NULL),
(@chatId, 4, N'Đúng rồi, hay cuối tuần này tụ tập đi.', 'text', NULL),
(@chatId, 5, N'T7 hay CN thì tiện hơn?', 'text', NULL),
(@chatId, 1, N'CN đi, T7 mình bận.', 'text', NULL),
(@chatId, 3, NULL, 'image', 'https://images.pexels.com/photos/296899/pexels-photo-296899.jpeg'),
(@chatId, 3, N'Quán này mới mở gần trường cũ đó.', 'text', NULL),
(@chatId, 4, N'Nhìn ngon ghê 🤤', 'text', NULL),
(@chatId, 5, N'Chốt chủ nhật 6h chiều nha.', 'text', NULL),
(@chatId, 1, N'Ok chốt 👍', 'text', NULL);


INSERT INTO posts (user_id, content, status, shared_post_id) VALUES
(2, N'Chia sẻ bài viết hay quá', 'public', 1),
(3, N'Mình cũng thấy bài này rất hay', 'public', 1),
(4, N'Share lại cho mọi người xem', 'public', 1),
(5, N'Đồng ý với quan điểm này', 'public', 1),
(6, N'Bài viết rất hữu ích', 'public', 1);
INSERT INTO posts (user_id, content, status, shared_post_id) VALUES
(3, N'Share bài này', 'public', 16),
(4, N'Bài viết đáng đọc', 'public', 16),
(5, N'Mọi người nên xem', 'public', 16);
INSERT INTO posts (user_id, content, status, shared_post_id) VALUES
(2, N'Chia sẻ lại', 'public', 17),
(3, N'Bài này hợp lý nè', 'public', 17),
(4, N'Quá chuẩn', 'public', 17),
(5, N'Share nhẹ', 'public', 17),
(6, N'Mọi người đọc đi', 'public', 17),
(7, N'👍', 'public', 17),
(8, N'Rất hay', 'public', 17);

INSERT INTO posts (user_id, content, media, status, shared_post_id)
VALUES
-- TEXT
(1, N'Hôm nay mình bắt đầu code lại toàn bộ project HVTSocial 🚀', NULL, 'public', NULL),
(1, N'Cảm giác build được một mạng xã hội của riêng mình thật sự rất đã 😄', NULL, 'public', NULL),
(1, N'Đang hoàn thiện chức năng chat realtime bằng Socket.IO 🔥', NULL, 'friends', NULL),
(1, N'Buổi tối dành thời gian fix bug và tối ưu UI.', NULL, 'public', NULL),
(1, N'Feature story hoạt động khá ổn rồi 👀', NULL, 'public', NULL),

-- IMAGE
(1, N'Ảnh demo giao diện trang chủ HVTSocial', 'https://picsum.photos/seed/hvt1/800', 'public', NULL),
(1, N'Check-in cà phê lúc code đêm ☕', 'https://picsum.photos/seed/hvt2/800', 'public', NULL),
(1, N'Giao diện profile người dùng đã hoàn thiện', 'https://picsum.photos/seed/hvt3/800', 'public', NULL),

-- FRIENDS / PRIVATE
(1, N'Một chút suy nghĩ riêng tư trong quá trình làm đồ án.', NULL, 'friends', NULL),
(1, N'Ghi chú cá nhân – không công khai.', NULL, 'private', NULL),

-- SHARE POST KHÁC
(1, N'Share lại bài viết hay của bạn mình 👍', NULL, 'public', 2),
(1, N'Bài này đáng để đọc lại!', NULL, 'public', 3),

-- MIX
(1, N'Hoàn thành xong seed database hơn 20 bảng 🎯', NULL, 'public', NULL),
(1, N'Bài viết test reaction, like, comment.', NULL, 'public', NULL),
(1, N'Chuẩn bị nộp đồ án, mong là mọi thứ ổn 🥹', NULL, 'public', NULL);
GO
INSERT INTO comments (post_id, user_id, content)
SELECT p.id, u.id,
       N'Bài này hay quá 👍'
FROM posts p
JOIN users u ON u.id BETWEEN 2 AND 6
WHERE p.user_id = 1;
GO
