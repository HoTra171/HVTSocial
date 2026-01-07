/**
 * Remove duplicate API_URL declarations that override imports
 * Usage: node remove-duplicate-api-url.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that have duplicate API_URL
const filesToFix = [
  'src/components/CommentItem.jsx',
  'src/components/FriendButton.jsx',
  'src/components/PostCard.jsx',
  'src/page/Discover.jsx',
  'src/page/Profile.jsx',
  'src/constants/api.js' // Check this one too
];

console.log('🔧 Removing duplicate API_URL declarations...\n');

let totalFixed = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Check if file imports API_URL from constants/api
    const hasApiImport = content.includes("from '../constants/api'") ||
                        content.includes('from "../constants/api"') ||
                        content.includes("from '../../constants/api'") ||
                        content.includes('from "../../constants/api"') ||
                        content.includes("from './api'") ||
                        content.includes('from "./api"');

    if (hasApiImport || filePath.includes('constants/api')) {
      // Remove lines that declare API_URL with localhost
      const lines = content.split('\n');
      const filteredLines = lines.filter(line => {
        // Remove lines like: const API_URL = "http://localhost:5000/api";
        // Remove lines like: const API_BASE_URL = "http://localhost:5000/api";
        const isLocalHostDeclaration =
          /^\s*const\s+(API_URL|API_BASE_URL)\s*=\s*['""`]http:\/\/localhost:5000/.test(line);

        if (isLocalHostDeclaration) {
          console.log(`  Removing line: ${line.trim()}`);
          totalFixed++;
          return false;
        }
        return true;
      });

      content = filteredLines.join('\n');
    }

    // Also remove const api = axios.create({ baseURL: API_URL }); if API_URL is imported
    // This might be problematic as API_URL would be undefined at that point
    if (hasApiImport && content.includes('const api = axios.create({ baseURL: API_URL })')) {
      content = content.replace(
        /const api = axios\.create\(\{ baseURL: API_URL \}\);/g,
        'const api = axios.create({ baseURL: `${API_URL}` });'
      );
    }

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}\n`);
    } else {
      console.log(`⏭️  No changes needed for ${filePath}\n`);
    }

  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
  }
});

console.log(`\n🎉 Done! Removed ${totalFixed} duplicate declarations.`);
