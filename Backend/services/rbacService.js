import sql from 'mssql';
import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

const getPool = async () => {
  const db = await pool;
  if (!db) throw new Error('Database connection failed');
  return db;
};

/**
 * RBAC Service - Role-Based Access Control
 * Manages roles, permissions, and authorization
 */

/* ================= ROLE MANAGEMENT ================= */

/**
 * Get all roles
 */
export const getAllRoles = async () => {
  const db = await getPool();
  const result = await db.request().query(`
    SELECT id, name, description, created_at
    FROM roles
    ORDER BY name
  `);
  return result.recordset;
};

/**
 * Get role by name
 */
export const getRoleByName = async (roleName) => {
  const db = await getPool();
  const result = await db.request()
    .input('name', sql.NVarChar, roleName)
    .query('SELECT * FROM roles WHERE name = @name');
  return result.recordset[0];
};

/**
 * Get user roles with permissions
 */
export const getUserRoles = async (userId) => {
  const db = await getPool();
  const result = await db.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        r.id, r.name, r.description,
        ur.assigned_at, ur.assigned_by
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = @userId
    `);
  return result.recordset;
};

/**
 * Get all permissions for a user (aggregate from all roles)
 */
export const getUserPermissions = async (userId) => {
  const db = await getPool();
  const result = await db.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT DISTINCT
        p.id, p.name, p.resource, p.action, p.description
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = @userId
    `);
  return result.recordset;
};

/**
 * Check if user has specific permission
 */
export const hasPermission = async (userId, permissionName) => {
  const db = await getPool();
  const result = await db.request()
    .input('userId', sql.Int, userId)
    .input('permissionName', sql.NVarChar, permissionName)
    .query(`
      SELECT COUNT(*) as count
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = @userId AND p.name = @permissionName
    `);
  return result.recordset[0].count > 0;
};

/**
 * Check if user has specific role
 */
export const hasRole = async (userId, roleName) => {
  const db = await getPool();
  const result = await db.request()
    .input('userId', sql.Int, userId)
    .input('roleName', sql.NVarChar, roleName)
    .query(`
      SELECT COUNT(*) as count
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = @userId AND r.name = @roleName
    `);
  return result.recordset[0].count > 0;
};

/**
 * Assign role to user
 */
export const assignRole = async (userId, roleName, assignedBy = null) => {
  const db = await getPool();

  // Get role ID
  const role = await getRoleByName(roleName);
  if (!role) {
    throw new Error(`Role '${roleName}' not found`);
  }

  // Check if already assigned
  const hasRoleAlready = await hasRole(userId, roleName);
  if (hasRoleAlready) {
    return { message: 'Role already assigned', role: role.name };
  }

  // Assign role
  await db.request()
    .input('userId', sql.Int, userId)
    .input('roleId', sql.Int, role.id)
    .input('assignedBy', sql.Int, assignedBy)
    .query(`
      INSERT INTO user_roles (user_id, role_id, assigned_by)
      VALUES (@userId, @roleId, @assignedBy)
    `);

  logger.info({
    message: 'Role assigned',
    userId,
    roleName,
    assignedBy
  });

  return { message: 'Role assigned successfully', role: role.name };
};

/**
 * Remove role from user
 */
export const removeRole = async (userId, roleName) => {
  const db = await getPool();

  const role = await getRoleByName(roleName);
  if (!role) {
    throw new Error(`Role '${roleName}' not found`);
  }

  const result = await db.request()
    .input('userId', sql.Int, userId)
    .input('roleId', sql.Int, role.id)
    .query(`
      DELETE FROM user_roles
      WHERE user_id = @userId AND role_id = @roleId
    `);

  logger.info({
    message: 'Role removed',
    userId,
    roleName
  });

  return {
    message: 'Role removed successfully',
    role: role.name,
    rowsAffected: result.rowsAffected[0]
  };
};

/**
 * Check resource ownership
 * e.g., check if user owns a post before allowing update/delete
 */
export const isResourceOwner = async (userId, resourceType, resourceId) => {
  const db = await getPool();

  const tableMap = {
    post: 'posts',
    comment: 'comments',
    story: 'stories'
  };

  const tableName = tableMap[resourceType];
  if (!tableName) {
    throw new Error(`Unknown resource type: ${resourceType}`);
  }

  const result = await db.request()
    .input('userId', sql.Int, userId)
    .input('resourceId', sql.Int, resourceId)
    .query(`
      SELECT COUNT(*) as count
      FROM ${tableName}
      WHERE id = @resourceId AND user_id = @userId
    `);

  return result.recordset[0].count > 0;
};

/**
 * Check if user can perform action on resource
 * Combines permission check with ownership check
 */
export const canPerformAction = async (userId, action, resource, resourceId = null) => {
  // Check for "any" permission first (admin/moderator)
  const hasAnyPermission = await hasPermission(userId, `${resource}.${action}.any`);
  if (hasAnyPermission) {
    return true;
  }

  // Check for "own" permission
  const hasOwnPermission = await hasPermission(userId, `${resource}.${action}.own`);
  if (hasOwnPermission && resourceId) {
    // Verify ownership
    return await isResourceOwner(userId, resource, resourceId);
  }

  // Check for basic permission (e.g., post.read, post.create)
  return await hasPermission(userId, `${resource}.${action}`);
};

/* ================= PERMISSION MANAGEMENT ================= */

/**
 * Get all permissions
 */
export const getAllPermissions = async () => {
  const db = await getPool();
  const result = await db.request().query(`
    SELECT id, name, resource, action, description
    FROM permissions
    ORDER BY resource, action
  `);
  return result.recordset;
};

/**
 * Get permissions for a specific role
 */
export const getRolePermissions = async (roleName) => {
  const db = await getPool();
  const result = await db.request()
    .input('roleName', sql.NVarChar, roleName)
    .query(`
      SELECT
        p.id, p.name, p.resource, p.action, p.description
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = @roleName
      ORDER BY p.resource, p.action
    `);
  return result.recordset;
};

export const rbacService = {
  getAllRoles,
  getRoleByName,
  getUserRoles,
  getUserPermissions,
  hasPermission,
  hasRole,
  assignRole,
  removeRole,
  isResourceOwner,
  canPerformAction,
  getAllPermissions,
  getRolePermissions
};
