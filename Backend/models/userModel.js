import sql from 'mssql';
import { pool } from '../config/db.js';

const getPool = async () => {
  const db = await pool;
  if (!db) throw new Error('Database connection failed');
  return db;
};

/* ================= AUTH ================= */

export const findUserByEmail = async (email) => {
  const db = await getPool();
  const result = await db.request()
    .input('email', sql.VarChar, email)
    .query('SELECT * FROM users WHERE email = @email');
  return result.recordset[0];
};

export const findUserByUsername = async (username) => {
  const db = await getPool();
  const result = await db.request()
    .input('username', sql.NVarChar, username)
    .query('SELECT * FROM users WHERE username = @username');
  return result.recordset[0];
};

export const findUserById = async (id) => {
  const db = await getPool();
  const result = await db.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT 
        id, email, full_name, username, date_of_birth, gender,
        avatar, background, bio, address,
        created_at, updated_at
      FROM users
      WHERE id = @id
    `);
  return result.recordset[0];
};

export const createUser = async ({
  email,
  hashedPassword,
  full_name,
  username,
  date_of_birth,
  gender,
}) => {
  const db = await getPool();
  const result = await db.request()
    .input('email', sql.VarChar, email)
    .input('password', sql.VarChar, hashedPassword)
    .input('full_name', sql.NVarChar, full_name)
    .input('username', sql.NVarChar, username)
    .input('date_of_birth', sql.Date, date_of_birth || null)
    .input('gender', sql.VarChar, gender || null)
    .query(`
      INSERT INTO users (
        email, password, full_name, username, date_of_birth, gender
      )
      OUTPUT INSERTED.*
      VALUES (
        @email, @password, @full_name, @username, @date_of_birth, @gender
      )
    `);
  return result.recordset[0];
};

/* ================= CONNECTIONS & DISCOVER ================= */

export const UserModel = {
  async getUserProfile(userId) {
    const db = await pool;

    const result = await db
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT
          id,
          email,
          full_name,
          username,
          avatar,
          background,
          bio,
          address,
          created_at
        FROM users
        WHERE id = @userId
      `);

    return result.recordset[0];
  },


  
  async getConnections(pool, userId) {
    if (!pool.connected) await pool.connect();
    const req = pool.request();
    req.input("userId", sql.Int, userId);

    const query = `
      SELECT u.id, u.full_name, u.username, u.avatar, u.bio
      FROM friendships f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = @userId AND f.status = 'accepted';

      SELECT u.id, u.full_name, u.username, u.avatar, u.bio
      FROM friendships f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = @userId AND f.status = 'accepted';

      SELECT u.id, u.full_name, u.username, u.avatar, u.bio
      FROM friendships f
      JOIN users u ON u.id = f.requester_id
      WHERE f.receiver_id = @userId AND f.status = 'pending';

      SELECT DISTINCT
        u.id, u.full_name, u.username, u.avatar, u.bio
      FROM friendships f1
      JOIN friendships f2
        ON f1.requester_id = f2.receiver_id
       AND f1.receiver_id = f2.requester_id
       AND f1.status = 'accepted'
       AND f2.status = 'accepted'
      JOIN users u ON u.id = f1.receiver_id
      WHERE f1.requester_id = @userId;
    `;

    const result = await req.query(query);
    return {
      followers: result.recordsets[0],
      following: result.recordsets[1],
      pending: result.recordsets[2],
      connections: result.recordsets[3],
    };
  },

  async discoverUsers(pool, userId, search) {
    if (!pool.connected) await pool.connect();
    const req = pool.request();

    req.input("userId", sql.Int, userId);
    req.input("search", sql.NVarChar, `%${search}%`);

    const query = `
      SELECT
        u.id,
        u.full_name,
        u.username,
        u.avatar,
        u.bio
      FROM users u
      WHERE u.id <> @userId
        AND (
          u.full_name LIKE @search
          OR u.username LIKE @search
        )
        AND u.id NOT IN (
          SELECT friend_id FROM friendships WHERE user_id = @userId
        )
        AND u.id NOT IN (
          SELECT user_id FROM friendships WHERE friend_id = @userId
        )
      ORDER BY u.full_name;
    `;

    const result = await req.query(query);
    return result.recordset;
  },
};

