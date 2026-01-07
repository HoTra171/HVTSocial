// Test query conversion for debugging
const sqlQuery = `WITH MyChats AS (
  SELECT chat_id
  FROM chat_users
  WHERE user_id = @userId
),
Base AS (
  SELECT 
    c.id AS chat_id,
    c.is_group_chat,
    c.name AS chat_name,

    CASE WHEN c.is_group_chat = 0 THEN u.id ELSE NULL END AS target_id,
    CASE WHEN c.is_group_chat = 0 THEN u.full_name ELSE c.name END AS target_name,
    CASE WHEN c.is_group_chat = 0 THEN u.username ELSE NULL END AS target_username,

    CASE 
      WHEN c.is_group_chat = 0 THEN u.avatar
      ELSE uLast.avatar
    END AS avatar,

    lmDetail.content      AS last_message,
    lmDetail.message_type AS last_message_type,
    lmDetail.media_url    AS last_media_url,

    ISNULL(uc.unread_count, 0) AS unread_count,

    COALESCE(lmDetail.created_at, c.updated_at, c.created_at) AS last_time

  FROM chats c
  JOIN MyChats mc
    ON mc.chat_id = c.id

  OUTER APPLY (
    SELECT TOP (1)
      m.sender_id,
      m.content,
      m.message_type,
      m.media_url,
      m.created_at
    FROM messages m
    WHERE m.chat_id = c.id
    ORDER BY m.created_at DESC, m.id DESC
  ) lmDetail

  OUTER APPLY (
    SELECT COUNT(*) AS unread_count
    FROM messages m
    WHERE m.chat_id = c.id
      AND m.sender_id <> @userId
      AND m.status IN ('sent', 'delivered')
  ) uc

  OUTER APPLY (
    SELECT TOP (1) cu.user_id AS other_user_id
    FROM chat_users cu
    WHERE cu.chat_id = c.id
      AND cu.user_id <> @userId
      AND c.is_group_chat = 0
  ) other

  LEFT JOIN users u
    ON u.id = other.other_user_id

  LEFT JOIN users uLast
    ON uLast.id = lmDetail.sender_id
),
Ranked AS (
  SELECT
    *,
    CASE 
      WHEN is_group_chat = 0
        THEN ROW_NUMBER() OVER (PARTITION BY target_id ORDER BY last_time DESC, chat_id DESC)
      ELSE 1
    END AS rn
  FROM Base
)
SELECT *
FROM Ranked
WHERE is_group_chat = 1 OR rn = 1
ORDER BY last_time DESC, chat_id DESC;`;

console.log('===== ORIGINAL QUERY =====');
console.log(sqlQuery);

// Apply conversions step by step
let pgQuery = sqlQuery;

console.log('\n===== STEP 1: Replace @userId with $1 =====');
pgQuery = pgQuery.replace(/@userId/g, '$1');
console.log('✓ @userId → $1');

console.log('\n===== STEP 2: Convert SQL Server functions =====');
pgQuery = pgQuery
  .replace(/GETDATE\(\)/gi, 'NOW()')
  .replace(/ISNULL\(/gi, 'COALESCE(')
  .replace(/\[dbo\]\./gi, '')
  .replace(/\[(\w+)\]/g, '$1');
console.log('✓ ISNULL → COALESCE');

console.log('\n===== STEP 3: Handle TOP clause =====');
const topMatches = pgQuery.match(/SELECT\s+TOP\s+\(\d+\)/gi);
if (topMatches) {
  console.log(`Found ${topMatches.length} TOP clauses:`, topMatches);
  pgQuery = pgQuery.replace(/SELECT\s+TOP\s+\((\d+)\)/gi, 'SELECT');
  // Add LIMIT at the end of subquery
  console.log('✓ Removed SELECT TOP (n)');
}

console.log('\n===== STEP 4: Convert OUTER APPLY =====');
const outerApplyMatches = pgQuery.match(/OUTER\s+APPLY\s*\([^)]+\)/gi);
console.log(`Found ${outerApplyMatches ? outerApplyMatches.length : 0} OUTER APPLY`);
pgQuery = pgQuery.replace(/OUTER\s+APPLY\s*\(/gi, 'LEFT JOIN LATERAL (');
console.log('✓ OUTER APPLY ( → LEFT JOIN LATERAL (');

console.log('\n===== STEP 5: Add ON true after aliases =====');
console.log('Looking for patterns: ) lmDetail, ) uc, ) other');
const beforeOnTrue = pgQuery;
pgQuery = pgQuery.replace(/\) (lmDetail|uc|other)(?!\s+ON)/gi, ') $1 ON true');
if (beforeOnTrue !== pgQuery) {
  console.log('✓ Added ON true after LATERAL JOIN aliases');
} else {
  console.log('⚠️  No matches found for ON true insertion!');
  console.log('Searching for ) lmDetail...');
  const lmDetailMatch = pgQuery.match(/\)\s*lmDetail/i);
  console.log('lmDetailMatch:', lmDetailMatch);
}

console.log('\n===== FINAL CONVERTED QUERY =====');
console.log(pgQuery);

console.log('\n===== CHARACTER POSITION 876 =====');
console.log('Character at position 876:', pgQuery[875]);
console.log('Context around 876:');
console.log(pgQuery.substring(865, 885));
