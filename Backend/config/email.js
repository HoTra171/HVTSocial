import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

/**
 * Email Configuration
 * Setup nodemailer transporter for sending emails
 */

// Create transporter based on environment
const createTransporter = () => {
  // Development: Use Ethereal (fake SMTP for testing)
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_HOST) {
    logger.info('Using Ethereal email for development');

    // In production, you would use real SMTP
    // For now, create a test account
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'ethereal-password',
      },
    });
  }

  // Production: Use configured SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      logger.error({
        message: 'Email transporter verification failed',
        error: error.message,
      });
    } else {
      logger.info('Email server is ready to send messages');
    }
  });

  return transporter;
};

export const transporter = createTransporter();

/**
 * Email configuration
 */
export const emailConfig = {
  from: {
    name: process.env.EMAIL_FROM_NAME || 'HVTSocial',
    address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'noreply@hvtsocial.com',
  },

  // Reply-to address
  replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,

  // BCC for admin notifications
  adminBcc: process.env.EMAIL_ADMIN_BCC || null,

  // Email footer
  footer: `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
      <p>This email was sent by HVTSocial. If you didn't request this, please ignore it.</p>
      <p>&copy; ${new Date().getFullYear()} HVTSocial. All rights reserved.</p>
    </div>
  `,
};

/**
 * Send email helper
 */
export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
      to: options.to,
      subject: options.subject,
      html: options.html || options.body,
      text: options.text || null,
      replyTo: options.replyTo || emailConfig.replyTo,
      cc: options.cc || null,
      bcc: options.bcc || emailConfig.adminBcc,
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info({
      message: 'Email sent successfully',
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });

    // Log preview URL in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Preview URL: ' + nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    logger.error({
      message: 'Failed to send email',
      error: error.message,
      to: options.to,
      subject: options.subject,
    });

    throw error;
  }
};

export default {
  transporter,
  emailConfig,
  sendEmail,
};
