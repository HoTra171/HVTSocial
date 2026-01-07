import sql from 'mssql';
import { pool } from '../config/db.js';
import logger from '../utils/logger.js';

const getPool = async () => {
  const db = await pool;
  if (!db) throw new Error('Database connection failed');
  return db;
};

/**
 * Content Moderation Service
 * Auto-moderation, spam detection, and content filtering
 */

/* ================= MODERATION RULES ================= */

/**
 * Get all active moderation rules
 */
export const getActiveRules = async () => {
  const db = await getPool();

  const result = await db.request().query(`
    SELECT *
    FROM content_moderation_rules
    WHERE active = 1
    ORDER BY severity DESC, created_at ASC
  `);

  return result.recordset;
};

/**
 * Check content against moderation rules
 */
export const checkContent = async (content, contentType = 'post') => {
  const rules = await getActiveRules();
  const violations = [];

  for (const rule of rules) {
    const violated = await checkRule(content, rule);

    if (violated) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.rule_type,
        action: rule.action,
        severity: rule.severity,
        matched: violated.matched,
      });

      // If action is auto_remove, stop checking (content will be removed)
      if (rule.action === 'auto_remove') {
        break;
      }
    }
  }

  return {
    hasViolations: violations.length > 0,
    violations,
    action: violations.length > 0 ? violations[0].action : 'approve',
    severity: violations.length > 0 ? violations[0].severity : null,
  };
};

/**
 * Check single rule against content
 */
async function checkRule(content, rule) {
  const contentLower = content.toLowerCase();

  switch (rule.rule_type) {
    case 'keyword':
      return checkKeywordRule(contentLower, rule);

    case 'regex':
      return checkRegexRule(content, rule);

    case 'spam':
      return checkSpamRule(content, rule);

    case 'ai_filter':
      // TODO: Integrate with AI service (OpenAI Moderation API, etc.)
      return null;

    default:
      return null;
  }
}

/**
 * Check keyword-based rule
 */
function checkKeywordRule(content, rule) {
  const keywords = rule.pattern.split(',').map((k) => k.trim().toLowerCase());

  for (const keyword of keywords) {
    if (content.includes(keyword)) {
      return {
        matched: keyword,
        type: 'keyword',
      };
    }
  }

  return null;
}

/**
 * Check regex-based rule
 */
function checkRegexRule(content, rule) {
  try {
    const regex = new RegExp(rule.pattern, 'gi');
    const match = content.match(regex);

    if (match) {
      return {
        matched: match[0],
        type: 'regex',
      };
    }
  } catch (error) {
    logger.error({
      message: 'Invalid regex pattern in moderation rule',
      ruleId: rule.id,
      pattern: rule.pattern,
      error: error.message,
    });
  }

  return null;
}

/**
 * Check for spam patterns
 */
function checkSpamRule(content, rule) {
  // Check for excessive URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex) || [];

  if (urls.length > 3) {
    return {
      matched: `${urls.length} URLs found`,
      type: 'spam',
    };
  }

  // Check for excessive repetition
  const words = content.split(/\s+/);
  const wordCount = {};

  for (const word of words) {
    if (word.length > 3) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  }

  for (const [word, count] of Object.entries(wordCount)) {
    if (count > 5) {
      return {
        matched: `"${word}" repeated ${count} times`,
        type: 'spam',
      };
    }
  }

  // Check for all caps (more than 50% of content)
  const capsCount = (content.match(/[A-Z]/g) || []).length;
  const lettersCount = (content.match(/[a-zA-Z]/g) || []).length;

  if (lettersCount > 10 && capsCount / lettersCount > 0.5) {
    return {
      matched: 'Excessive caps usage',
      type: 'spam',
    };
  }

  return null;
}

/* ================= MODERATION ACTIONS ================= */

/**
 * Moderate post
 */
export const moderatePost = async (postId, userId, content) => {
  const result = await checkContent(content, 'post');

  if (result.hasViolations) {
    logger.warn({
      message: 'Content moderation violation detected',
      postId,
      userId,
      violations: result.violations,
    });

    // Log the violation
    await logModerationAction(userId, 'post', postId, result.action, result.violations);

    // Take action based on severity
    if (result.action === 'auto_remove') {
      await removePost(postId, 'Automatic moderation: ' + result.violations[0].ruleName);
      return {
        approved: false,
        action: 'removed',
        reason: result.violations[0].ruleName,
      };
    } else if (result.action === 'flag') {
      await flagPost(postId, result.violations[0].ruleName);
      return {
        approved: true,
        action: 'flagged',
        reason: result.violations[0].ruleName,
      };
    } else if (result.action === 'warn_user') {
      await warnUser(userId, result.violations[0].ruleName);
      return {
        approved: true,
        action: 'warned',
        reason: result.violations[0].ruleName,
      };
    }
  }

  return {
    approved: true,
    action: 'approved',
    violations: [],
  };
};

/**
 * Moderate comment
 */
export const moderateComment = async (commentId, userId, content) => {
  const result = await checkContent(content, 'comment');

  if (result.hasViolations) {
    logger.warn({
      message: 'Comment moderation violation detected',
      commentId,
      userId,
      violations: result.violations,
    });

    await logModerationAction(userId, 'comment', commentId, result.action, result.violations);

    if (result.action === 'auto_remove') {
      await removeComment(commentId, 'Automatic moderation: ' + result.violations[0].ruleName);
      return {
        approved: false,
        action: 'removed',
        reason: result.violations[0].ruleName,
      };
    } else if (result.action === 'flag') {
      await flagComment(commentId, result.violations[0].ruleName);
      return {
        approved: true,
        action: 'flagged',
      };
    }
  }

  return {
    approved: true,
    action: 'approved',
  };
};

/* ================= HELPER FUNCTIONS ================= */

/**
 * Remove post
 */
async function removePost(postId, reason) {
  const db = await getPool();

  await db.request().input('postId', sql.Int, postId).input('reason', sql.NVarChar, reason).query(`
      UPDATE posts
      SET content = '[Removed by moderation]',
          media = NULL
      WHERE id = @postId
    `);

  logger.warn({
    message: 'Post removed by auto-moderation',
    postId,
    reason,
  });
}

/**
 * Remove comment
 */
async function removeComment(commentId, reason) {
  const db = await getPool();

  await db.request().input('commentId', sql.Int, commentId).query(`
      UPDATE comments
      SET content = '[Removed by moderation]'
      WHERE id = @commentId
    `);

  logger.warn({
    message: 'Comment removed by auto-moderation',
    commentId,
    reason,
  });
}

/**
 * Flag post for manual review
 */
async function flagPost(postId, reason) {
  const db = await getPool();

  // Create a report
  await db.request().input('postId', sql.Int, postId).input('reason', sql.NVarChar, reason).query(`
      INSERT INTO reports (reporter_id, target_type, target_id, reason, status)
      VALUES (NULL, 'post', @postId, @reason, 'pending')
    `);

  logger.info({
    message: 'Post flagged for review',
    postId,
    reason,
  });
}

/**
 * Flag comment for manual review
 */
async function flagComment(commentId, reason) {
  const db = await getPool();

  await db.request().input('commentId', sql.Int, commentId).input('reason', sql.NVarChar, reason)
    .query(`
      INSERT INTO reports (reporter_id, target_type, target_id, reason, status)
      VALUES (NULL, 'comment', @commentId, @reason, 'pending')
    `);

  logger.info({
    message: 'Comment flagged for review',
    commentId,
    reason,
  });
}

/**
 * Warn user
 */
async function warnUser(userId, reason) {
  const db = await getPool();

  // Send notification to user
  await db
    .request()
    .input('userId', sql.Int, userId)
    .input('content', sql.NVarChar, `Your content was flagged: ${reason}`).query(`
      INSERT INTO notifications (user_id, content, type, status)
      VALUES (@userId, @content, 'other', 'unread')
    `);

  logger.info({
    message: 'User warned',
    userId,
    reason,
  });
}

/**
 * Log moderation action
 */
async function logModerationAction(userId, targetType, targetId, action, violations) {
  const db = await getPool();

  const notes = JSON.stringify(violations);

  await db
    .request()
    .input('userId', sql.Int, userId)
    .input('targetType', sql.NVarChar, targetType)
    .input('targetId', sql.Int, targetId)
    .input('action', sql.NVarChar, action)
    .input('notes', sql.NVarChar, notes).query(`
      INSERT INTO moderation_actions (moderator_id, target_type, target_id, action, reason, notes)
      VALUES (NULL, @targetType, @targetId, @action, 'auto', @notes)
    `);
}

/* ================= SPAM DETECTION ================= */

/**
 * Detect if user is spamming
 */
export const detectSpam = async (
  userId,
  contentType = 'post',
  timeWindowMinutes = 5,
  threshold = 5
) => {
  const db = await getPool();

  const table = contentType === 'post' ? 'posts' : 'comments';

  const result = await db
    .request()
    .input('userId', sql.Int, userId)
    .input('minutes', sql.Int, timeWindowMinutes).query(`
      SELECT COUNT(*) as count
      FROM ${table}
      WHERE user_id = @userId
        AND created_at > DATEADD(minute, -@minutes, GETDATE())
    `);

  const count = result.recordset[0].count;

  if (count >= threshold) {
    logger.warn({
      message: 'Spam detected',
      userId,
      contentType,
      count,
      threshold,
    });

    return {
      isSpam: true,
      count,
      threshold,
    };
  }

  return {
    isSpam: false,
    count,
    threshold,
  };
};

/* ================= ADMIN FUNCTIONS ================= */

/**
 * Get all flagged content
 */
export const getFlaggedContent = async (limit = 50, offset = 0) => {
  const db = await getPool();

  const result = await db.request().input('limit', sql.Int, limit).input('offset', sql.Int, offset)
    .query(`
      SELECT
        r.id,
        r.target_type,
        r.target_id,
        r.reason,
        r.status,
        r.created_at,
        u.username as reporter_username
      FROM reports r
      LEFT JOIN users u ON r.reporter_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `);

  return result.recordset;
};

/**
 * Review flagged content (approve or remove)
 */
export const reviewFlaggedContent = async (reportId, reviewerId, action, notes = null) => {
  const db = await getPool();

  // Get report details
  const reportResult = await db
    .request()
    .input('reportId', sql.Int, reportId)
    .query(`SELECT * FROM reports WHERE id = @reportId`);

  const report = reportResult.recordset[0];

  if (!report) {
    throw new Error('Report not found');
  }

  // Take action based on decision
  if (action === 'remove') {
    if (report.target_type === 'post') {
      await removePost(report.target_id, notes || 'Removed by moderator');
    } else if (report.target_type === 'comment') {
      await removeComment(report.target_id, notes || 'Removed by moderator');
    }
  }

  // Update report status
  await db
    .request()
    .input('reportId', sql.Int, reportId)
    .input('reviewerId', sql.Int, reviewerId)
    .input('action', sql.NVarChar, action)
    .input('notes', sql.NVarChar, notes).query(`
      UPDATE reports
      SET status = 'reviewed',
          reviewed_at = GETDATE(),
          reviewer_id = @reviewerId,
          action_taken = @action,
          action_notes = @notes
      WHERE id = @reportId
    `);

  // Log moderation action
  await db
    .request()
    .input('reviewerId', sql.Int, reviewerId)
    .input('targetType', sql.NVarChar, report.target_type)
    .input('targetId', sql.Int, report.target_id)
    .input('action', sql.NVarChar, action)
    .input('notes', sql.NVarChar, notes || report.reason).query(`
      INSERT INTO moderation_actions (moderator_id, target_type, target_id, action, reason, notes)
      VALUES (@reviewerId, @targetType, @targetId, @action, 'manual_review', @notes)
    `);

  logger.info({
    message: 'Content reviewed',
    reportId,
    reviewerId,
    action,
  });

  return {
    success: true,
    action,
  };
};

export const contentModerationService = {
  getActiveRules,
  checkContent,
  moderatePost,
  moderateComment,
  detectSpam,
  getFlaggedContent,
  reviewFlaggedContent,
};
