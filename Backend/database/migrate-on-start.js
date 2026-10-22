#!/usr/bin/env node

/**
 * Pre-start script: Fix PostgreSQL schema before starting server
 * Runs automatically on Render deployment
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sanitizeConnectionString = (rawUrl) => {
  if (!rawUrl) return '';
  let url = rawUrl.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  url = url.replace(/([?&])channel_binding=[^&]+(&|$)/g, (match, p1, p2) => {
    return p2 === '&' ? p1 : '';
  }).replace(/\?$/, '');
  return url;
};

const rawUrl = (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '');
const DATABASE_URL = sanitizeConnectionString(rawUrl);

if (!DATABASE_URL || !DATABASE_URL.includes('postgres')) {
  console.log('🔧 Local MSSQL detected: verifying schema compatibility...');
  try {
    const { patchSchemaCompatibility } = await import('../scripts/patchDbCompatibility.js');
    if (typeof patchSchemaCompatibility === 'function') {
      await patchSchemaCompatibility();
    }
  } catch (err) {
    console.warn('⚠️  MSSQL schema check note:', err.message);
  }
  process.exit(0);
}

console.log('🔧 Running schema migration...');

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 15000,
});

async function migrate() {
  let connected = false;
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await client.connect();
        connected = true;
        break;
      } catch (connErr) {
        console.warn(`⚠️ Migration DB connection attempt ${attempt}/3 failed:`, connErr.message);
        if (attempt < 3) {
          console.log('⏳ Retrying DB connection in 2s...');
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    if (!connected) {
      console.warn('⚠️ Could not connect to PostgreSQL for schema migration (database may be sleeping).');
      console.log('⚠️ Continuing with server start...');
      return;
    }

    // 1. Kiểm tra nếu Database mới tinh (chưa có bảng users) thì tự động chạy toàn bộ postgres-migration.sql
    const tableCheck = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    if (tableCheck.rowCount === 0) {
      console.log('📦 Phát hiện Database mới! Đang tự động khởi tạo toàn bộ bảng từ postgres-migration.sql...');
      const initSqlPath = path.join(__dirname, 'postgres-migration.sql');
      if (fs.existsSync(initSqlPath)) {
        const initSql = fs.readFileSync(initSqlPath, 'utf8');
        await client.query(initSql);
        console.log('✅ Đã khởi tạo thành công toàn bộ bảng cơ sở dữ liệu!');
      }
    }

    // 2. Chạy tiếp các bước fix schema bổ sung (nếu database đã có từ trước)
    const statements = [
      // 1. Add privacy to stories
      `DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stories' AND column_name = 'privacy'
    ) THEN
        ALTER TABLE stories 
        ADD COLUMN privacy VARCHAR(20) DEFAULT 'public';
        RAISE NOTICE 'Added privacy to stories';
    END IF;
END $$;`,

      // 2. Rename chat_participants to chat_users
      `DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_participants')
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_users')
    THEN
        ALTER TABLE chat_participants RENAME TO chat_users;
        ALTER INDEX IF EXISTS idx_chat_participants_chat RENAME TO idx_chat_users_chat;
        ALTER INDEX IF EXISTS idx_chat_participants_user RENAME TO idx_chat_users_user;
        RAISE NOTICE 'Renamed chat_participants to chat_users';
    END IF;
END $$;`,

      // 3. Rename is_group to is_group_chat
      `DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'is_group')
    THEN
        ALTER TABLE chats RENAME COLUMN is_group TO is_group_chat;
        ALTER INDEX IF EXISTS idx_chats_is_group RENAME TO idx_chats_is_group_chat;
        RAISE NOTICE 'Renamed is_group to is_group_chat';
    END IF;
END $$;`,

      // 4. Convert role to is_admin
      `DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_users' AND column_name = 'role')
    THEN
        ALTER TABLE chat_users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        UPDATE chat_users SET is_admin = (role = 'admin');
        ALTER TABLE chat_users DROP COLUMN role;
        RAISE NOTICE 'Converted role to is_admin';
    END IF;
END $$;`,

      // 5. Add message_type to messages
      `DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'message_type')
    THEN
        ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
        RAISE NOTICE 'Added message_type to messages';
    END IF;
END $$;`,

      // 6. Add status to messages
      `DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'status')
    THEN
        ALTER TABLE messages ADD COLUMN status VARCHAR(20) DEFAULT 'sent';
        RAISE NOTICE 'Added status to messages';
    END IF;
END $$;`,

      // 7. Add duration to messages
      `DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'duration')
    THEN
        ALTER TABLE messages ADD COLUMN duration INTEGER;
        RAISE NOTICE 'Added duration to messages';
    END IF;
END $$;`,

      // 8. Create story_viewers table
      `CREATE TABLE IF NOT EXISTS story_viewers (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_story_viewer UNIQUE (story_id, viewer_id)
);`,
      `CREATE INDEX IF NOT EXISTS idx_story_viewers_story ON story_viewers(story_id);`,
      `CREATE INDEX IF NOT EXISTS idx_story_viewers_viewer ON story_viewers(viewer_id);`,

      // 9. Rename friendships columns to match code (requester_id/receiver_id -> user_id/friend_id)
      `DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'friendships' AND column_name = 'requester_id')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'friendships' AND column_name = 'user_id')
    THEN
        ALTER TABLE friendships RENAME COLUMN requester_id TO user_id;
        ALTER TABLE friendships RENAME COLUMN receiver_id TO friend_id;
        ALTER INDEX IF EXISTS idx_friendships_requester RENAME TO idx_friendships_user;
        ALTER INDEX IF EXISTS idx_friendships_receiver RENAME TO idx_friendships_friend;
        RAISE NOTICE 'Renamed requester_id/receiver_id to user_id/friend_id';
    END IF;
END $$;`,
      // 10. Add reply columns to messages
      `DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'reply_to_id') THEN
        ALTER TABLE messages ADD COLUMN reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL;
        ALTER TABLE messages ADD COLUMN reply_content TEXT;
        ALTER TABLE messages ADD COLUMN reply_type VARCHAR(20);
        ALTER TABLE messages ADD COLUMN reply_sender VARCHAR(100);
        RAISE NOTICE 'Added reply columns to messages';
    END IF;
END $$;`,

      // 11. Create call_history table
      `CREATE TABLE IF NOT EXISTS call_history (
    id SERIAL PRIMARY KEY,
    caller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    call_type VARCHAR(10) NOT NULL CHECK (call_type IN ('video', 'voice')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'missed', 'rejected', 'failed', 'busy')),
    duration INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);`,
      `CREATE INDEX IF NOT EXISTS idx_call_history_caller ON call_history(caller_id);`,
      `CREATE INDEX IF NOT EXISTS idx_call_history_receiver ON call_history(receiver_id);`,
      `CREATE INDEX IF NOT EXISTS idx_call_history_created_at ON call_history(created_at DESC);`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS poll_data TEXT;`,
      // 12. Privacy settings & cross-database compatibility columns
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'public';`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS post_visibility VARCHAR(20) DEFAULT 'public';`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_friend_requests BOOLEAN DEFAULT TRUE;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT TRUE;`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS background TEXT;`,
      `UPDATE users SET background = cover_photo WHERE background IS NULL AND cover_photo IS NOT NULL;`,
      `UPDATE users SET cover_photo = background WHERE cover_photo IS NULL AND background IS NOT NULL;`,
      `UPDATE users SET profile_visibility = 'public' WHERE profile_visibility IS NULL;`,
      `UPDATE users SET post_visibility = 'public' WHERE post_visibility IS NULL;`,
      `UPDATE users SET allow_friend_requests = TRUE WHERE allow_friend_requests IS NULL;`,
      `UPDATE users SET show_online_status = TRUE WHERE show_online_status IS NULL;`,
      `ALTER TABLE posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'public';`,
      `UPDATE posts SET status = visibility WHERE status IS NULL AND visibility IS NOT NULL;`,
      `UPDATE posts SET visibility = status WHERE visibility IS NULL AND status IS NOT NULL;`,
      `ALTER TABLE saved_posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();`,
      `UPDATE saved_posts SET created_at = saved_at WHERE created_at IS NULL AND saved_at IS NOT NULL;`,
      `UPDATE saved_posts SET saved_at = created_at WHERE saved_at IS NULL AND created_at IS NOT NULL;`,
      `ALTER TABLE comments ADD COLUMN IF NOT EXISTS comment_parent INTEGER;`,
      `UPDATE comments SET comment_parent = parent_comment_id WHERE comment_parent IS NULL AND parent_comment_id IS NOT NULL;`,
      `UPDATE comments SET parent_comment_id = comment_parent WHERE parent_comment_id IS NULL AND comment_parent IS NOT NULL;`,
      `ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_url TEXT;`,
      `ALTER TABLE stories ALTER COLUMN background_color TYPE TEXT;`,
      `ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_url TEXT;`,
    ];

    for (const stmt of statements) {
      await client.query(stmt);
    }

    console.log('✅ Schema migration completed');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    // Don't fail deployment on migration errors
    console.log('⚠️  Continuing with server start...');
  } finally {
    if (connected) {
      try {
        await client.end();
      } catch {}
    }
  }
}

migrate()
  .then(() => {
    console.log('🚀 Starting server...\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(0); // Exit 0 to allow server to start anyway
  });
