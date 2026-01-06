import sql from 'mssql';
import { pool } from '../config/db.js';
import logger from '../config/logger.js';

const getPool = async () => {
  const db = await pool;
  if (!db) throw new Error('Database connection failed');
  return db;
};

/**
 * Audit Logging Service
 * Tracks all important user actions and system events
 */

/**
 * Log audit event
 * @param {Object} event - Audit event details
 * @param {number} event.userId - User performing the action (null for system actions)
 * @param {string} event.action - Action name (e.g., 'login', 'create_post', 'delete_user')
 * @param {string} event.resourceType - Resource type (e.g., 'user', 'post', 'comment')
 * @param {number} event.resourceId - Resource ID
 * @param {Object} event.oldValues - Previous values (for updates)
 * @param {Object} event.newValues - New values (for creates/updates)
 * @param {string} event.ipAddress - Client IP address
 * @param {string} event.userAgent - Client user agent
 * @param {string} event.status - 'success' or 'failed'
 * @param {string} event.errorMessage - Error message if failed
 */
export const logAuditEvent = async (event) => {
  const db = await getPool();

  try {
    await db.request()
      .input('userId', sql.Int, event.userId || null)
      .input('action', sql.NVarChar, event.action)
      .input('resourceType', sql.NVarChar, event.resourceType || null)
      .input('resourceId', sql.Int, event.resourceId || null)
      .input('oldValues', sql.NVarChar, event.oldValues ? JSON.stringify(event.oldValues) : null)
      .input('newValues', sql.NVarChar, event.newValues ? JSON.stringify(event.newValues) : null)
      .input('ipAddress', sql.NVarChar, event.ipAddress || null)
      .input('userAgent', sql.NVarChar, event.userAgent || null)
      .input('status', sql.NVarChar, event.status || 'success')
      .input('errorMessage', sql.NVarChar, event.errorMessage || null)
      .query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id,
          old_values, new_values, ip_address, user_agent,
          status, error_message
        )
        VALUES (
          @userId, @action, @resourceType, @resourceId,
          @oldValues, @newValues, @ipAddress, @userAgent,
          @status, @errorMessage
        )
      `);

    // Also log to Winston for immediate visibility
    const logLevel = event.status === 'failed' ? 'warn' : 'info';
    logger[logLevel]({
      audit: true,
      ...event
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    logger.error({
      message: 'Failed to write audit log',
      error: error.message,
      event
    });
  }
};

/* ================= SPECIFIC AUDIT LOGGERS ================= */

/**
 * Log authentication events
 */
export const logAuth = async (userId, action, status, ipAddress, userAgent, errorMessage = null) => {
  await logAuditEvent({
    userId,
    action,
    resourceType: 'user',
    resourceId: userId,
    ipAddress,
    userAgent,
    status,
    errorMessage
  });
};

/**
 * Log resource creation
 */
export const logCreate = async (userId, resourceType, resourceId, values, ipAddress = null) => {
  await logAuditEvent({
    userId,
    action: `create_${resourceType}`,
    resourceType,
    resourceId,
    newValues: values,
    ipAddress,
    status: 'success'
  });
};

/**
 * Log resource update
 */
export const logUpdate = async (userId, resourceType, resourceId, oldValues, newValues, ipAddress = null) => {
  await logAuditEvent({
    userId,
    action: `update_${resourceType}`,
    resourceType,
    resourceId,
    oldValues,
    newValues,
    ipAddress,
    status: 'success'
  });
};

/**
 * Log resource deletion
 */
export const logDelete = async (userId, resourceType, resourceId, oldValues = null, ipAddress = null) => {
  await logAuditEvent({
    userId,
    action: `delete_${resourceType}`,
    resourceType,
    resourceId,
    oldValues,
    ipAddress,
    status: 'success'
  });
};

/**
 * Log permission changes
 */
export const logPermissionChange = async (adminId, targetUserId, action, details, ipAddress = null) => {
  await logAuditEvent({
    userId: adminId,
    action,
    resourceType: 'user',
    resourceId: targetUserId,
    newValues: details,
    ipAddress,
    status: 'success'
  });
};

/**
 * Log account status changes
 */
export const logAccountStatusChange = async (adminId, targetUserId, oldStatus, newStatus, reason, ipAddress = null) => {
  await logAuditEvent({
    userId: adminId,
    action: 'change_account_status',
    resourceType: 'user',
    resourceId: targetUserId,
    oldValues: { status: oldStatus },
    newValues: { status: newStatus, reason },
    ipAddress,
    status: 'success'
  });
};

/**
 * Log security events
 */
export const logSecurityEvent = async (userId, action, details, ipAddress, userAgent, status = 'success') => {
  await logAuditEvent({
    userId,
    action,
    resourceType: 'security',
    newValues: details,
    ipAddress,
    userAgent,
    status
  });
};

/* ================= QUERY AUDIT LOGS ================= */

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters = {}) => {
  const db = await getPool();

  const {
    userId = null,
    action = null,
    resourceType = null,
    status = null,
    startDate = null,
    endDate = null,
    limit = 100,
    offset = 0
  } = filters;

  let query = `
    SELECT
      al.id,
      al.user_id,
      u.username,
      al.action,
      al.resource_type,
      al.resource_id,
      al.old_values,
      al.new_values,
      al.ip_address,
      al.user_agent,
      al.status,
      al.error_message,
      al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;

  const request = db.request();

  if (userId) {
    query += ' AND al.user_id = @userId';
    request.input('userId', sql.Int, userId);
  }

  if (action) {
    query += ' AND al.action = @action';
    request.input('action', sql.NVarChar, action);
  }

  if (resourceType) {
    query += ' AND al.resource_type = @resourceType';
    request.input('resourceType', sql.NVarChar, resourceType);
  }

  if (status) {
    query += ' AND al.status = @status';
    request.input('status', sql.NVarChar, status);
  }

  if (startDate) {
    query += ' AND al.created_at >= @startDate';
    request.input('startDate', sql.DateTime, startDate);
  }

  if (endDate) {
    query += ' AND al.created_at <= @endDate';
    request.input('endDate', sql.DateTime, endDate);
  }

  query += `
    ORDER BY al.created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  request.input('limit', sql.Int, limit);
  request.input('offset', sql.Int, offset);

  const result = await request.query(query);
  return result.recordset;
};

/**
 * Get audit logs for specific user
 */
export const getUserAuditLogs = async (userId, limit = 50, offset = 0) => {
  return await getAuditLogs({ userId, limit, offset });
};

/**
 * Get audit logs for specific resource
 */
export const getResourceAuditLogs = async (resourceType, resourceId, limit = 50, offset = 0) => {
  const db = await getPool();

  const result = await db.request()
    .input('resourceType', sql.NVarChar, resourceType)
    .input('resourceId', sql.Int, resourceId)
    .input('limit', sql.Int, limit)
    .input('offset', sql.Int, offset)
    .query(`
      SELECT
        al.id,
        al.user_id,
        u.username,
        al.action,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.status,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.resource_type = @resourceType
        AND al.resource_id = @resourceId
      ORDER BY al.created_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

  return result.recordset;
};

/**
 * Get failed login attempts
 */
export const getFailedLoginAttempts = async (email, limit = 10) => {
  return await getAuditLogs({
    action: 'login',
    status: 'failed',
    limit
  });
};

/**
 * Get security events
 */
export const getSecurityEvents = async (userId = null, limit = 50, offset = 0) => {
  const db = await getPool();

  let query = `
    SELECT *
    FROM audit_logs
    WHERE action IN ('login', 'logout', 'password_change', 'suspicious_activity')
  `;

  const request = db.request();

  if (userId) {
    query += ' AND user_id = @userId';
    request.input('userId', sql.Int, userId);
  }

  query += `
    ORDER BY created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  request.input('limit', sql.Int, limit);
  request.input('offset', sql.Int, offset);

  const result = await request.query(query);
  return result.recordset;
};

/**
 * Get admin actions
 */
export const getAdminActions = async (limit = 100, offset = 0) => {
  const db = await getPool();

  const result = await db.request()
    .input('limit', sql.Int, limit)
    .input('offset', sql.Int, offset)
    .query(`
      SELECT
        al.id,
        al.user_id,
        u.username as admin_username,
        al.action,
        al.resource_type,
        al.resource_id,
        al.old_values,
        al.new_values,
        al.created_at
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'moderator')
        AND al.action IN (
          'suspend_user', 'unsuspend_user', 'delete_user',
          'assign_role', 'remove_role', 'delete_post', 'delete_comment'
        )
      ORDER BY al.created_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

  return result.recordset;
};

/**
 * Get audit log statistics
 */
export const getAuditStatistics = async (startDate = null, endDate = null) => {
  const db = await getPool();

  const request = db.request();

  let dateFilter = '';
  if (startDate) {
    dateFilter += ' AND created_at >= @startDate';
    request.input('startDate', sql.DateTime, startDate);
  }
  if (endDate) {
    dateFilter += ' AND created_at <= @endDate';
    request.input('endDate', sql.DateTime, endDate);
  }

  const result = await request.query(`
    SELECT
      COUNT(*) as total_events,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_events,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_events,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT action) as unique_actions
    FROM audit_logs
    WHERE 1=1 ${dateFilter}
  `);

  return result.recordset[0];
};

export const auditService = {
  logAuditEvent,
  logAuth,
  logCreate,
  logUpdate,
  logDelete,
  logPermissionChange,
  logAccountStatusChange,
  logSecurityEvent,
  getAuditLogs,
  getUserAuditLogs,
  getResourceAuditLogs,
  getFailedLoginAttempts,
  getSecurityEvents,
  getAdminActions,
  getAuditStatistics
};
