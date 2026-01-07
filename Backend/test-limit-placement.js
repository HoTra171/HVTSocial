// Test exact issue with LIMIT placement
const query = `  LEFT JOIN LATERAL (
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

console.log('ORIGINAL:');
console.log(query);

// Current regex
let converted = query;
converted = converted.replace(/SELECT\s+TOP\s*\((\d+)\)([^]*?)(ORDER BY[^)]+)/gi, (match, limit, middle, orderBy) => {
  console.log('\n==== REGEX MATCH ====');
  console.log('Full match:', match);
  console.log('Limit:', limit);
  console.log('Middle:', middle);
  console.log('OrderBy:', orderBy);
  return `SELECT${middle}${orderBy} LIMIT ${limit}`;
});

console.log('\n\nCONVERTED:');
console.log(converted);

// The issue: [^)]+ will match "ORDER BY m.created_at DESC, m.id DESC\n  "
// It includes the closing parenthesis context!

console.log('\n\n==== BETTER APPROACH ====');
// Better: Only match until we hit the closing paren of subquery
let better = query;
better = better.replace(/SELECT\s+TOP\s*\((\d+)\)([^]*?)(\s+ORDER BY[^\)]+?)(\s*\))/gi, (match, limit, middle, orderBy, closeParen) => {
  console.log('Match:', match);
  console.log('OrderBy:', orderBy);
  console.log('CloseParen:', closeParen);
  return `SELECT${middle}${orderBy} LIMIT ${limit}${closeParen}`;
});

console.log(better);
