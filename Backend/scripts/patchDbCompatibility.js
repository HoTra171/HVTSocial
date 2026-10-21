import { pool } from '../config/db.js';

async function main() {
  try {
    const db = await pool;
    console.log('Patching schema compatibility...');

    // 1. Add media_type to posts if not exists
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'posts' AND COLUMN_NAME = 'media_type'
      )
      BEGIN
        ALTER TABLE posts ADD media_type NVARCHAR(50) DEFAULT 'image';
        PRINT 'Added media_type to posts';
      END
    `);

    // 2. Add content to stories if not exists (synced with caption)
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'stories' AND COLUMN_NAME = 'content'
      )
      BEGIN
        ALTER TABLE stories ADD content NVARCHAR(MAX);
        PRINT 'Added content to stories';
      END
    `);
    await db.request().query(`
      UPDATE stories SET content = caption WHERE content IS NULL AND caption IS NOT NULL;
    `);

    // 3. Ensure shares table exists if referenced
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'shares'
      )
      BEGIN
        CREATE TABLE shares (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          post_id INT NOT NULL,
          created_at DATETIME DEFAULT GETDATE()
        );
        PRINT 'Created shares table';
      END
    `);

    // 4. Update any existing posts with media_url to have media_type = 'image'
    await db.request().query(`
      UPDATE posts SET media_type = 'image' WHERE media_type IS NULL;
    `);

    // 5. Add location and cover_photo to users if not exists
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'location'
      )
      BEGIN
        ALTER TABLE users ADD location NVARCHAR(255);
        PRINT 'Added location column to users';
      END
    `);
    await db.request().query(`
      UPDATE users SET location = address WHERE location IS NULL AND address IS NOT NULL;
    `);

    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'cover_photo'
      )
      BEGIN
        ALTER TABLE users ADD cover_photo NVARCHAR(500);
        PRINT 'Added cover_photo column to users';
      END
    `);
    await db.request().query(`
      UPDATE users SET cover_photo = background WHERE cover_photo IS NULL AND background IS NOT NULL;
    `);

    // 6. Add saved_at to saved_posts if not exists
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'saved_posts' AND COLUMN_NAME = 'saved_at'
      )
      BEGIN
        ALTER TABLE saved_posts ADD saved_at DATETIME;
        PRINT 'Added saved_at column to saved_posts';
      END
    `);
    await db.request().query(`
      UPDATE saved_posts SET saved_at = created_at WHERE saved_at IS NULL AND created_at IS NOT NULL;
    `);

    // 7. Add parent_comment_id to comments if not exists
    await db.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'comments' AND COLUMN_NAME = 'parent_comment_id'
      )
      BEGIN
        ALTER TABLE comments ADD parent_comment_id INT;
        PRINT 'Added parent_comment_id column to comments';
      END
    `);
    await db.request().query(`
      UPDATE comments SET parent_comment_id = comment_parent WHERE parent_comment_id IS NULL AND comment_parent IS NOT NULL;
      UPDATE comments SET comment_parent = parent_comment_id WHERE comment_parent IS NULL AND parent_comment_id IS NOT NULL;
    `);

    // 8. Add reply columns to messages if not exists
    await db.request().query(`
      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'reply_to_id')
        ALTER TABLE messages ADD reply_to_id INT;

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'reply_content')
        ALTER TABLE messages ADD reply_content NVARCHAR(MAX);

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'reply_type')
        ALTER TABLE messages ADD reply_type VARCHAR(20);

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'reply_sender')
        ALTER TABLE messages ADD reply_sender NVARCHAR(100);
    `);

    // 9. Add privacy settings columns to users if not exists
    await db.request().query(`
      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_visibility')
        ALTER TABLE users ADD profile_visibility NVARCHAR(20) DEFAULT 'public';

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'post_visibility')
        ALTER TABLE users ADD post_visibility NVARCHAR(20) DEFAULT 'public';

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'allow_friend_requests')
        ALTER TABLE users ADD allow_friend_requests BIT DEFAULT 1;

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'show_online_status')
        ALTER TABLE users ADD show_online_status BIT DEFAULT 1;
    `);

    // 10. Disable triggers that block OUTPUT INSERTED.* without INTO clause
    const tables = ['friendships', 'users', 'posts', 'comments', 'likes', 'messages', 'notifications', 'stories', 'roles'];
    for (const table of tables) {
      try {
        await db.request().query(`
          IF EXISTS (SELECT 1 FROM sys.tables WHERE name = '${table}')
          BEGIN
            DISABLE TRIGGER ALL ON [dbo].[${table}];
          END
        `);
      } catch (e) {
        console.warn(`Could not disable triggers on ${table}:`, e.message);
      }
    }

    console.log('✅ Schema patched successfully and triggers handled!');
    return true;
  } catch (err) {
    console.error('Error patching schema:', err);
    throw err;
  }
}

export const patchSchemaCompatibility = main;

if (process.argv[1]?.includes('patchDbCompatibility')) {
  main().then(() => process.exit(0)).catch(() => process.exit(1));
}
