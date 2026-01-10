/**
 * Script to replace SQL Server pagination with PostgreSQL syntax
 * OFFSET X ROWS FETCH NEXT Y ROWS ONLY → LIMIT Y OFFSET X
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToFix = [
  'services/notificationService.js',
  'services/accountManagementService.js',
  'services/auditService.js',
  'services/contentModerationService.js',
  'services/friendshipService.js',
  'services/gdprService.js',
  'services/likeService.js',
];

let totalFixed = 0;
let totalReplacements = 0;

filesToFix.forEach((relPath) => {
  const filePath = path.join(__dirname, '..', relPath);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${relPath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Pattern 1: OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  // Replace with: LIMIT @limit OFFSET @offset
  const pattern1 = /OFFSET\s+@offset\s+ROWS\s+FETCH\s+NEXT\s+@limit\s+ROWS\s+ONLY/gi;
  const matches1 = content.match(pattern1);
  if (matches1) {
    content = content.replace(pattern1, 'LIMIT @limit OFFSET @offset');
    totalReplacements += matches1.length;
    console.log(`  ✓ Fixed ${matches1.length} pagination(s) in ${relPath}`);
  }

  // Pattern 2: OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY
  // Replace with: LIMIT @limit
  const pattern2 = /OFFSET\s+0\s+ROWS\s+FETCH\s+NEXT\s+@limit\s+ROWS\s+ONLY/gi;
  const matches2 = content.match(pattern2);
  if (matches2) {
    content = content.replace(pattern2, 'LIMIT @limit');
    totalReplacements += matches2.length;
    console.log(`  ✓ Fixed ${matches2.length} simple pagination(s) in ${relPath}`);
  }

  // Pattern 3: OFFSET @offset ROWS (without FETCH)
  // This might be incomplete, but let's log it
  const pattern3 = /OFFSET\s+@offset\s+ROWS(?!\s+FETCH)/gi;
  const matches3 = content.match(pattern3);
  if (matches3) {
    console.log(`  ⚠️  Found incomplete OFFSET in ${relPath} - needs manual review`);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${relPath}`);
    totalFixed++;
  } else {
    console.log(`⚪ No changes: ${relPath}`);
  }
});

console.log(`\n✨ Done! Fixed ${totalFixed} files with ${totalReplacements} replacements.`);
console.log('\n⚠️  Note: Please review files with "incomplete OFFSET" warnings.');
