import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HVTSocial API Documentation',
      version: '1.0.0',
      description: `
## Giới thiệu

HVTSocial là mạng xã hội đầy đủ tính năng bao gồm:
- Xác thực người dùng (đăng ký, đăng nhập, JWT)
- Quản lý bài viết (tạo, sửa, xóa, like, comment, share)
- Hệ thống kết bạn
- Chat realtime (1-1 và nhóm)
- Thông báo realtime
- Stories (câu chuyện 24h)
- Video/Voice call (WebRTC)
- Upload media (Cloudinary)

## Authentication

Hầu hết các endpoint yêu cầu JWT token trong header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

- API endpoints: 100 requests/15 phút (production), 1000 requests/15 phút (development)
- Auth endpoints: 5 requests/15 phút (production), 100 requests/15 phút (development)
- Upload endpoints: 50 requests/1 giờ (production), 500 requests/1 giờ (development)
      `,
      contact: {
        name: 'HVTSocial Team',
        email: 'support@hvtsocial.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.hvtsocial.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' },
            full_name: { type: 'string', example: 'John Doe' },
            avatar: { type: 'string', example: 'https://cloudinary.com/avatar.jpg' },
            bio: { type: 'string', example: 'Software Developer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            content: { type: 'string', example: 'Hello World!' },
            media_url: { type: 'string', nullable: true },
            privacy: { type: 'string', enum: ['public', 'friends', 'private'], example: 'public' },
            likes_count: { type: 'integer', example: 10 },
            comments_count: { type: 'integer', example: 5 },
            shares_count: { type: 'integer', example: 2 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            post_id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 2 },
            content: { type: 'string', example: 'Great post!' },
            parent_id: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            type: {
              type: 'string',
              enum: [
                'like',
                'comment',
                'reply',
                'share',
                'friend_request',
                'friend_accept',
                'message',
              ],
              example: 'like',
            },
            sender_id: { type: 'integer', example: 2 },
            receiver_id: { type: 'integer', example: 1 },
            post_id: { type: 'integer', nullable: true },
            status: { type: 'string', enum: ['read', 'unread'], example: 'unread' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            chat_id: { type: 'integer', example: 1 },
            sender_id: { type: 'integer', example: 1 },
            content: { type: 'string', example: 'Hello!' },
            message_type: {
              type: 'string',
              enum: ['text', 'image', 'voice', 'video'],
              example: 'text',
            },
            media_url: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['sent', 'delivered', 'read'], example: 'sent' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string', example: 'error_code' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Chưa xác thực - Token không hợp lệ hoặc thiếu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Unauthorized - Token không hợp lệ',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Không có quyền truy cập',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Forbidden - Bạn không có quyền thực hiện hành động này',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Không tìm thấy tài nguyên',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Not Found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Dữ liệu đầu vào không hợp lệ',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Validation Error',
                errors: ['Email không hợp lệ', 'Mật khẩu phải có ít nhất 6 ký tự'],
              },
            },
          },
        },
        RateLimitError: {
          description: 'Vượt quá giới hạn request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Authentication', description: 'Xác thực người dùng' },
      { name: 'Users', description: 'Quản lý người dùng' },
      { name: 'Posts', description: 'Quản lý bài viết' },
      { name: 'Comments', description: 'Bình luận bài viết' },
      { name: 'Friendships', description: 'Quản lý kết bạn' },
      { name: 'Chat', description: 'Tin nhắn và chat' },
      { name: 'Notifications', description: 'Thông báo' },
      { name: 'Stories', description: 'Câu chuyện 24h' },
      { name: 'Upload', description: 'Upload media' },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Đường dẫn đến files chứa JSDoc annotations
};

export const swaggerSpec = swaggerJsdoc(options);
