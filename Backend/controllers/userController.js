import { pool } from '../config/db.js';
import sql from 'mssql';
import { UserService } from '../services/userService.js';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

/* ================= CONNECTIONS ================= */
export const getUserConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await UserService.getConnections(userId);
    return res.json(data);
  } catch (err) {
    console.error('getUserConnections error:', err);
    return res.status(500).json({ message: 'Failed to fetch connections' });
  }
};

/* ================= PROFILE ================= */
export const getUserProfile = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = await UserService.getUserProfile(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("getUserProfile ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= HELPER: UPLOAD TO CLOUDINARY - OPTIMIZED ================= */
const uploadToCloudinary = async (fileBuffer, folder, transformation = null) => {
  return new Promise((resolve, reject) => {
    const stream = Readable.from(fileBuffer);

    const options = {
      resource_type: 'image',
      folder: `hvtsocial/${folder}`,
      // EAGER transformation - Cloudinary xử lý ngay
      eager: transformation ? [{ transformation }] : undefined,
      eager_async: false, // Đợi transform xong mới return
    };

    if (transformation) {
      options.transformation = transformation;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    stream.pipe(uploadStream);
  });
};

/* ================= UPDATE PROFILE - OPTIMIZED ================= */
export const updateProfile = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const currentUserId = req.user.id;

    console.log('UPDATE PROFILE (OPTIMIZED):', userId);

    // Check quyền
    if (userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa profile này'
      });
    }

    const { full_name, username, bio, address } = req.body;
    const db = await pool;

    // UPLOAD SONG SONG (PARALLEL) - Nhanh hơn 2x
    const uploadPromises = [];

    if (req.files?.avatar?.[0]) {
      console.log('📷 Uploading avatar...');
      uploadPromises.push(
        uploadToCloudinary(
          req.files.avatar[0].buffer,
          'avatars',
          [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
        ).then(url => ({ type: 'avatar', url }))
      );
    }

    if (req.files?.background?.[0]) {
      console.log('🖼️ Uploading background...');
      uploadPromises.push(
        uploadToCloudinary(
          req.files.background[0].buffer,
          'backgrounds',
          [{ width: 1200, height: 400, crop: 'fill' }]
        ).then(url => ({ type: 'background', url }))
      );
    }

    // ĐỢI TẤT CẢ UPLOAD XONG CÙNG LÚC
    const uploadResults = await Promise.all(uploadPromises);

    // BUILD UPDATE QUERY
    const request = db.request().input('userId', sql.Int, userId);
    const updates = [];

    // Text fields
    if (full_name !== undefined && full_name !== '') {
      updates.push('full_name = @fullName');
      request.input('fullName', sql.NVarChar, full_name);
    }

    if (username !== undefined && username !== '') {
      updates.push('username = @username');
      request.input('username', sql.NVarChar, username);
    }

    if (bio !== undefined) {
      updates.push('bio = @bio');
      request.input('bio', sql.NVarChar, bio);
    }

    if (address !== undefined) {
      updates.push('address = @address');
      request.input('address', sql.NVarChar, address);
    }

    // Apply uploaded URLs
    uploadResults.forEach(result => {
      if (result.type === 'avatar') {
        updates.push('avatar = @avatar');
        request.input('avatar', sql.NVarChar, result.url);
        console.log('Avatar:', result.url);
      } else if (result.type === 'background') {
        updates.push('background = @background');
        request.input('background', sql.NVarChar, result.url);
        console.log('Background:', result.url);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có gì để cập nhật'
      });
    }

    // EXECUTE UPDATE
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = @userId`;
    await request.query(updateQuery);

    // FETCH UPDATED USER
    const result = await db.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          id, full_name, username, email, avatar, background, 
          bio, address, created_at
        FROM users 
        WHERE id = @userId
      `);

    const updatedUser = result.recordset[0];
    console.log('Done in', Date.now());

    res.json({
      success: true,
      message: 'Cập nhật profile thành công',
      user: updatedUser
    });

  } catch (err) {
    console.error('updateProfile error:', err);

    if (err.message?.includes('UNIQUE') || err.number === 2627) {
      return res.status(400).json({
        success: false,
        message: 'Username đã tồn tại'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// GET /api/users/discover?search=&filterType=all|friends|not-friends&limit=50
export const discoverUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const search = (req.query.search || "").trim();
    const filterType = (req.query.filterType || "all").trim();
    const limit = Math.min(Number(req.query.limit || 50), 100);

    const prefix = search ? `${search}%` : "";
    const like = search ? `%${search}%` : "";

    const db = await pool;

    const query = `
      SELECT TOP (@limit)
        u.id,
        u.full_name,
        u.username,
        u.avatar,
        u.bio,
        u.address,

        CASE WHEN f1.status = 'accepted' OR f2.status = 'accepted' THEN 1 ELSE 0 END AS is_friend,
        CASE WHEN fo.following_id IS NOT NULL THEN 1 ELSE 0 END AS is_following,

        ISNULL(ch.common_hobby_count, 0) AS common_hobby_count,

        (
          -- text score
          CASE WHEN @search = '' THEN 0 ELSE
            CASE
              WHEN u.username LIKE @prefix THEN 50
              WHEN u.full_name LIKE @prefix THEN 40
              WHEN u.username LIKE @like THEN 20
              WHEN u.full_name LIKE @like THEN 15
              WHEN u.bio LIKE @like OR u.address LIKE @like THEN 10
              ELSE 0
            END
          END

          -- social score
          + CASE WHEN (f1.status = 'accepted' OR f2.status = 'accepted') THEN 30 ELSE 0 END
          + CASE WHEN fo.following_id IS NOT NULL THEN 15 ELSE 0 END

          -- hobby score
          + (ISNULL(ch.common_hobby_count, 0) * 5)

          -- freshness nhỏ
          + CASE WHEN u.created_at >= DATEADD(DAY, -30, GETDATE()) THEN 3 ELSE 0 END
        ) AS score

      FROM users u

      LEFT JOIN friendships f1
        ON f1.user_id = @currentUserId AND f1.friend_id = u.id
      LEFT JOIN friendships f2
        ON f2.friend_id = @currentUserId AND f2.user_id = u.id

      LEFT JOIN follows fo
        ON fo.follower_id = @currentUserId AND fo.following_id = u.id

      LEFT JOIN (
        SELECT uh2.user_id, COUNT(*) AS common_hobby_count
        FROM user_hobbies uh1
        JOIN user_hobbies uh2 ON uh1.hobby_id = uh2.hobby_id
        WHERE uh1.user_id = @currentUserId
          AND uh2.user_id <> @currentUserId
        GROUP BY uh2.user_id
      ) ch ON ch.user_id = u.id

      WHERE u.id <> @currentUserId

        -- block 2 chiều
        AND NOT EXISTS (
          SELECT 1 FROM user_blocks b
          WHERE (b.blocker_id = @currentUserId AND b.blocked_id = u.id)
             OR (b.blocker_id = u.id AND b.blocked_id = @currentUserId)
        )

        -- search optional
        AND (
          @search = ''
          OR u.full_name LIKE @like
          OR u.username LIKE @like
          OR u.bio LIKE @like
          OR u.address LIKE @like
        )

        -- filterType
        AND (
          @filterType = 'all'
          OR (@filterType = 'friends' AND (f1.status = 'accepted' OR f2.status = 'accepted'))
          OR (@filterType = 'not-friends' AND (ISNULL(f1.status,'') <> 'accepted' AND ISNULL(f2.status,'') <> 'accepted'))

        )

      ORDER BY score DESC, u.created_at DESC;
    `;

    const result = await db.request()
      .input("currentUserId", sql.Int, currentUserId)
      .input("search", sql.NVarChar, search)
      .input("prefix", sql.NVarChar, prefix)
      .input("like", sql.NVarChar, like)
      .input("filterType", sql.NVarChar, filterType)
      .input("limit", sql.Int, limit)
      .query(query);

    const users = result.recordset.map(u => ({
      _id: u.id,
      name: u.full_name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      location: u.address,
      isFriend: !!u.is_friend,
      isFollowing: !!u.is_following,
      commonHobbyCount: u.common_hobby_count,
      score: u.score,
    }));

    return res.json({ success: true, data: users });
  } catch (err) {
    console.error("discoverUsers error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/users/suggest?q=abc&limit=8
export const suggestUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const q = (req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit || 8), 20);

    if (!q) return res.json({ success: true, data: [] });

    const prefix = `${q}%`;
    const like = `%${q}%`;

    const db = await pool;

    const query = `
      SELECT TOP (@limit)
        u.id, u.full_name, u.username, u.avatar, u.bio,

        CASE WHEN f1.status = 'accepted' OR f2.status = 'accepted' THEN 1 ELSE 0 END AS is_friend,
        CASE WHEN fo.following_id IS NOT NULL THEN 1 ELSE 0 END AS is_following,

        (
          CASE
            WHEN u.username LIKE @prefix THEN 100
            WHEN u.full_name LIKE @prefix THEN 80
            WHEN u.username LIKE @like THEN 40
            WHEN u.full_name LIKE @like THEN 30
            ELSE 0
          END
          + CASE WHEN fo.following_id IS NOT NULL THEN 10 ELSE 0 END
          + CASE WHEN (f1.status = 'accepted' OR f2.status = 'accepted') THEN 10 ELSE 0 END
        ) AS score

      FROM users u
      LEFT JOIN friendships f1 ON f1.user_id = @currentUserId AND f1.friend_id = u.id
      LEFT JOIN friendships f2 ON f2.friend_id = @currentUserId AND f2.user_id = u.id
      LEFT JOIN follows fo ON fo.follower_id = @currentUserId AND fo.following_id = u.id

      WHERE u.id <> @currentUserId
        AND NOT EXISTS (
          SELECT 1 FROM user_blocks b
          WHERE (b.blocker_id = @currentUserId AND b.blocked_id = u.id)
             OR (b.blocker_id = u.id AND b.blocked_id = @currentUserId)
        )
        AND (u.username LIKE @like OR u.full_name LIKE @like)

      ORDER BY score DESC, u.full_name;
    `;

    const result = await db.request()
      .input("currentUserId", sql.Int, currentUserId)
      .input("prefix", sql.NVarChar, prefix)
      .input("like", sql.NVarChar, like)
      .input("limit", sql.Int, limit)
      .query(query);

    const users = result.recordset.map(u => ({
      id: u.id,
      full_name: u.full_name,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      isFriend: !!u.is_friend,
      isFollowing: !!u.is_following,
      score: u.score,
    }));

    return res.json({ success: true, data: users });
  } catch (err) {
    console.error("suggestUsers error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
