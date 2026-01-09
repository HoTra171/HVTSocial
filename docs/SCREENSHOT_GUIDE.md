# 📸 Hướng dẫn chụp Screenshots cho Portfolio

## 🎯 Mục tiêu
Chụp 6 ảnh/GIF chất lượng cao demo các tính năng chính của HVTSocial.

## 📋 Danh sách Screenshots cần chụp

### 1. **Feed Demo** (`feed_demo.png` hoặc `.gif`)
**Tính năng**: Infinite scroll news feed với posts
- ✅ Hiển thị nhiều posts với text, images, videos
- ✅ Like/Comment buttons visible
- ✅ Scroll để show infinite loading
- 📐 Khuyến nghị: 1200x800px, mobile + desktop view

**GIF**: Scroll qua nhiều posts → like một post → comment appears

---

### 2. **Chat Interface** (`chat_demo.png` hoặc `.gif`)
**Tính năng**: Real-time messaging
- ✅ Chat 1-1 với tin nhắn text + images
- ✅ Typing indicator hiển thị
- ✅ Online status của partner
- ✅ Message timestamps
- 📐 Khuyến nghị: 1000x700px

**GIF**: Gõ tin nhắn → send → receive message realtime → typing indicator

---

### 3. **User Profile** (`profile_demo.png`)
**Tính năng**: Profile page với avatar, cover photo, posts grid
- ✅ Avatar + Background image
- ✅ Bio, địa chỉ, stats (friends, posts)
- ✅ Grid layout của user's posts
- ✅ Edit profile button (nếu là own profile)
- 📐 Khuyến nghị: 1200x1000px (full page)

---

### 4. **Notifications** (`notification_demo.png` hoặc `.gif`)
**Tính năng**: Real-time notification system
- ✅ Notification dropdown/page với các loại thông báo:
  - Friend request
  - Like notification
  - Comment notification
  - New message notification
- ✅ Unread badge/count
- ✅ Timestamps
- 📐 Khuyến nghị: 800x600px

**GIF**: Click notification icon → dropdown appears → click một notification → navigate

---

### 5. **Create Post** (`post_demo.png` hoặc `.gif`)
**Tính năng**: Post creation modal/page
- ✅ Text input field
- ✅ Image/Video upload preview
- ✅ Visibility selector (Public/Friends/Private)
- ✅ Post button
- 📐 Khuyến nghị: 900x700px

**GIF**: Type text → upload image → select visibility → post → see post in feed

---

### 6. **Comments Section** (`comment_demo.png`)
**Tính năng**: Comment interaction
- ✅ Post với nhiều comments
- ✅ Comment input box
- ✅ Like buttons trên comments
- ✅ Nested replies (nếu có)
- ✅ Timestamps
- 📐 Khuyến nghị: 1000x800px

---

## 🛠️ Tools khuyến nghị

### Chụp Screenshot:
- **Windows**: `Win + Shift + S` (Snipping Tool)
- **Mac**: `Cmd + Shift + 4`
- **Extension**: Nimbus Screenshot, Awesome Screenshot

### Tạo GIF:
- **ScreenToGif** (Windows) - FREE: https://www.screentogif.com/
- **Kap** (Mac) - FREE: https://getkap.co/
- **LICEcap** (Cross-platform): https://www.cockos.com/licecap/

### Chỉnh sửa:
- **Figma/Canva**: Thêm borders, shadows, annotations
- **Photoshop/GIMP**: Crop, resize, optimize

---

## 📏 Best Practices

1. **Resolution**:
   - PNG: 1200-1600px width (retina ready)
   - GIF: 800-1000px width (file size < 5MB)

2. **Optimization**:
   - PNG: TinyPNG.com hoặc Squoosh.app
   - GIF: Gifsicle, ezgif.com

3. **Consistency**:
   - Dùng chung 1 account/data
   - Same browser/theme
   - Professional content (no test data like "asdasd")

4. **Lighting/Theme**:
   - Prefer light mode (dễ đọc hơn)
   - Hoặc có cả dark mode variant

5. **Context**:
   - Có thể zoom browser đến 90% để fit nhiều nội dung hơn
   - Hide browser UI (F11 fullscreen) nếu cần

---

## 📂 Naming Convention

Lưu file vào `docs/assets/` với tên:
- `feed_demo.png` hoặc `feed_demo.gif`
- `chat_demo.png` hoặc `chat_demo.gif`
- `profile_demo.png`
- `notification_demo.png` hoặc `notification_demo.gif`
- `post_demo.png` hoặc `post_demo.gif`
- `comment_demo.png`

---

## ✅ Checklist sau khi hoàn thành

- [ ] Đã chụp đủ 6 screenshots/GIFs
- [ ] File size hợp lý (< 5MB mỗi file)
- [ ] Resolution đẹp (1200px+ width)
- [ ] Không có sensitive data (passwords, tokens)
- [ ] Professional content (no Lorem Ipsum spam)
- [ ] Đã optimize images
- [ ] Commit lên GitHub

---

**💡 Tip**: Sau khi có ảnh, update README.md paths từ:
```markdown
![Feed](docs/assets/feed_demo.png)
```

Sang đúng extension (`.gif` nếu là GIF)
