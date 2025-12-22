import express from 'express';
import { register, login, requestResetOtp, resetPasswordWithOtp, changePassword } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post("/request-reset-otp", requestResetOtp);
router.post("/reset-password-otp", resetPasswordWithOtp);
// Đổi mật khẩu khi đã đăng nhập
router.put("/change-password", authMiddleware, changePassword);

router.get("/me", authMiddleware, (req, res) => {
  return res.json({
    success: true,
    user: req.user,      // req.user.id có sẵn
    id: req.user?.id,    // tiện lấy nhanh
  });
});
export default router;