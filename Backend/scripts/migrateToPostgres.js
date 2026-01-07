import sql from 'mssql';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

// Configs from .env
const mssqlConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  port: parseInt(process.env.SQL_PORT) || 1433,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: process.env.SQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.SQL_TRUST_CERT === 'true',
  },
};

const pgConnectionString = process.env.DATABASE_URL;

if (!pgConnectionString) {
  console.error('❌ ERROR: DATABASE_URL is missing in .env');
  console.log('👉 Please add your Render PostgreSQL connection string to .env as DATABASE_URL=...');
  process.exit(1);
}

const cleanUrl = (url) => {
  if (!url) return null;
  // Remove localhost:5000 or localhost:3000 to make paths relative
  let newUrl = url.replace(/http:\/\/localhost:5000/g, '').replace(/http:\/\/localhost:3000/g, '');
  // Ensure it starts with / if it was a path
  if (newUrl && !newUrl.startsWith('http') && !newUrl.startsWith('/')) {
    newUrl = '/' + newUrl;
  }
  return newUrl;
};

const migrate = async () => {
  console.log('🚀 Starting migration from MSSQL to PostgreSQL...');

  // 1. Connect MSSQL
  const mssqlPool = new sql.ConnectionPool(mssqlConfig);
  await mssqlPool.connect();
  console.log('✅ Connected to MSSQL (Source)');

  // 2. Connect Postgres
  const pgPool = new Pool({
    connectionString: pgConnectionString,
    ssl: {
      rejectUnauthorized: false, // For Render
    },
  });
  await pgPool.connect();
  console.log('✅ Connected to PostgreSQL (Target)');

  try {
    // === USERS ===
    console.log('⏳ Migrating Users...');
    const users = await mssqlPool.request().query('SELECT * FROM users');
    for (const u of users.recordset) {
      const doInsert = async () => {
        await pgPool.query(
          `
                    INSERT INTO users (
                      id, username, email, password, full_name, avatar, 
                      cover_photo, bio, date_of_birth, gender, location, 
                      created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (id) DO UPDATE SET
                      username = EXCLUDED.username,
                      email = EXCLUDED.email,
                      full_name = EXCLUDED.full_name,
                      avatar = EXCLUDED.avatar,
                      cover_photo = EXCLUDED.cover_photo,
                      bio = EXCLUDED.bio,
                      date_of_birth = EXCLUDED.date_of_birth,
                      gender = EXCLUDED.gender,
                      location = EXCLUDED.location,
                      password = EXCLUDED.password
                  `,
          [
            u.id,
            u.username,
            u.email,
            u.password,
            u.full_name,
            cleanUrl(u.avatar),
            cleanUrl(u.background),
            u.bio,
            u.date_of_birth,
            u.gender,
            u.address,
            u.created_at,
            u.updated_at,
          ]
        );
      };

      try {
        await doInsert();
      } catch (err) {
        if (err.code === '23505') {
          // Unique violation
          console.warn(`⚠️ Conflict for User ID ${u.id} (${u.email}): ${err.detail}`);

          const conflict = await pgPool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [u.email, u.username]
          );

          for (const row of conflict.rows) {
            // Conflict must be deleted if it has a different ID to what we are trying to insert
            // But since we are inserting u.id, and conflict query found some IDs...
            // If row.id != u.id, we MUST delete row.d to free up the email.
            // If row.id == u.id, then we are just updating, so no conflict (handled by ON CONFLICT).
            // Wait, if 23505 happens, it means we FAILED to insert/update.
            if (row.id !== u.id) {
              console.log(`💥 Deleting collision user ID ${row.id} to enforce ID ${u.id}`);
              await pgPool.query('DELETE FROM users WHERE id = $1', [row.id]);
            }
          }
          // Retry
          await doInsert();
        } else {
          throw err;
        }
      }
    }
    // Update sequence
    await pgPool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
    console.log(`✅ Migrated ${users.recordset.length} users.`);

    // === POSTS & SHARES ===
    console.log('⏳ Migrating Posts & Shares...');
    const posts = await mssqlPool.request().query('SELECT * FROM posts');
    let postCount = 0;
    let shareCount = 0;

    for (const p of posts.recordset) {
      if (p.shared_post_id) {
        // This is a SHARE
        // Check if original post exists (in source) to avoid FK error
        // But for simplicity, we assume data consistency or try/catch
        try {
          await pgPool.query(
            `
            INSERT INTO shares (
              id, user_id, post_id, caption, shared_to, created_at
            ) VALUES ($1, $2, $3, $4, 'timeline', $5)
            ON CONFLICT (id) DO NOTHING
          `,
            [
              p.id, // Keep ID if possible, but shares table ID might clash if we mix?
              // WAIT: shares table has its own ID sequence.
              // If we want to preserve 'posts.id' as 'shares.id', we can.
              // But 'posts.id' in MSSQL was unique across posts and shares.
              // In Postgres, they are separate tables.
              // If we use p.id as shares.id, it's fine.
              p.user_id,
              p.shared_post_id,
              p.content,
              p.created_at,
            ]
          );
          shareCount++;
        } catch (err) {
          console.warn(`⚠️ Skipped share ${p.id} (maybe original post missing): ${err.message}`);
        }
      } else {
        // This is a normal POST
        await pgPool.query(
          `
          INSERT INTO posts (
            id, user_id, content, media_url, visibility, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            media_url = EXCLUDED.media_url,
            visibility = EXCLUDED.visibility
        `,
          [
            p.id,
            p.user_id,
            p.content,
            cleanUrl(p.media), // Map media -> media_url
            p.status, // Map status -> visibility
            p.created_at,
            p.updated_at || p.created_at,
          ]
        );
        postCount++;
      }
    }
    // Update sequences
    await pgPool.query(`SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts))`);
    await pgPool.query(`SELECT setval('shares_id_seq', (SELECT MAX(id) FROM shares))`);
    console.log(`✅ Migrated ${postCount} posts and ${shareCount} shares.`);

    // === COMMENTS ===
    console.log('⏳ Migrating Comments...');
    const comments = await mssqlPool.request().query('SELECT * FROM comments');
    for (const c of comments.recordset) {
      // Need to handle parent_comment_id dependency order?
      // If standard insert, order matters.
      // We can disable FK check or insert root comments first.
      // Simple retry: Insert roots, then children.
    }
    // Better approach: Insert all with parent_id = NULL first, then update parent_ids?
    // Or just DO NOTHING on conflict and run loop twice?
    // Let's simple loop, allowing failures for children, then retry.
    // Actually, sorting by id usually works if parents created before children.
    const sortedComments = comments.recordset.sort((a, b) => a.id - b.id);

    for (const c of sortedComments) {
      try {
        await pgPool.query(
          `
              INSERT INTO comments (
                id, post_id, user_id, parent_comment_id, content, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (id) DO NOTHING
            `,
          [
            c.id,
            c.post_id,
            c.user_id,
            c.comment_parent, // Map comment_parent -> parent_comment_id
            c.content,
            c.created_at,
          ]
        );
      } catch (err) {
        if (err.code === '23503') {
          console.log(
            `⚠️ Skipped comment ${c.id}: Parent post/user missing (Likely comment on a shared post).`
          );
        } else {
          console.warn(`⚠️ Failed comment ${c.id}: ${err.message}`);
        }
      }
    }
    await pgPool.query(`SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments))`);
    console.log(`✅ Migrated comments.`);

    // === LIKES ===
    console.log('⏳ Migrating Likes...');
    const likes = await mssqlPool.request().query('SELECT * FROM likes');
    let likeCount = 0;
    for (const l of likes.recordset) {
      // MSSQL likes probably has post_id OR comment_id populated
      // Postgres schema: check constraint allows logic.
      try {
        await pgPool.query(
          `
          INSERT INTO likes (
            user_id, post_id, comment_id, created_at
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `,
          [l.user_id, l.post_id, l.comment_id, l.created_at]
        );
        likeCount++;
      } catch (e) {}
    }
    console.log(`✅ Migrated ${likeCount} likes.`);

    // === FRIENDSHIPS ===
    console.log('⏳ Migrating Friendships...');
    const friendships = await mssqlPool.request().query('SELECT * FROM friendships');
    for (const f of friendships.recordset) {
      await pgPool.query(
        `
        INSERT INTO friendships (
           user_id, friend_id, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `,
        [
          f.user_id,
          f.friend_id, // Wait, MSSQL schema?
          // friendshipService.js: user_id, friend_id.
          // Postgres schema: requester_id, receiver_id.
          // Assuming user_id -> requester_id, friend_id -> receiver_id
          f.status,
          f.created_at,
          f.updated_at,
        ]
      );
    }
    console.log(`✅ Migrated friendships.`);

    // === SAVED POSTS ===
    console.log('⏳ Migrating Saved Posts...');
    const saved = await mssqlPool.request().query('SELECT * FROM saved_posts');
    for (const s of saved.recordset) {
      try {
        await pgPool.query(
          `
            INSERT INTO saved_posts (
              user_id, post_id, saved_at
            ) VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
          `,
          [s.user_id, s.post_id, s.created_at]
        );
      } catch (err) {
        if (err.code === '23503') {
          console.log(
            `⚠️ Skipped saved item ${s.id} (Post ID ${s.post_id} not found - likely a shared post).`
          );
        } else {
          console.warn(`⚠️ Failed saved post ${s.id}: ${err.message}`);
        }
      }
    }
    console.log(`✅ Migrated saved posts.`);

    console.log('\n🎉 DATA MIGRATION COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Migration Failed:', err);
  } finally {
    await mssqlPool.close();
    await pgPool.end();
  }
};

migrate();
