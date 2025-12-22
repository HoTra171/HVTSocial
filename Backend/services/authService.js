// services/authService.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
} from '../models/userModel.js';

export const register = async ({ email, password, full_name, username, date_of_birth, gender }) => {
  const existedEmail = await findUserByEmail(email);
  if (existedEmail) throw new Error('Email đã được sử dụng');

  const existedUsername = await findUserByUsername(username);
  if (existedUsername) throw new Error('Username đã được sử dụng');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await createUser({
    email,
    hashedPassword,
    full_name,
    username,
    date_of_birth,
    gender,
  });

  delete user.password;
  return user;
};

export const login = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error('Email hoặc mật khẩu không đúng');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Email hoặc mật khẩu không đúng');

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  delete user.password;
  return { user, token };
};

export const getProfile = async (id) => {
  const user = await findUserById(id);
  if (!user) throw new Error('Không tìm thấy người dùng');
  return user;
};
