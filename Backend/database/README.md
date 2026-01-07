# Database Migration Guide

## Quick Start - Chạy Migration trên Render

### Cách 1: Sử dụng Render Shell (Khuyến nghị)

1. **Vào Render Dashboard**: https://dashboard.render.com
2. **Chọn PostgreSQL database** của bạn (không phải web service)
3. **Vào tab "Shell"** (hoặc "Connect")
4. **Copy nội dung file `postgres-migration.sql`**
5. **Paste vào shell** và nhấn Enter để chạy

### Cách 2: Sử dụng psql từ máy local

```bash
# Lấy DATABASE_URL từ Render Environment Variables
# Format: postgresql://user:password@host:5432/database

psql "postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/hvtsocial" -f postgres-migration.sql
```

### Cách 3: Sử dụng GUI Tool (DBeaver, pgAdmin, TablePlus)

1. Kết nối đến PostgreSQL database trên Render bằng DATABASE_URL
2. Mở file `postgres-migration.sql`
3. Execute script

---

## Kiểm tra Migration thành công

Sau khi chạy migration, verify bằng cách:

```sql
-- Xem tất cả các bảng
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Kiểm tra cấu trúc bảng users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

Bạn sẽ thấy kết quả như sau:
- `users` table với tất cả các cột: id, username, email, password, full_name, date_of_birth, gender, reset_otp, etc.
- 17+ tables khác (posts, comments, likes, friendships, etc.)

---

## Lưu ý quan trọng

⚠️ **QUAN TRỌNG**:
- Migration script sử dụng `CREATE TABLE IF NOT EXISTS` nên an toàn để chạy nhiều lần
- Nếu bảng đã tồn tại, script sẽ không làm gì cả
- Script tự động tạo indexes để tối ưu performance

---

## Troubleshooting

### Lỗi: "permission denied"
- Đảm bảo bạn đang kết nối với user có quyền CREATE TABLE
- Trên Render, user mặc định có đủ quyền

### Lỗi: "relation already exists"
- Bảng đã tồn tại - không vấn đề gì
- Script sẽ skip việc tạo bảng đó

### Lỗi: "database does not exist"
- Kiểm tra lại DATABASE_URL
- Đảm bảo PostgreSQL database đã được tạo trên Render

---

## Production Checklist

Sau khi migration thành công:

- [x] Cập nhật biến môi trường `DATABASE_URL` trên Render Web Service
- [x] Cập nhật `CORS_ORIGINS` bao gồm domain Vercel
- [x] Deploy lại web service
- [ ] Test registration/login từ frontend
- [ ] Monitor logs để đảm bảo không có lỗi
