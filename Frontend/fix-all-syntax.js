/**
 * Fix ALL template literal syntax errors
 * Replaces mismatched quotes with backticks in template literals
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing all template literal syntax errors...\n');

// Recursively get all files
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Find all .js and .jsx files in src/
const srcPath = path.join(__dirname, 'src');
const files = getAllFiles(srcPath);

let totalFixed = 0;
let totalFiles = 0;

files.forEach(file => {
  const fullPath = path.join(__dirname, file);

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Fix pattern: `${...}... " or ' instead of `
    // Example: `${API_URL}/posts" -> `${API_URL}/posts`
    let changes = 0;

    // Pattern 1: `...${...}...["'] -> `...${...}...`
    content = content.replace(/(`[^`]*\$\{[^}]+\}[^`"']*)(["'])/g, (match, p1, quote) => {
      changes++;
      return p1 + '`';
    });

    // Pattern 2: ["']...${...}...` -> `...${...}...`
    content = content.replace(/(["'])([^"']*\$\{[^}]+\}[^`]*)`/g, (match, quote, p2) => {
      changes++;
      return '`' + p2 + '`';
    });

    // Remove duplicate SERVER_ORIGIN declaration if it conflicts with import
    if (content.includes("from '../constants/api'") ||
        content.includes('from "../constants/api"') ||
        content.includes("from '../../constants/api'") ||
        content.includes('from "../../constants/api"')) {

      const hasServerOriginImport = content.match(/import\s*{[^}]*SERVER_ORIGIN[^}]*}\s*from/);

      if (hasServerOriginImport) {
        // Remove local SERVER_ORIGIN declaration
        const removed = content.replace(/^const\s+SERVER_ORIGIN\s*=\s*API_URL\.replace\([^;]+;?\s*$/gm, '');
        if (removed !== content) {
          content = removed;
          changes++;
        }
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed ${file} (${changes} fixes)`);
      totalFixed += changes;
      totalFiles++;
    }

  } catch (err) {
    console.error(`❌ Error processing ${file}:`, err.message);
  }
});

console.log(`\n🎉 Done! Fixed ${totalFixed} issues in ${totalFiles} files.`);
