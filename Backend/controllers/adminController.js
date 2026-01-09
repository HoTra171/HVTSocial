import { db } from '../config/db-wrapper.js';
import { successResponse, errorResponse } from '../utils/response.js';

// GET /api/admin/stats
export const getSystemStats = async (req, res) => {
    try {
        const stats = {
            users: 0,
            posts: 0,
            comments: 0
        };

        const usersRes = await db.request().query('SELECT COUNT(*) as count FROM users');
        stats.users = usersRes.recordset[0].count;

        const postsRes = await db.request().query('SELECT COUNT(*) as count FROM posts');
        stats.posts = postsRes.recordset[0].count;

        // For comments table, check if exists via try/catch or assume it exists
        try {
            const commentsRes = await db.request().query('SELECT COUNT(*) as count FROM comments');
            stats.comments = commentsRes.recordset[0].count;
        } catch (e) { }

        return successResponse(res, stats, 'Lấy thống kê thành công');
    } catch (error) {
        console.error('getSystemStats error:', error);
        return errorResponse(res, 'Lỗi Server');
    }
};

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, q = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT id, full_name, username, email, account_status, created_at, avatar 
      FROM users 
      WHERE 1=1 
    `;

        if (q) {
            query += ` AND (full_name LIKE @q OR username LIKE @q OR email LIKE @q)`;
        }

        query += ` ORDER BY created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

        const request = db.request()
            .input('offset', offset)
            .input('limit', limit);

        if (q) request.input('q', `%${q}%`);

        const result = await request.query(query);

        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
        if (q) countQuery += ` AND (full_name LIKE @q OR username LIKE @q OR email LIKE @q)`;

        const countRequest = db.request();
        if (q) countRequest.input('q', `%${q}%`);
        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0].total;

        return successResponse(res, {
            users: result.recordset,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('getAllUsers error:', error);
        return errorResponse(res, 'Lỗi Server');
    }
};

// PUT /api/admin/users/:id/status
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body; // status: active, suspended

        if (!['active', 'suspended'].includes(status)) {
            return errorResponse(res, 'Trạng thái không hợp lệ', 400);
        }

        await db.request()
            .input('id', id)
            .input('status', status)
            .input('reason', reason || null)
            .query(`
            UPDATE users 
            SET account_status = @status, 
                suspension_reason = @reason,
                suspended_at = CASE WHEN @status = 'suspended' THEN GETDATE() ELSE NULL END
            WHERE id = @id
        `);

        return successResponse(res, null, 'Cập nhật trạng thái thành công');
    } catch (error) {
        console.error('updateUserStatus error:', error);
        return errorResponse(res, 'Lỗi Server');
    }
};
