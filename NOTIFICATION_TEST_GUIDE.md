# 🔔 Hướng dẫn Test Notifications

## ✅ Đã hoàn thành:

1. **Sửa lỗi PostgreSQL compatibility** trong `notificationService.js`
2. **Tạo 5 test notifications** trong database cho user ID 1 (trabn1712003@gmail.com)

## 📊 Test Notifications đã tạo:

| # | Người gửi | Loại | Nội dung | Trạng thái |
|---|-----------|------|----------|------------|
| 1 | Hoàng Bảo | like | đã thích bài viết của bạn | Chưa đọc |
| 2 | Notification Test User | comment | đã bình luận: "Bài viết hay quá!" | Chưa đọc |
| 3 | Post Test User | friend_request | đã gửi lời mời kết bạn | Chưa đọc |
| 4 | Lê Thị Bích | follow | đã bắt đầu theo dõi bạn | **Đã đọc** |
| 5 | Trần Văn Cường | like | đã thích bài viết của bạn | Chưa đọc |

**Tổng: 5 notifications (4 chưa đọc, 1 đã đọc)**

## 🧪 Cách test:

### Option 1: Test trên Frontend (Khuyến nghị)

1. **Start Backend:**
   ```bash
   cd Backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd Frontend
   npm run dev
   ```

3. **Login vào app:**
   - Email: `trabn1712003@gmail.com`
   - Password: `trabn1712003`

4. **Kiểm tra Notifications:**
   - Click vào biểu tượng 🔔 trên header
   - Bạn sẽ thấy 5 notifications
   - Badge số đỏ hiển thị: **4** (số notifications chưa đọc)

5. **Test các chức năng:**
   - ✅ Click vào notification → Đánh dấu là đã đọc
   - ✅ Click "Đánh dấu tất cả đã đọc" → Tất cả chuyển thành đã đọc
   - ✅ Click "Xóa" → Xóa notification
   - ✅ Tạo notification mới bằng cách:
     - Like một bài viết → Notification gửi đến chủ bài viết
     - Comment vào bài viết → Notification gửi đến chủ bài viết
     - Gửi friend request → Notification gửi đến người nhận

### Option 2: Test bằng API (Nếu server đang chạy)

#### 2.1. Login để lấy token:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trabn1712003@gmail.com","password":"trabn1712003"}'
```

Copy `token` từ response.

#### 2.2. Lấy danh sách notifications:
```bash
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 2.3. Lấy số lượng chưa đọc:
```bash
curl http://localhost:3000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 2.4. Đánh dấu một notification đã đọc:
```bash
curl -X PATCH http://localhost:3000/api/notifications/1/read \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 2.5. Đánh dấu tất cả đã đọc:
```bash
curl -X PATCH http://localhost:3000/api/notifications/mark-all-read \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 2.6. Xóa một notification:
```bash
curl -X DELETE http://localhost:3000/api/notifications/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Option 3: Test trực tiếp database

```bash
cd Backend
node scripts/view-database.js
```

Sẽ hiển thị tất cả tables và data, bao gồm notifications.

## 🔄 Tạo thêm test notifications:

Nếu muốn tạo thêm test notifications:

```bash
cd Backend
node scripts/create-test-notifications.js
```

Script sẽ tạo 5 notifications mới cho user ID 1.

## 🐛 Troubleshooting:

### Vấn đề: Không thấy notifications trên frontend

**Kiểm tra:**
1. Backend server đang chạy? (`npm run dev` trong Backend folder)
2. Đã login đúng tài khoản `trabn1712003@gmail.com`?
3. Check console log trong browser (F12) xem có lỗi API không
4. Check terminal backend xem có lỗi query không

### Vấn đề: API trả về empty array

**Kiểm tra:**
1. Database có notifications cho user ID của bạn không?
   ```bash
   cd Backend
   node scripts/view-database.js
   ```
2. Token có đúng không?
3. User ID trong token có match với notifications không?

### Vấn đề: Lỗi database query

**Nguyên nhân thường gặp:**
- SQL Server syntax trong PostgreSQL
- Field name không đúng (sender_id vs actor_id, content vs message)
- Boolean vs Integer (is_read: true/false vs 0/1)

**Đã fix:**
- ✅ Sử dụng `db-wrapper` thay vì `pool` + `sql`
- ✅ Map đúng fields: `actor_id` → `sender_id`, `message` → `content`
- ✅ Dùng boolean: `is_read = true/false`

## 📝 Notes:

- Notifications được tạo tự động khi có events như: like, comment, friend request
- Database triggers có thể được sử dụng để tự động tạo notifications
- Frontend sử dụng Socket.IO để nhận real-time notifications
- Badge số đỏ cập nhật tự động khi có notification mới

## ✨ Expected Results:

Sau khi test thành công, bạn sẽ thấy:
- ✅ 5 notifications hiển thị trên trang Notifications
- ✅ Badge số "4" trên icon notification (4 chưa đọc)
- ✅ Click notification → status chuyển thành "read"
- ✅ Click "Đánh dấu tất cả" → badge biến mất
- ✅ Xóa notification → notification bị remove khỏi danh sách
