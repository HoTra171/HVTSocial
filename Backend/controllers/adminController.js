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
                suspended_at = CASE WHEN @status = 'suspended' THEN NOW() ELSE NULL END
            WHERE id = @id
        `);

        return successResponse(res, null, 'Cập nhật trạng thái thành công');
    } catch (error) {
        console.error('updateUserStatus error:', error);
        return errorResponse(res, 'Lỗi Server');
    }
};

// GET /api/admin/posts - Get all posts with pagination and search
export const getAllPosts = async (req, res) => {
    try {
        const { page = 1, limit = 20, q = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT p.id, p.user_id, p.content, p.media_url, p.privacy, p.created_at,
                   u.full_name, u.username, u.avatar,
                   (SELECT COUNT(*) FROM likes WHERE entity_type = 'post' AND entity_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE 1=1
        `;

        if (q) {
            query += ` AND (p.content LIKE @q OR u.full_name LIKE @q OR u.username LIKE @q)`;
        }

        query += ` ORDER BY p.created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

        const request = db.request()
            .input('offset', offset)
            .input('limit', limit);

        if (q) request.input('q', `%${q}%`);

        const result = await request.query(query);

        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM posts p LEFT JOIN users u ON p.user_id = u.id WHERE 1=1`;
        if (q) countQuery += ` AND (p.content LIKE @q OR u.full_name LIKE @q OR u.username LIKE @q)`;

        const countRequest = db.request();
        if (q) countRequest.input('q', `%${q}%`);
        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0].total;

        return successResponse(res, {
            posts: result.recordset,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('getAllPosts error:', error);
        return errorResponse(res, 'Lỗi Server');
    }
};

// DELETE /api/admin/posts/:id - Delete a post (admin override)
export const deletePostByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if post exists
        const checkResult = await db.request()
            .input('id', id)
            .query('SELECT id FROM posts WHERE id = @id');

        if (checkResult.recordset.length === 0) {
            return errorResponse(res, 'Bài viết không tồn tại', 404);
        }

        // Delete related data first (comments, likes, shares, etc.)
        await db.request().input('id', id).query('DELETE FROM likes WHERE entity_type = \'post\' AND entity_id = @id');
        await db.request().input('id', id).query('DELETE FROM shares WHERE post_id = @id');
        await db.request().input('id', id).query('DELETE FROM saved_posts WHERE post_id = @id');
        await db.request().input('id', id).query('DELETE FROM comments WHERE post_id = @id');

        // Delete the post
        await db.request().input('id', id).query('DELETE FROM posts WHERE id = @id');

        return successResponse(res, null, 'Xóa bài viết thành công');
    } catch (error) {
        console.error('deletePostByAdmin error:', error);
        return errorResponse(res, 'Lỗi Server');
    }
};

// GET /api/admin/comments - Get all comments with pagination and search
export const getAllComments = async (req, res) => {
    try {
        const { page = 1, limit = 20, q = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT c.id, c.post_id, c.user_id, c.content, c.parent_comment_id, c.created_at,
                   u.full_name, u.username, u.avatar,
                   p.content as post_content,
                   (SELECT COUNT(*) FROM likes WHERE entity_type = 'comment' AND entity_id = c.id) as likes_count
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN posts p ON c.post_id = p.id
            WHERE 1=1
        `;

        if (q) {
            query += ` AND (c.content LIKE @q OR u.full_name LIKE @q OR u.username LIKE @q)`;
        }

        query += ` ORDER BY c.created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

        const request = db.request()
            .input('offset', offset)
            .input('limit', limit);

        if (q) request.input('q', `%${q}%`);

        const result = await request.query(query);

        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE 1=1`;
        if (q) countQuery += ` AND (c.content LIKE @q OR u.full_name LIKE @q OR u.username LIKE @q)`;

        const countRequest = db.request();
        if (q) countRequest.input('q', `%${q}%`);
        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0].total;

        return successResponse(res, {
            comments: result.recordset,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('getAllComments error:', error);
        return errorResponse(res, 'Lỗi Server');
    }
};

// DELETE /api/admin/comments/:id - Delete a comment (admin override)
export const deleteCommentByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if comment exists
        const checkResult = await db.request()
            .input('id', id)
            .query('SELECT id FROM comments WHERE id = @id');

        if (checkResult.recordset.length === 0) {
            return errorResponse(res, 'Bình luận không tồn tại', 404);
        }

        // Delete related data (likes, replies)
        await db.request().input('id', id).query('DELETE FROM likes WHERE entity_type = \'comment\' AND entity_id = @id');
        await db.request().input('id', id).query('DELETE FROM comments WHERE parent_comment_id = @id');

        // Delete the comment
        await db.request().input('id', id).query('DELETE FROM comments WHERE id = @id');

        return successResponse(res, null, 'Xóa bình luận thành công');
    } catch (error) {
        console.error('deleteCommentByAdmin error:', error);
        return errorResponse(res, 'Lỗi Server');
    }
};
