# Hướng Dẫn Sử Dụng Trang Admin (Admin Dashboard)

Tài liệu này hướng dẫn cách cấp quyền Admin và sử dụng các chức năng quản trị hệ thống.

## 1. Cấp Quyền Admin (Trên Railway / PostgreSQL)
Hệ thống bạn đang chạy trên Railway sử dụng PostgreSQL. Bạn cần chạy câu lệnh SQL chuẩn Postgres để cấp quyền Admin.

### Bước 1: Lấy thông tin kết nối Database
**QUAN TRỌNG:** Vì bạn đang chạy script từ máy tính cá nhân (không phải trên server Railway), bạn phải dùng **Public Connection URL**.

1. Vào Railway Dashboard > Chọn PostgreSQL.
2. Chọn tab **Connect**.
3. Tìm mục **Public Networking** (nếu chưa có thì bấm "Enable").
4. Copy dòng **Postgres Connection URL** (thường có dạng `postgresql://...roundhouse.proxy.rlwy.net...`).
   *   🚫 Đừng dùng link có đuôi `.internal` (đó là link nội bộ, chỉ server mới dùng được).

### Bước 2: Chạy câu lệnh SQL
Copy và dán đoạn code sau vào ô Query rồi bấm **Run** (Cmd+Enter):

```sql
-- Thay số 1 bằng ID người dùng thực tế của bạn
DO $$
DECLARE
    target_user_id INT := 1;  -- <== SỬA SỐ NÀY THÀNH ID CỦA BẠN
    admin_role_id INT;
BEGIN
    -- 1. Lấy ID của role 'admin'
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';

    -- 2. Kiểm tra và cấp quyền
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id AND role_id = admin_role_id) THEN
        INSERT INTO user_roles (user_id, role_id) VALUES (target_user_id, admin_role_id);
        RAISE NOTICE 'Đã cấp quyền Admin thành công cho user %', target_user_id;
    ELSE
        RAISE NOTICE 'User % đã là Admin rồi.', target_user_id;
    END IF;
END $$;
```

> **Cách lấy ID:** Bạn có thể chạy query `SELECT id, email, full_name FROM users;` trước để xem danh sách user và tìm ID của mình.

### Bước 3: Đăng nhập lại
Sau khi chạy lệnh SQL, hãy **Đăng xuất (Logout)** khỏi website và **Đăng nhập lại** để hệ thống cập nhật quyền mới.

---

## 2. Truy Cập Admin Dashboard
1. Sau khi đăng nhập lại.
2. Nhìn vào thanh **Sidebar** bên trái, bạn sẽ thấy mục **"Admin Panel"** 🛡️.
3. Bấm vào đó để mở Dashboard.

---

## 3. Các Chức Năng Quản Trị
*   **Thống Kê (Stats):** Xem tổng quan Users, Posts, Comments.
*   **Quản Lý (Management):**
    *   `Active` 🟢: Tài khoản bình thường.
    *   `Suspended` 🔴: Tài khoản đã bị khóa. Admin có thể bấm nút Khóa/Mở khóa.

---

## Lưu ý quan trọng
*   Nếu không thấy menu Admin sau khi chạy SQL: Hãy chắc chắn bạn đã đăng xuất và đăng nhập lại.
*   Không xóa quyền Admin của chính mình.
