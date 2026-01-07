/**
 * Script to replace hardcoded localhost:5000 with dynamic API_URL
 * Usage: node fix-localhost.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to fix
const filesToFix = [
  'src/socket.js',
  'src/page/NotificationsPage.jsx',
  'src/page/Chatbox.jsx',
  'src/components/RecentChats.jsx',
  'src/components/PostCard.jsx',
  'src/components/ShareModal.jsx',
  'src/page/Feed.jsx',
  'src/page/CreatePost.jsx',
  'src/page/Messages.jsx',
  'src/components/RecentMessages.jsx',
  'src/components/UserCard.jsx',
  'src/page/Connections.jsx',
  'src/components/StoriesBar.jsx',
  'src/components/ProfileModal.jsx',
  'src/components/CommentItem.jsx',
  'src/page/Profile.jsx',
  'src/components/StoryViewer.jsx',
  'src/components/StoryModal.jsx',
  'src/page/Layout.jsx',
  'src/page/Discover.jsx',
  'src/components/FriendButton.jsx',
  'src/page/ChangePassword.jsx',
  'src/page/ForgotPassword.jsx',
  'src/components/UnreadBadge.jsx'
];

console.log('🔧 Starting to fix hardcoded localhost:5000...\n');

let totalFixed = 0;
let totalFiles = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Check if already imports API_URL
    const hasApiImport = content.includes("from '../constants/api'") ||
                        content.includes('from "../constants/api"') ||
                        content.includes("from '../../constants/api'") ||
                        content.includes('from "../../constants/api"');

    // Add import if needed
    if (!hasApiImport && content.includes('localhost:5000')) {
      // Find the last import statement
      const importMatches = content.match(/^import .+ from .+;$/gm);
      if (importMatches && importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];

        // Determine correct path (../ or ../../)
        const depth = filePath.split('/').length - 2; // src/components = 2, src/page = 2
        const importPath = '../'.repeat(depth > 1 ? depth - 1 : 1) + 'constants/api';

        content = content.replace(
          lastImport,
          lastImport + `\nimport { API_URL, SERVER_ORIGIN } from '${importPath}';`
        );
      }
    }

    // Replace all occurrences of localhost:5000
    let replacements = 0;

    // Pattern 1: "http://localhost:5000/api/..." -> `${API_URL}/...`
    content = content.replace(
      /"http:\/\/localhost:5000\/api\/([^"]+)"/g,
      (match) => {
        replacements++;
        return match.replace('"http://localhost:5000/api/', '`${API_URL}/');
      }
    );

    // Pattern 2: 'http://localhost:5000/api/...' -> `${API_URL}/...`
    content = content.replace(
      /'http:\/\/localhost:5000\/api\/([^']+)'/g,
      (match) => {
        replacements++;
        return match.replace("'http://localhost:5000/api/", '`${API_URL}/');
      }
    );

    // Pattern 3: `http://localhost:5000/api/...` -> `${API_URL}/...`
    content = content.replace(
      /`http:\/\/localhost:5000\/api\/([^`]+)`/g,
      (match) => {
        replacements++;
        return match.replace('http://localhost:5000/api/', '${API_URL}/');
      }
    );

    // Pattern 4: "http://localhost:5000" (without /api) -> SERVER_ORIGIN
    content = content.replace(
      /"http:\/\/localhost:5000"(?!\/api)/g,
      () => {
        replacements++;
        return 'SERVER_ORIGIN';
      }
    );

    content = content.replace(
      /'http:\/\/localhost:5000'(?!\/api)/g,
      () => {
        replacements++;
        return 'SERVER_ORIGIN';
      }
    );

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed ${filePath} (${replacements} replacements)`);
      totalFixed += replacements;
      totalFiles++;
    } else {
      console.log(`⏭️  Skipped ${filePath} (already fixed or no localhost found)`);
    }

  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
  }
});

console.log(`\n🎉 Done! Fixed ${totalFixed} occurrences in ${totalFiles} files.`);
console.log('\n⚠️  Please review the changes and test your application!');
