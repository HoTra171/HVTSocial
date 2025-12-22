import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import sql from 'mssql';
import { sendOtpEmail } from "../services/mailService.js";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ==================== ĐĂNG KÝ ====================
export const register = async (req, res) => {
  try {
    const { full_name, username, email, password, date_of_birth, gender } = req.body;

    // 1. Validate input
    if (!full_name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // 3. Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    const db = await pool;

    // 4. Kiểm tra email hoặc username đã tồn tại
    const checkQuery = `
      SELECT * FROM users 
      WHERE email = @email OR username = @username
    `;

    const checkResult = await db.request()
      .input('email', sql.VarChar, email)
      .input('username', sql.NVarChar, username)
      .query(checkQuery);

    if (checkResult.recordset.length > 0) {
      const existing = checkResult.recordset[0];
      if (existing.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
      if (existing.username === username) {
        return res.status(400).json({
          success: false,
          message: 'Username đã được sử dụng'
        });
      }
    }

    // 5. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Tạo user mới
    const insertQuery = `
      INSERT INTO users (full_name, username, email, password, date_of_birth, gender)
      OUTPUT INSERTED.*
      VALUES (@full_name, @username, @email, @password, @date_of_birth, @gender)
    `;

    const result = await db.request()
      .input('full_name', sql.NVarChar, full_name)
      .input('username', sql.NVarChar, username)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('date_of_birth', sql.Date, date_of_birth || null)
      .input('gender', sql.VarChar, gender || null)
      .query(insertQuery);

    const newUser = result.recordset[0];

    // 7. Tạo JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 8. Xóa password khỏi response
    delete newUser.password;

    // 9. Trả về response
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      user: newUser
    });

  } catch (error) {
    console.error(' Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau'
    });
  }
};

// ==================== ĐĂNG NHẬP ====================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    const db = await pool;

    // 2. Tìm user theo email
    const query = `SELECT * FROM users WHERE email = @email`;

    const result = await db.request()
      .input('email', sql.VarChar, email)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const user = result.recordset[0];

    // 3. Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // 4. Tạo JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Xóa password khỏi response
    delete user.password;

    // 6. Trả về response
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user
    });

  } catch (error) {
    console.error(' Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau'
    });
  }
};

// Gửi OTP để khôi phục mật khẩu
// POST /api/auth/request-reset-otp
// Body: { email }
export const requestResetOtp = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập email" });
    }

    const poolConn = await pool;

    // 1. Tìm user theo email
    const userResult = await poolConn
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT id, email FROM users WHERE email = @email");

    // Không tiết lộ email tồn tại hay không
    if (userResult.recordset.length === 0) {
      return res.status(200).json({
        message:
          "Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi đến email của bạn.",
      });
    }

    const user = userResult.recordset[0];

    // 2. Tạo OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // 3. Lưu OTP vào bảng users
    await poolConn
      .request()
      .input("id", sql.Int, user.id)
      .input("reset_otp", sql.VarChar, otp)
      .input("reset_otp_expires", sql.DateTime, expires)
      .input("reset_otp_attempts", sql.Int, 0)
      .query(`
        UPDATE users
        SET 
          reset_otp = @reset_otp,
          reset_otp_expires = @reset_otp_expires,
          reset_otp_attempts = @reset_otp_attempts
        WHERE id = @id
      `);

    // 4. Gửi OTP qua email
    await sendOtpEmail(email, otp);
    console.log("OTP for", email, "is:", otp);

    return res.status(200).json({
      message:
        "Mã OTP đã được gửi đến email của bạn (nếu email tồn tại trong hệ thống).",
    });
  } catch (error) {
    console.error("requestResetOtp error:", error);
    return res
      .status(500)
      .json({ message: "Có lỗi xảy ra, vui lòng thử lại sau." });
  }
};



// Đặt lại mật khẩu bằng OTP
// POST /api/auth/reset-password-otp
// Body: { email, otp, newPassword }
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đủ email, OTP và mật khẩu mới" });
    }

    const poolConn = await pool;

    // 1. Lấy thông tin OTP của user
    const userResult = await poolConn
      .request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT 
          id,
          reset_otp,
          reset_otp_expires,
          reset_otp_attempts
        FROM users
        WHERE email = @email
      `);

    if (userResult.recordset.length === 0) {
      return res
        .status(400)
        .json({ message: "OTP không đúng hoặc đã hết hạn." });
    }

    const user = userResult.recordset[0];
    const now = new Date();
    const MAX_ATTEMPTS = 5;

    // 2. Kiểm tra số lần nhập sai
    if (user.reset_otp_attempts >= MAX_ATTEMPTS) {
      return res.status(400).json({
        message:
          "Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu OTP mới.",
      });
    }

    // 3. Kiểm tra OTP & hạn dùng
    if (
      !user.reset_otp ||
      !user.reset_otp_expires ||
      new Date(user.reset_otp_expires) <= now ||
      user.reset_otp !== otp
    ) {
      // Tăng số lần nhập sai
      await poolConn
        .request()
        .input("id", sql.Int, user.id)
        .input(
          "reset_otp_attempts",
          sql.Int,
          (user.reset_otp_attempts || 0) + 1
        )
        .query(`
          UPDATE users
          SET reset_otp_attempts = @reset_otp_attempts
          WHERE id = @id
        `);

      return res
        .status(400)
        .json({ message: "OTP không đúng hoặc đã hết hạn." });
    }

    // 4. OTP hợp lệ -> hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Cập nhật mật khẩu và xoá OTP
    await poolConn
      .request()
      .input("id", sql.Int, user.id)
      .input("password", sql.VarChar, hashedPassword)
      .query(`
        UPDATE users
        SET 
          password = @password,
          reset_otp = NULL,
          reset_otp_expires = NULL,
          reset_otp_attempts = 0,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    return res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.error("resetPasswordWithOtp error:", error);
    return res
      .status(500)
      .json({ message: "Có lỗi xảy ra, vui lòng thử lại sau." });
  }
};


// ĐỔI MẬT KHẨU KHI ĐÃ ĐĂNG NHẬP
// PUT /api/auth/change-password
// Body: { currentPassword, newPassword }
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới",
      });
    }

    // userId đã được gắn trong authMiddleware từ JWT
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không xác định được người dùng, vui lòng đăng nhập lại",
      });
    }

    const db = await pool;

    // 1. Lấy mật khẩu hiện tại trong DB
    const result = await db
      .request()
      .input("id", sql.Int, userId)
      .query("SELECT password FROM users WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    const user = result.recordset[0];

    // 2. So sánh mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    // 3. Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 4. Cập nhật vào DB
    await db
      .request()
      .input("id", sql.Int, userId)
      .input("password", sql.VarChar, hashedNewPassword)
      .query(`
        UPDATE users
        SET password = @password, updated_at = GETDATE()
        WHERE id = @id
      `);

    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra, vui lòng thử lại sau.",
    });
  }
};

