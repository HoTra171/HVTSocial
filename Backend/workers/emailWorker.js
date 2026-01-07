import { emailQueue } from '../config/queue.js';
import { sendEmail } from '../config/email.js';
import * as emailService from '../services/emailService.js';
import logger from '../utils/logger.js';

/**
 * Email Worker
 * Processes email jobs from Bull queue
 */

/**
 * Process email jobs
 */
emailQueue.process(async (job) => {
  const { type, data } = job.data;

  logger.info({
    message: 'Processing email job',
    jobId: job.id,
    type,
    to: data.to || data.user?.email
  });

  try {
    switch (type) {
      case 'welcome':
        await emailService.sendWelcomeEmail(data.user);
        break;

      case 'email_verification':
        await emailService.sendEmailVerification(data.user, data.verificationLink);
        break;

      case 'password_reset':
        await emailService.sendPasswordResetEmail(data.user, data.otp);
        break;

      case 'account_suspended':
        await emailService.sendAccountSuspendedEmail(
          data.user,
          data.reason,
          data.suspendedUntil
        );
        break;

      case 'security_alert':
        await emailService.sendSecurityAlertEmail(
          data.user,
          data.alertMessage,
          data.ipAddress
        );
        break;

      case 'new_login':
        await emailService.sendNewLoginEmail(
          data.user,
          data.ipAddress,
          data.userAgent,
          data.location
        );
        break;

      case 'password_changed':
        await emailService.sendPasswordChangedEmail(data.user);
        break;

      case 'comment_notification':
        await emailService.sendCommentNotificationEmail(
          data.postOwner,
          data.commenter,
          data.postId
        );
        break;

      case 'friend_request':
        await emailService.sendFriendRequestEmail(
          data.recipient,
          data.sender
        );
        break;

      case 'templated':
        await emailService.sendTemplatedEmail(
          data.to,
          data.templateName,
          data.variables
        );
        break;

      case 'custom':
        await sendEmail({
          to: data.to,
          subject: data.subject,
          html: data.html || data.body,
          text: data.text
        });
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    return {
      success: true,
      type,
      to: data.to || data.user?.email
    };
  } catch (error) {
    logger.error({
      message: 'Email job failed',
      jobId: job.id,
      type,
      error: error.message
    });

    throw error; // Will trigger retry
  }
});

/**
 * Helper functions to add jobs to queue
 */

export const queueWelcomeEmail = async (user) => {
  return await emailQueue.add({
    type: 'welcome',
    data: { user }
  });
};

export const queueEmailVerification = async (user, verificationLink) => {
  return await emailQueue.add({
    type: 'email_verification',
    data: { user, verificationLink }
  });
};

export const queuePasswordResetEmail = async (user, otp) => {
  return await emailQueue.add({
    type: 'password_reset',
    data: { user, otp }
  });
};

export const queueAccountSuspendedEmail = async (user, reason, suspendedUntil) => {
  return await emailQueue.add({
    type: 'account_suspended',
    data: { user, reason, suspendedUntil }
  });
};

export const queueSecurityAlertEmail = async (user, alertMessage, ipAddress) => {
  return await emailQueue.add({
    type: 'security_alert',
    data: { user, alertMessage, ipAddress }
  });
};

export const queueNewLoginEmail = async (user, ipAddress, userAgent, location) => {
  return await emailQueue.add({
    type: 'new_login',
    data: { user, ipAddress, userAgent, location }
  });
};

export const queuePasswordChangedEmail = async (user) => {
  return await emailQueue.add({
    type: 'password_changed',
    data: { user }
  });
};

export const queueCommentNotification = async (postOwner, commenter, postId) => {
  return await emailQueue.add({
    type: 'comment_notification',
    data: { postOwner, commenter, postId }
  });
};

export const queueFriendRequestEmail = async (recipient, sender) => {
  return await emailQueue.add({
    type: 'friend_request',
    data: { recipient, sender }
  });
};

export const queueTemplatedEmail = async (to, templateName, variables) => {
  return await emailQueue.add({
    type: 'templated',
    data: { to, templateName, variables }
  });
};

export const queueCustomEmail = async (to, subject, html, text = null) => {
  return await emailQueue.add({
    type: 'custom',
    data: { to, subject, html, text }
  });
};

logger.info('Email worker started and listening for jobs');

export default {
  queueWelcomeEmail,
  queueEmailVerification,
  queuePasswordResetEmail,
  queueAccountSuspendedEmail,
  queueSecurityAlertEmail,
  queueNewLoginEmail,
  queuePasswordChangedEmail,
  queueCommentNotification,
  queueFriendRequestEmail,
  queueTemplatedEmail,
  queueCustomEmail
};
