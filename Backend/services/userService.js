import { UserModel } from '../models/userModel.js';
import { pool } from '../config/db.js';

export const UserService = {
  getConnections: (userId) => UserModel.getConnections(pool, userId),
  getUserProfile: async (userId) => {
    return await UserModel.getUserProfile(userId);
  },
  discoverUsers: (userId, search) => UserModel.discoverUsers(pool, userId, search),
};
