import dotenv from 'dotenv';
import { pool } from '../config/db.js';

dotenv.config();

const email = process.argv[2];

if (!email) {
    console.error('❌ Vui lòng cung cấp email của user cần set quyền Admin!');
    console.error('👉 Cách dùng: node scripts/setAdmin.js <email>');
    process.exit(1);
}

const setAdmin = async () => {
    try {
        console.log(`🔍 Đang tìm user với email: ${email}...`);

        // 1. Tìm User
        const userRes = await pool.request()
            .input('email', email)
            .query('SELECT id, full_name FROM users WHERE email = @email');

        if (userRes.recordset.length === 0) {
            console.error('❌ Không tìm thấy user nào với email này.');
            process.exit(1);
        }

        const user = userRes.recordset[0];
        console.log(`✅ Đã tìm thấy: ${user.full_name} (ID: ${user.id})`);

        // 2. Tìm Admin Role ID
        const roleRes = await pool.request()
            .query("SELECT id FROM roles WHERE name = 'admin'");

        if (roleRes.recordset.length === 0) {
            console.error('❌ Lỗi: Role "admin" chưa được tạo trong database.');
            process.exit(1);
        }

        const adminRoleId = roleRes.recordset[0].id;

        // 3. Cấp quyền
        // Kiểm tra đã có chưa
        const checkRes = await pool.request()
            .input('user_id', user.id)
            .input('role_id', adminRoleId)
            .query('SELECT * FROM user_roles WHERE user_id = @user_id AND role_id = @role_id');

        if (checkRes.recordset.length > 0) {
            console.log('⚠️ User này ĐÃ là Admin rồi.');
        } else {
            await pool.request()
                .input('user_id', user.id)
                .input('role_id', adminRoleId)
                .query('INSERT INTO user_roles (user_id, role_id) VALUES (@user_id, @role_id)');
            console.log('🎉 Cấp quyền Admin THÀNH CÔNG!');
        }

        console.log('👉 Vui lòng Đăng xuất và Đăng nhập lại để áp dụng quyền mới.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
};

// Đợi 1 chút để DB connect
setTimeout(() => {
    setAdmin();
}, 1000);
