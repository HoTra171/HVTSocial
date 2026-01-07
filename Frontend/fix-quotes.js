import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToFix = [
  'src/page/CreatePost.jsx',
  'src/page/Messages.jsx',
  'src/page/ForgotPassword.jsx',
  'src/page/ChangePassword.jsx'
];

let totalFixed = 0;

filesToFix.forEach(relativePath => {
  const fullPath = path.join(__dirname, relativePath);

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const original = content;

    // Fix pattern: `${API_URL}/path" -> `${API_URL}/path`
    content = content.replace(/(`[^`]*\$\{API_URL\}[^`"']*)(["'])/g, '$1`');

    // Fix pattern: "${API_URL}/path` -> `${API_URL}/path`
    content = content.replace(/(["'])([^"']*\$\{API_URL\}[^`]*)`/g, '`$2`');

    if (content !== original) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed ${relativePath}`);
      totalFixed++;
    } else {
      console.log(`⏭️  No changes needed for ${relativePath}`);
    }
  } catch (err) {
    console.error(`❌ Error processing ${relativePath}:`, err.message);
  }
});

console.log(`\n🎉 Fixed ${totalFixed} files`);
