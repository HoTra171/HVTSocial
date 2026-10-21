import Joi from 'joi';
import logger from '../utils/logger.js';

/**
 * Input Validation Middleware using Joi
 * Validates request body, params, and query
 */

/**
 * Generic validation middleware
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn({
        message: 'Validation failed',
        path: req.path,
        errors,
      });

      return res.status(400).json({
        success: false,
        message: errors[0]?.message || 'Dữ liệu không hợp lệ',
        errors,
      });
    }

    // Replace req.body with validated/sanitized value
    req.body = value;
    next();
  };
};

/**
 * Validate params
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: errors[0]?.message || 'Tham số đường dẫn không hợp lệ',
        errors,
      });
    }

    req.params = value;
    next();
  };
};

/**
 * Validate query
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: errors[0]?.message || 'Tham số tìm kiếm không hợp lệ',
        errors,
      });
    }

    req.query = value;
    next();
  };
};

/* ================= COMMON VALIDATION SCHEMAS ================= */

/**
 * User Registration Schema
 */
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Vui lòng nhập địa chỉ email',
    'string.email': 'Email không đúng định dạng (ví dụ: example@gmail.com)',
    'any.required': 'Email là bắt buộc',
  }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập mật khẩu',
      'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
      'string.pattern.base': 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số',
      'any.required': 'Mật khẩu là bắt buộc',
    }),

  full_name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Vui lòng nhập họ và tên',
    'string.min': 'Họ và tên phải có ít nhất 2 ký tự',
    'string.max': 'Họ và tên không được vượt quá 100 ký tự',
    'any.required': 'Họ và tên là bắt buộc',
  }),

  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.empty': 'Vui lòng nhập tên người dùng (username)',
    'string.alphanum': 'Tên người dùng chỉ được chứa chữ cái và số (không dấu, không khoảng trắng)',
    'string.min': 'Tên người dùng phải có ít nhất 3 ký tự',
    'string.max': 'Tên người dùng không được vượt quá 30 ký tự',
    'any.required': 'Tên người dùng là bắt buộc',
  }),

  date_of_birth: Joi.date().max('now').optional().messages({
    'date.base': 'Ngày sinh không hợp lệ',
    'date.max': 'Ngày sinh không thể là ngày trong tương lai',
  }),

  gender: Joi.string().valid('male', 'female', 'other').optional().messages({
    'any.only': 'Giới tính không hợp lệ (nam, nữ hoặc khác)',
  }),
});

/**
 * User Login Schema
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Vui lòng nhập email',
    'string.email': 'Email không đúng định dạng',
    'any.required': 'Email là bắt buộc',
  }),

  password: Joi.string().required().messages({
    'string.empty': 'Vui lòng nhập mật khẩu',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
});

/**
 * Create Post Schema
 */
export const createPostSchema = Joi.object({
  content: Joi.string().max(5000).allow('', null).messages({
    'string.max': 'Post content cannot exceed 5000 characters',
  }),

  media: Joi.string().uri().allow('', null).messages({
    'string.uri': 'Media must be a valid URL',
  }),

  status: Joi.string().valid('public', 'friends', 'private').default('public'),

  shared_post_id: Joi.number().integer().positive().optional(),
})
  .or('content', 'media', 'shared_post_id')
  .messages({
    'object.missing': 'Post must have content, media, or be a share',
  });

/**
 * Update Post Schema
 */
export const updatePostSchema = Joi.object({
  content: Joi.string().max(5000).optional(),

  status: Joi.string().valid('public', 'friends', 'private').optional(),
});

/**
 * Create Comment Schema
 */
export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    'string.min': 'Comment cannot be empty',
    'string.max': 'Comment cannot exceed 2000 characters',
    'any.required': 'Comment content is required',
  }),

  media: Joi.string().uri().allow('', null).optional(),

  comment_parent: Joi.number().integer().positive().optional(),
});

/**
 * Update User Profile Schema
 */
export const updateProfileSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),

  bio: Joi.string().max(500).allow('', null).optional(),

  address: Joi.string().max(255).allow('', null).optional(),

  date_of_birth: Joi.date().max('now').optional(),

  gender: Joi.string().valid('male', 'female', 'other').optional(),

  avatar: Joi.string().uri().allow('', null).optional(),

  background: Joi.string().uri().allow('', null).optional(),
});

/**
 * Change Password Schema
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),

  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'New password must contain uppercase, lowercase, and number',
      'any.required': 'New password is required',
    }),

  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required',
  }),
});

/**
 * Report Content Schema
 */
export const reportContentSchema = Joi.object({
  target_type: Joi.string().valid('user', 'post', 'comment', 'message').required().messages({
    'any.only': 'Invalid target type',
    'any.required': 'Target type is required',
  }),

  target_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Target ID must be a number',
    'any.required': 'Target ID is required',
  }),

  reason: Joi.string().max(500).required().messages({
    'string.max': 'Reason cannot exceed 500 characters',
    'any.required': 'Reason is required',
  }),
});

/**
 * Suspend Account Schema (Admin)
 */
export const suspendAccountSchema = Joi.object({
  reason: Joi.string().min(10).max(500).required().messages({
    'string.min': 'Reason must be at least 10 characters',
    'string.max': 'Reason cannot exceed 500 characters',
    'any.required': 'Suspension reason is required',
  }),

  until: Joi.date().min('now').optional().messages({
    'date.min': 'Suspension end date cannot be in the past',
  }),
});

/**
 * Pagination Query Schema
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(100).default(20),
});

/**
 * ID Param Schema
 */
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID must be a number',
    'number.positive': 'ID must be positive',
    'any.required': 'ID is required',
  }),
});

/**
 * Search Query Schema
 */
export const searchQuerySchema = Joi.object({
  q: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Search query cannot be empty',
    'string.max': 'Search query cannot exceed 100 characters',
    'any.required': 'Search query is required',
  }),

  type: Joi.string().valid('users', 'posts', 'all').default('all'),

  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(50).default(20),
});

export default {
  validate,
  validateParams,
  validateQuery,
  registerSchema,
  loginSchema,
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateProfileSchema,
  changePasswordSchema,
  reportContentSchema,
  suspendAccountSchema,
  paginationSchema,
  idParamSchema,
  searchQuerySchema,
};
