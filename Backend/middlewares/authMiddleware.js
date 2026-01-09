import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Có thể throw để dev biết cấu hình sai
  throw new Error('JWT_SECRET is not set in environment variables');
}

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token, vui lòng đăng nhập',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.userId || decoded.id;
    req.user = {
      id: userId,
      userId: userId,
      email: decoded.email,
      username: decoded.username,
      roles: decoded.roles || [],
    };

    return next();
  } catch (error) {
    console.error(' Auth middleware error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn, vui lòng đăng nhập lại',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
    });
  }
};

// Middleware optional: có token thì decode, không có thì vẫn cho qua
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Không có token => coi như khách (req.user = null) và cho qua
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      roles: decoded.roles || [],
    };

    return next();
  } catch (error) {
    // Token lỗi/hết hạn => coi như khách để vẫn xem được bài public
    req.user = null;
    return next();
  }
};

export default authMiddleware;
