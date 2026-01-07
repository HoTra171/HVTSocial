// Updated test with proper LIMIT handling
const sqlQuery = `OUTER APPLY (
    SELECT TOP (1)
      m.sender_id,
      m.content,
      m.message_type,
      m.media_url,
      m.created_at
    FROM messages m
    WHERE m.chat_id = c.id
    ORDER BY m.created_at DESC, m.id DESC
  ) lmDetail`;

console.log('ORIGINAL:', sqlQuery);

let pgQuery = sqlQuery;

// Step 1: Convert OUTER APPLY
pgQuery = pgQuery.replace(/OUTER\s+APPLY\s*\(/gi, 'LEFT JOIN LATERAL (');
console.log('\nAfter OUTER APPLY conversion:', pgQuery);

// Step 2: Handle SELECT TOP (n) ... ORDER BY -> SELECT ... ORDER BY LIMIT n
pgQuery = pgQuery.replace(/SELECT\s+TOP\s*\((\d+)\)([^]*?)(ORDER BY[^)]+)/gi, (match, limit, middle, orderBy) => {
  return `SELECT${middle}${orderBy} LIMIT ${limit}`;
});
console.log('\nAfter TOP to LIMIT:', pgQuery);

// Step 3: Add ON true
pgQuery = pgQuery.replace(/\) (lmDetail|uc|other)(?!\s+ON)/gi, ') $1 ON true');
console.log('\nAfter ON true:', pgQuery);

console.log('\n\n===== TESTING FULL QUERY =====\n');

// Test với full query
const fullQuery = `  LEFT JOIN LATERAL (
    SELECT TOP (1)
      m.sender_id,
      m.content
    FROM messages m
    WHERE m.chat_id = c.id
    ORDER BY m.created_at DESC, m.id DESC
  ) lmDetail

  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS unread_count
    FROM messages m
    WHERE m.chat_id = c.id
  ) uc

  LEFT JOIN LATERAL (
    SELECT TOP (1) cu.user_id AS other_user_id
    FROM chat_users cu
    WHERE cu.chat_id = c.id
    ORDER BY cu.id
  ) other`;

let converted = fullQuery;
converted = converted.replace(/SELECT\s+TOP\s*\((\d+)\)([^]*?)(ORDER BY[^)]+)/gi, (match, limit, middle, orderBy) => {
  return `SELECT${middle}${orderBy} LIMIT ${limit}`;
});
converted = converted.replace(/\) (lmDetail|uc|other)(?!\s+ON)/gi, ') $1 ON true');

console.log(converted);
