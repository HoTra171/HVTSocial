/**
 * Script to replace SQL Server's GETDATE() with PostgreSQL's NOW()
 * in all JavaScript files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToFix = [
  'services/accountManagementService.js',
  'services/gdprService.js',
  'services/friendshipService.js',
  'services/emailService.js',
  'services/contentModerationService.js',
  'services/commentService.js',
  'models/notificationModel.js',
  'models/chatModel.js',
  'controllers/userController.js',
  'controllers/storyController.js',
  'middlewares/advancedRateLimiting.js',
];

let totalFixed = 0;

filesToFix.forEach((relPath) => {
  const filePath = path.join(__dirname, '..', relPath);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${relPath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Replace GETDATE() with NOW()
  content = content.replace(/GETDATE\(\)/g, 'NOW()');

  // Replace DATEADD functions (PostgreSQL uses INTERVAL)
  // DATEADD(hour, -24, GETDATE()) → NOW() - INTERVAL '24 hours'
  content = content.replace(
    /DATEADD\(hour,\s*-(\d+),\s*GETDATE\(\)\)/gi,
    "NOW() - INTERVAL '$1 hours'"
  );
  content = content.replace(
    /DATEADD\(hour,\s*(\d+),\s*GETDATE\(\)\)/gi,
    "NOW() + INTERVAL '$1 hours'"
  );

  // DATEADD(day, -30, GETDATE()) → NOW() - INTERVAL '30 days'
  content = content.replace(
    /DATEADD\(day,\s*-(\d+),\s*GETDATE\(\)\)/gi,
    "NOW() - INTERVAL '$1 days'"
  );
  content = content.replace(
    /DATEADD\(DAY,\s*-(\d+),\s*GETDATE\(\)\)/gi,
    "NOW() - INTERVAL '$1 days'"
  );

  // DATEADD(minute, -X, GETDATE())
  content = content.replace(
    /DATEADD\(minute,\s*-@?(\w+),\s*GETDATE\(\)\)/gi,
    "NOW() - INTERVAL '@$1 minutes'"
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${relPath}`);
    totalFixed++;
  } else {
    console.log(`⚪ No changes: ${relPath}`);
  }
});

console.log(`\n✨ Done! Fixed ${totalFixed} files.`);
console.log('\n⚠️  Note: Some DATEADD patterns may need manual review.');
console.log('   Check files with @variable parameters in DATEADD.');
