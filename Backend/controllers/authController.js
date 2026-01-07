import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db-wrapper.js';
import { sendOtpEmail } from "../services/mailService.js";
import { successResponse, errorResponse } from '../utils/response.js';
import crypto from 'crypto';

// Helper: Generate Tokens (Access + Refresh)
const generateTokens = async (user) => {
  // Access Token (15m)
  const accessToken = jwt.sign(
    { userId: user.id, id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Refresh Token (7d)
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Save to DB (Supports both MSSQL/PG via db-wrapper ideally, but check syntax compatibility)
  // Simple INSERT works on both usually if strict ANSI.
  // Using db.request() pattern from existing code.
  await db.request()
    .input('user_id', user.id)
    .input('token', refreshToken)
    .input('expires_at', expiresAt)
    .query(`
       INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES (@user_id, @token, @expires_at)
    `);

  return { accessToken, refreshToken };
};

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

    // 4. Kiểm tra email hoặc username đã tồn tại
    const checkQuery = `
      SELECT * FROM users
      WHERE email = @email OR username = @username
    `;

    const checkResult = await db.request()
      .input('email', email)
      .input('username', username)
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
      VALUES (@full_name, @username, @email, @password, @date_of_birth, @gender)
      RETURNING *
    `;

    const result = await db.request()
      .input('full_name', full_name)
      .input('username', username)
      .input('email', email)
      .input('password', hashedPassword)
      .input('date_of_birth', date_of_birth || null)
      .input('gender', gender || null)
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
      return errorResponse(res, 'Vui lòng nhập email và mật khẩu', 400);
    }

    // 2. Tìm user theo email
    const result = await db.request()
      .input('email', email)
      .query('SELECT * FROM users WHERE email = @email');

    if (result.recordset.length === 0) {
      return errorResponse(res, 'Email hoặc mật khẩu không đúng', 401);
    }

    const user = result.recordset[0];

    // 3. Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return errorResponse(res, 'Email hoặc mật khẩu không đúng', 401);
    }

    // 4. Tạo Tokens (Refresh + Access)
    const { accessToken, refreshToken } = await generateTokens(user);

    // 5. Xóa password khỏi response
    delete user.password;

    // 6. Trả về response
    return successResponse(res, {
      user,
      token: accessToken, // Frontend expects 'token'
      accessToken,
      refreshToken
    }, 'Đăng nhập thành công');

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Lỗi server, vui lòng thử lại sau');
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

    // 1. Tìm user theo email
    const userResult = await db
      .request()
      .input("email", email)
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
    await db
      .request()
      .input("id", user.id)
      .input("reset_otp", otp)
      .input("reset_otp_expires", expires)
      .input("reset_otp_attempts", 0)
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

    // 1. Lấy thông tin OTP của user
    const userResult = await db
      .request()
      .input("email", email)
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
      await db
        .request()
        .input("id", user.id)
        .input("reset_otp_attempts", (user.reset_otp_attempts || 0) + 1)
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
    await db
      .request()
      .input("id", user.id)
      .input("password", hashedPassword)
      .query(`
        UPDATE users
        SET
          password = @password,
          reset_otp = NULL,
          reset_otp_expires = NULL,
          reset_otp_attempts = 0,
          updated_at = CURRENT_TIMESTAMP
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

    // 1. Lấy mật khẩu hiện tại trong DB
    const result = await db
      .request()
      .input("id", userId)
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
      .input("id", userId)
      .input("password", hashedNewPassword)
      .query(`
        UPDATE users
        SET password = @password, updated_at = CURRENT_TIMESTAMP
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

/* ================= REFRESH TOKEN ================= */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'Vui lòng cung cấp refresh token', 400);

    // 1. Kiểm tra token trong DB
    const result = await db.request()
      .input('token', refreshToken)
      .query('SELECT * FROM refresh_tokens WHERE token = @token');

    if (result.recordset.length === 0) {
      return errorResponse(res, 'Refresh token không hợp lệ', 403);
    }

    const storedToken = result.recordset[0];

    // 2. Kiểm tra thu hồi (Reuse Detection)
    if (storedToken.revoked) {
      await db.request()
        .input('user_id', storedToken.user_id)
        .query('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = @user_id');

      return errorResponse(res, 'Phát hiện bất thường. Vui lòng đăng nhập lại.', 403);
    }

    // 3. Kiểm tra hết hạn
    if (new Date() > new Date(storedToken.expires_at)) {
      return errorResponse(res, 'Token đã hết hạn, vui lòng đăng nhập lại', 403);
    }

    // 4. Lấy thông tin user
    const userResult = await db.request()
      .input('id', storedToken.user_id)
      .query('SELECT * FROM users WHERE id = @id');

    if (userResult.recordset.length === 0) return errorResponse(res, 'User không tồn tại', 403);
    const user = userResult.recordset[0];

    // 5. Rotate
    const tokens = await generateTokens(user);

    await db.request()
      .input('id', storedToken.id)
      .input('new_token', tokens.refreshToken)
      .query(`
            UPDATE refresh_tokens 
            SET revoked = 1, replaced_by_token = @new_token 
            WHERE id = @id
        `);

    return successResponse(res, tokens, 'Làm mới token thành công');

  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse(res, 'Lỗi Server');
  }
};

/* ================= LOGOUT ================= */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await db.request()
        .input('token', refreshToken)
        .query('UPDATE refresh_tokens SET revoked = 1 WHERE token = @token');
    }

    return successResponse(res, null, 'Đăng xuất thành công');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

