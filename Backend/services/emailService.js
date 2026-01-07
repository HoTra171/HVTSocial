import sql from 'mssql';
import { pool } from '../config/db.js';
import { sendEmail, emailConfig } from '../config/email.js';
import logger from '../utils/logger.js';

const getPool = async () => {
  const db = await pool;
  if (!db) throw new Error('Database connection failed');
  return db;
};

/**
 * Email Service
 * Handles template-based emails and email queue
 */

/* ================= EMAIL TEMPLATES ================= */

/**
 * Get email template by name
 */
export const getEmailTemplate = async (templateName) => {
  const db = await getPool();

  const result = await db.request()
    .input('name', sql.NVarChar, templateName)
    .query(`
      SELECT * FROM email_templates
      WHERE name = @name AND active = 1
    `);

  return result.recordset[0];
};

/**
 * Render email template with variables
 */
export const renderTemplate = (template, variables) => {
  let rendered = template;

  // Replace all {{variable}} with actual values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }

  // Add footer
  rendered += emailConfig.footer;

  return rendered;
};

/**
 * Send templated email
 */
export const sendTemplatedEmail = async (to, templateName, variables) => {
  try {
    // Get template from database
    const template = await getEmailTemplate(templateName);

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    // Render template with variables
    const subject = renderTemplate(template.subject, variables);
    const body = renderTemplate(template.body, variables);

    // Send email
    const result = await sendEmail({
      to,
      subject,
      html: body
    });

    logger.info({
      message: 'Templated email sent',
      template: templateName,
      to
    });

    return result;
  } catch (error) {
    logger.error({
      message: 'Failed to send templated email',
      error: error.message,
      template: templateName,
      to
    });
    throw error;
  }
};

/* ================= SPECIFIC EMAIL TYPES ================= */

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (user) => {
  return await sendTemplatedEmail(
    user.email,
    'welcome',
    {
      full_name: user.full_name,
      username: user.username
    }
  );
};

/**
 * Send email verification
 */
export const sendEmailVerification = async (user, verificationLink) => {
  return await sendTemplatedEmail(
    user.email,
    'email_verification',
    {
      full_name: user.full_name,
      verification_link: verificationLink
    }
  );
};

/**
 * Send password reset email (with OTP)
 */
export const sendPasswordResetEmail = async (user, otp) => {
  return await sendTemplatedEmail(
    user.email,
    'password_reset',
    {
      full_name: user.full_name,
      otp: otp
    }
  );
};

/**
 * Send account suspension notification
 */
export const sendAccountSuspendedEmail = async (user, reason, suspendedUntil) => {
  return await sendTemplatedEmail(
    user.email,
    'account_suspended',
    {
      full_name: user.full_name,
      reason: reason,
      suspended_until: suspendedUntil ? new Date(suspendedUntil).toLocaleDateString() : 'Indefinitely'
    }
  );
};

/**
 * Send security alert email
 */
export const sendSecurityAlertEmail = async (user, alertMessage, ipAddress) => {
  return await sendTemplatedEmail(
    user.email,
    'security_alert',
    {
      full_name: user.full_name,
      alert_message: alertMessage,
      ip_address: ipAddress
    }
  );
};

/**
 * Send new login notification
 */
export const sendNewLoginEmail = async (user, ipAddress, userAgent, location = 'Unknown') => {
  const alertMessage = `A new login was detected on your account from ${location}.`;

  return await sendSecurityAlertEmail(user, alertMessage, ipAddress);
};

/**
 * Send password changed notification
 */
export const sendPasswordChangedEmail = async (user) => {
  const alertMessage = 'Your password was recently changed. If you did not make this change, please contact support immediately.';

  return await sendSecurityAlertEmail(user, alertMessage, 'N/A');
};

/**
 * Send comment notification
 */
export const sendCommentNotificationEmail = async (postOwner, commenter, postId) => {
  const subject = `${commenter.full_name} commented on your post`;
  const body = `
    <h2>New Comment on Your Post</h2>
    <p>Hi ${postOwner.full_name},</p>
    <p><strong>${commenter.full_name}</strong> (@${commenter.username}) commented on your post.</p>
    <p><a href="${process.env.FRONTEND_URL}/posts/${postId}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Post</a></p>
  `;

  return await sendEmail({
    to: postOwner.email,
    subject,
    html: body + emailConfig.footer
  });
};

/**
 * Send friend request notification
 */
export const sendFriendRequestEmail = async (recipient, sender) => {
  const subject = `${sender.full_name} sent you a friend request`;
  const body = `
    <h2>New Friend Request</h2>
    <p>Hi ${recipient.full_name},</p>
    <p><strong>${sender.full_name}</strong> (@${sender.username}) wants to connect with you on HVTSocial.</p>
    <p><a href="${process.env.FRONTEND_URL}/friends/requests" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Request</a></p>
  `;

  return await sendEmail({
    to: recipient.email,
    subject,
    html: body + emailConfig.footer
  });
};

/* ================= EMAIL QUEUE ================= */

/**
 * Queue email for later sending
 */
export const queueEmail = async (to, subject, body, templateName = null, scheduledAt = null) => {
  const db = await getPool();

  try {
    const result = await db.request()
      .input('to', sql.NVarChar, to)
      .input('subject', sql.NVarChar, subject)
      .input('body', sql.NVarChar, body)
      .input('templateName', sql.NVarChar, templateName)
      .input('scheduledAt', sql.DateTime, scheduledAt || new Date())
      .query(`
        INSERT INTO email_queue (to_email, subject, body, template_name, scheduled_at)
        OUTPUT INSERTED.*
        VALUES (@to, @subject, @body, @templateName, @scheduledAt)
      `);

    logger.info({
      message: 'Email queued',
      to,
      subject,
      queueId: result.recordset[0].id
    });

    return result.recordset[0];
  } catch (error) {
    logger.error({
      message: 'Failed to queue email',
      error: error.message,
      to
    });
    throw error;
  }
};

/**
 * Process email queue (send pending emails)
 */
export const processEmailQueue = async (limit = 10) => {
  const db = await getPool();

  try {
    // Get pending emails
    const result = await db.request()
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit) *
        FROM email_queue
        WHERE status = 'pending'
          AND scheduled_at <= GETDATE()
          AND attempts < max_attempts
        ORDER BY scheduled_at ASC
      `);

    const emails = result.recordset;

    logger.info({
      message: 'Processing email queue',
      count: emails.length
    });

    for (const email of emails) {
      try {
        // Attempt to send
        await sendEmail({
          to: email.to_email,
          subject: email.subject,
          html: email.body
        });

        // Mark as sent
        await db.request()
          .input('id', sql.Int, email.id)
          .query(`
            UPDATE email_queue
            SET status = 'sent',
                sent_at = GETDATE()
            WHERE id = @id
          `);

        logger.info({
          message: 'Queued email sent',
          queueId: email.id,
          to: email.to_email
        });
      } catch (error) {
        // Increment attempts
        await db.request()
          .input('id', sql.Int, email.id)
          .input('errorMessage', sql.NVarChar, error.message)
          .query(`
            UPDATE email_queue
            SET attempts = attempts + 1,
                error_message = @errorMessage,
                status = CASE
                  WHEN attempts + 1 >= max_attempts THEN 'failed'
                  ELSE status
                END
            WHERE id = @id
          `);

        logger.error({
          message: 'Failed to send queued email',
          queueId: email.id,
          attempts: email.attempts + 1,
          error: error.message
        });
      }
    }

    return {
      processed: emails.length
    };
  } catch (error) {
    logger.error({
      message: 'Error processing email queue',
      error: error.message
    });
    throw error;
  }
};

/**
 * Get email queue status
 */
export const getEmailQueueStatus = async () => {
  const db = await getPool();

  const result = await db.request().query(`
    SELECT
      status,
      COUNT(*) as count
    FROM email_queue
    GROUP BY status
  `);

  return result.recordset;
};

/**
 * Clean old sent/failed emails from queue
 */
export const cleanEmailQueue = async (daysOld = 7) => {
  const db = await getPool();

  const result = await db.request()
    .input('daysOld', sql.Int, daysOld)
    .query(`
      DELETE FROM email_queue
      WHERE status IN ('sent', 'failed')
        AND created_at < DATEADD(day, -@daysOld, GETDATE())
    `);

  logger.info({
    message: 'Email queue cleaned',
    deletedRows: result.rowsAffected[0]
  });

  return {
    deleted: result.rowsAffected[0]
  };
};

export const emailService = {
  getEmailTemplate,
  renderTemplate,
  sendTemplatedEmail,
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendAccountSuspendedEmail,
  sendSecurityAlertEmail,
  sendNewLoginEmail,
  sendPasswordChangedEmail,
  sendCommentNotificationEmail,
  sendFriendRequestEmail,
  queueEmail,
  processEmailQueue,
  getEmailQueueStatus,
  cleanEmailQueue
};
