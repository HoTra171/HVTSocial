import express from 'express';
import {
  register,
  login,
  requestResetOtp,
  resetPasswordWithOtp,
  changePassword,
  refreshToken,
  logout,
} from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import { validate, registerSchema, loginSchema } from '../middlewares/validationMiddleware.js';

// Rate limiter: 10 requests per 15 mins for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10, // max 10
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Quá nhiều lần thử, vui lòng quay lại sau 15 phút.' }
});

const router = express.Router();

// ... (swagger docs) ...
router.post('/register', authLimiter, validate(registerSchema), register);

// ... (swagger docs) ...
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/request-reset-otp:
 *   post:
 *     summary: Yêu cầu OTP reset mật khẩu
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP đã được gửi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/request-reset-otp', authLimiter, requestResetOtp);

/**
 * @swagger
 * /api/auth/reset-password-otp:
 *   post:
 *     summary: Reset mật khẩu bằng OTP
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset mật khẩu thành công
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/reset-password-otp', authLimiter, resetPasswordWithOtp);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Đổi mật khẩu (yêu cầu đăng nhập)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/change-password', authMiddleware, changePassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 id:
 *                   type: integer
 *                   example: 1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', authMiddleware, (req, res) => {
  return res.json({
    success: true,
    user: req.user,
    id: req.user?.id,
  });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh Access Token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cấp lại token thành công
 *       403:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout (Revoke Refresh Token)
 *     tags: [Authentication]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', logout);

export default router;
