# Debug: Lỗi hiển thị ảnh trong tin nhắn chat trên mobile

## Vấn đề
Khi truy cập ứng dụng trên điện thoại, các ảnh trong tin nhắn chat không hiển thị được và chỉ hiện icon "?" màu xanh.

## Nguyên nhân có thể
1. **URL ảnh không đầy đủ** - URL trong database bị thiếu protocol (http/https)
2. **CORS issue** - Cloudinary chặn request từ mobile browser
3. **Network issue** - Mobile không kết nối được với Cloudinary
4. **Image format không hỗ trợ** - Format ảnh không được mobile browser hỗ trợ

## Giải pháp đã áp dụng

### 1. Tạo helper function (Frontend/src/utils/imageHelper.js)
- `getFullImageUrl()`: Đảm bảo URL ảnh luôn đầy đủ
- `handleImageError()`: Xử lý lỗi khi ảnh không load được

### 2. Cập nhật components
- [Chatbox.jsx](../Frontend/src/page/Chatbox.jsx)
- [MessageWithRetry.jsx](../Frontend/src/components/MessageWithRetry.jsx)

Cả 2 components đã được cập nhật để:
- Sử dụng `getFullImageUrl()` cho tất cả URL ảnh
- Thêm `onError` handler để fallback về ảnh default
- Log chi tiết khi có lỗi

## Cách debug

### Bước 1: Kiểm tra console log trên mobile
1. Kết nối điện thoại với máy tính
2. Mở Chrome DevTools → Remote devices
3. Inspect ứng dụng trên mobile
4. Xem console logs:
   - ✅ `Valid image URL:` - URL đúng
   - ⚠️ `Relative path detected:` - URL thiếu domain
   - ⚠️ `URL without protocol:` - URL thiếu http/https
   - ❌ `Image load error:` - Ảnh không tải được

### Bước 2: Kiểm tra URL trong database
```sql
SELECT TOP 10
    id,
    message_type,
    media_url,
    LEN(media_url) as url_length,
    LEFT(media_url, 50) as url_preview
FROM messages
WHERE message_type = 'image'
ORDER BY created_at DESC;
```

URL hợp lệ phải:
- Bắt đầu với `https://res.cloudinary.com/`
- Có độ dài > 50 ký tự

### Bước 3: Test upload ảnh mới
1. Gửi 1 ảnh mới từ mobile
2. Kiểm tra console log xem URL có đúng không
3. Kiểm tra ảnh có hiển thị ngay không

### Bước 4: Kiểm tra Cloudinary CORS
1. Truy cập Cloudinary Dashboard
2. Settings → Security → Allowed fetch domains
3. Đảm bảo có:
   - `*` (cho phép tất cả) hoặc
   - `https://hvt-social.vercel.app`
   - `https://hvtsocial-backend.onrender.com`

### Bước 5: Test trực tiếp URL
1. Copy URL ảnh từ console log
2. Paste vào browser mới (incognito mode)
3. Kiểm tra xem ảnh có mở được không

## Kết quả mong đợi
- Tất cả ảnh trong tin nhắn hiển thị bình thường trên mobile
- Console log hiện `✅ Valid image URL` cho mỗi ảnh
- Không có error "Image load error" trong console

## Nếu vẫn còn lỗi

### Trường hợp 1: URL đúng nhưng vẫn không load
→ Vấn đề CORS hoặc Cloudinary
→ Giải pháp: Kiểm tra Cloudinary settings

### Trường hợp 2: URL không đầy đủ
→ Vấn đề backend khi save URL
→ Giải pháp: Kiểm tra [Backend/routes/upload.js](../Backend/routes/upload.js) dòng 115

### Trường hợp 3: Một số ảnh OK, một số lỗi
→ Vấn đề dữ liệu cũ trong database
→ Giải pháp: Chạy migration script để fix URL cũ

### Migration script để fix URL cũ (nếu cần)
```sql
-- Kiểm tra các URL không hợp lệ
SELECT id, media_url
FROM messages
WHERE message_type = 'image'
  AND media_url IS NOT NULL
  AND media_url NOT LIKE 'http%';

-- Update nếu tìm thấy (CẨNH THẬN!)
-- UPDATE messages
-- SET media_url = 'https://' + media_url
-- WHERE message_type = 'image'
--   AND media_url IS NOT NULL
--   AND media_url NOT LIKE 'http%';
```

## Test checklist
- [ ] Gửi ảnh mới từ mobile → Kiểm tra hiển thị
- [ ] Gửi ảnh mới từ desktop → Kiểm tra hiển thị trên mobile
- [ ] Kiểm tra console log có warning/error không
- [ ] Kiểm tra ảnh cũ trong database
- [ ] Test trên nhiều loại mobile browser (Chrome, Safari)
- [ ] Test với/không wifi (mobile data)

## Liên hệ
Nếu vẫn gặp vấn đề, hãy:
1. Capture screenshot console log
2. Note lại URL ảnh bị lỗi
3. Kiểm tra network tab trong DevTools
