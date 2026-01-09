# Privacy Settings - Hướng dẫn sử dụng

## Tổng quan
Tính năng Privacy Settings cho phép người dùng tùy chỉnh quyền riêng tư của mình trên HVTSocial, bao gồm:
- Hiển thị hồ sơ (Profile Visibility)
- Hiển thị bài viết (Post Visibility)
- Cho phép lời mời kết bạn (Allow Friend Requests)
- Hiển thị trạng thái trực tuyến (Show Online Status)

## Cấu trúc

### Backend

#### 1. Database Migration
File: [Backend/database/migrations/006_add_privacy_settings.sql](../Backend/database/migrations/006_add_privacy_settings.sql)

Thêm 4 cột vào bảng `users`:
```sql
- profile_visibility NVARCHAR(20) DEFAULT 'public' -- public, friends, private
- post_visibility NVARCHAR(20) DEFAULT 'public'    -- public, friends
- allow_friend_requests BIT DEFAULT 1              -- true/false
- show_online_status BIT DEFAULT 1                 -- true/false
```

**Chạy migration:**
```bash
cd Backend
# SQL Server Management Studio (SSMS) hoặc
sqlcmd -S localhost -d HVTSocial -i database/migrations/006_add_privacy_settings.sql
```

#### 2. API Endpoints
File: [Backend/controllers/userController.js](../Backend/controllers/userController.js)

**GET `/api/users/privacy-settings`**
- Lấy cài đặt quyền riêng tư của user hiện tại
- Yêu cầu: Bearer Token
- Response:
```json
{
  "profile_visibility": "public",
  "post_visibility": "public",
  "allow_friend_requests": true,
  "show_online_status": true
}
```

**PUT `/api/users/privacy-settings`**
- Cập nhật cài đặt quyền riêng tư
- Yêu cầu: Bearer Token
- Body (một hoặc nhiều fields):
```json
{
  "profile_visibility": "friends",
  "post_visibility": "public",
  "allow_friend_requests": false,
  "show_online_status": true
}
```
- Response:
```json
{
  "message": "Privacy settings updated successfully"
}
```

#### 3. Routes
File: [Backend/routes/userRoutes.js](../Backend/routes/userRoutes.js)

Routes đã được thêm vào `/api/users`:
- `GET /api/users/privacy-settings` → `getPrivacySettings`
- `PUT /api/users/privacy-settings` → `updatePrivacySettings`

### Frontend

#### 1. Privacy Settings Page
File: [Frontend/src/page/PrivacySettings.jsx](../Frontend/src/page/PrivacySettings.jsx)

Component chính hiển thị giao diện cài đặt quyền riêng tư với:
- Radio buttons cho Profile & Post Visibility
- Toggle switches cho Friend Requests & Online Status
- Real-time update với API
- Fallback to localStorage khi offline

#### 2. Navigation
Đã thêm vào:
- **Sidebar**: Menu item "Quyền riêng tư" với icon Shield
  - File: [Frontend/src/assets/assets.js](../Frontend/src/assets/assets.js)
- **Route**: `/privacy-settings`
  - File: [Frontend/src/App.jsx](../Frontend/src/App.jsx)

## Cách sử dụng

### Truy cập Privacy Settings

#### Desktop:
1. Mở sidebar bên trái
2. Click vào "Quyền riêng tư" (icon Shield)

#### Mobile:
1. Mở menu
2. Chọn "Quyền riêng tư"

### Các tùy chọn

#### 1. Hiển thị hồ sơ (Profile Visibility)
- **Công khai**: Mọi người có thể xem hồ sơ
- **Bạn bè**: Chỉ bạn bè có thể xem
- **Riêng tư**: Chỉ bạn có thể xem

#### 2. Hiển thị bài viết (Post Visibility)
- **Công khai**: Mọi người có thể xem bài viết
- **Bạn bè**: Chỉ bạn bè có thể xem

#### 3. Lời mời kết bạn (Friend Requests)
- **Bật**: Cho phép người khác gửi lời mời kết bạn
- **Tắt**: Không cho phép lời mời kết bạn mới

#### 4. Trạng thái trực tuyến (Online Status)
- **Bật**: Bạn bè có thể thấy khi bạn online
- **Tắt**: Ẩn trạng thái online

## Testing

### Test Backend API

#### 1. Chạy migration
```bash
cd Backend
# Chạy migration SQL
```

#### 2. Test với Postman/Thunder Client

**GET Privacy Settings:**
```http
GET http://localhost:5000/api/users/privacy-settings
Authorization: Bearer <your_token>
```

**UPDATE Privacy Settings:**
```http
PUT http://localhost:5000/api/users/privacy-settings
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "profile_visibility": "friends",
  "allow_friend_requests": false
}
```

### Test Frontend

#### 1. Development
```bash
cd Frontend
npm run dev
```

#### 2. Kiểm tra
- [ ] Truy cập `/privacy-settings`
- [ ] Kiểm tra hiển thị trên Desktop (sidebar visible)
- [ ] Kiểm tra hiển thị trên Mobile (responsive)
- [ ] Thay đổi Profile Visibility → Check API call
- [ ] Thay đổi Post Visibility → Check API call
- [ ] Toggle Friend Requests → Check API call
- [ ] Toggle Online Status → Check API call
- [ ] Reload page → Settings được load đúng

#### 3. Network Tab
Kiểm tra console log:
- `GET /api/users/privacy-settings` khi load page
- `PUT /api/users/privacy-settings` khi thay đổi setting
- Toast notifications hiển thị đúng

## Troubleshooting

### Lỗi: "Failed to fetch privacy settings"
**Nguyên nhân:** Backend chưa có cột privacy trong database
**Giải pháp:** Chạy migration `006_add_privacy_settings.sql`

### Lỗi: "Privacy settings updated successfully" nhưng không lưu
**Nguyên nhân:** Token không hợp lệ
**Giải pháp:** Đăng xuất và đăng nhập lại

### UI không responsive trên mobile
**Nguyên nhân:** CSS classes bị thiếu
**Giải pháp:** Kiểm tra file [PrivacySettings.jsx](../Frontend/src/page/PrivacySettings.jsx) có `min-h-screen` và `max-w-2xl mx-auto`

### Menu item "Quyền riêng tư" không xuất hiện
**Nguyên nhân:** `menuItemsData` chưa có item
**Giải pháp:** Kiểm tra file [assets.js](../Frontend/src/assets/assets.js) đã import `Shield` icon và thêm vào `menuItemsData`

## Future Enhancements

### 1. Enforce Privacy Settings
Hiện tại các settings chỉ được lưu vào database. Cần implement logic để:
- Filter posts dựa trên `post_visibility`
- Restrict profile access dựa trên `profile_visibility`
- Block friend requests nếu `allow_friend_requests = false`
- Hide online status nếu `show_online_status = false`

### 2. Additional Settings
- Block list (danh sách chặn)
- Two-factor authentication
- Email notifications preferences
- Data export (GDPR compliance)

### 3. Activity Log
- Log mọi thay đổi privacy settings
- Hiển thị lịch sử thay đổi

## Related Files

### Backend
- [Backend/database/migrations/006_add_privacy_settings.sql](../Backend/database/migrations/006_add_privacy_settings.sql)
- [Backend/controllers/userController.js](../Backend/controllers/userController.js)
- [Backend/routes/userRoutes.js](../Backend/routes/userRoutes.js)

### Frontend
- [Frontend/src/page/PrivacySettings.jsx](../Frontend/src/page/PrivacySettings.jsx)
- [Frontend/src/assets/assets.js](../Frontend/src/assets/assets.js)
- [Frontend/src/App.jsx](../Frontend/src/App.jsx)

## API Documentation
Swagger docs: `http://localhost:5000/api-docs`
- Tag: **Users**
- Endpoints: `GET /users/privacy-settings`, `PUT /users/privacy-settings`
