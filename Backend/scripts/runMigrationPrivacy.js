import dotenv from 'dotenv';
dotenv.config();

const runMigration = async () => {
    try {
        // 1. Allow overriding DATABASE_URL from command line args
        const customDbUrl = process.argv[2];
        if (customDbUrl && customDbUrl.startsWith('postgres')) {
            console.log('🔌 Using custom DATABASE_URL from arguments');
            process.env.DATABASE_URL = customDbUrl;
        } else if (customDbUrl) {
            console.log('⚠️  Argument provided does not look like a Postgres URL. Using .env value.');
        }

        // 2. Dynamic import to ensure process.env is set BEFORE db.js runs
        const { pool } = await import('../config/db.js');

        console.log('🔄 Starting migration to add privacy settings columns...');
        console.log(`🎯 Target DB Host: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1].split(':')[0] : 'Unknown (using generic connection)'}`);

        const queries = [
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'public';`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS post_visibility VARCHAR(20) DEFAULT 'public';`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_friend_requests BOOLEAN DEFAULT TRUE;`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT TRUE;`
        ];

        const constraintQueries = [
            `
       DO $$
       BEGIN
           IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_profile_visibility_check') THEN
               ALTER TABLE users ADD CONSTRAINT users_profile_visibility_check CHECK (profile_visibility IN ('public', 'friends', 'private'));
           END IF;
       END
       $$;
       `,
            `
       DO $$
       BEGIN
           IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_post_visibility_check') THEN
               ALTER TABLE users ADD CONSTRAINT users_post_visibility_check CHECK (post_visibility IN ('public', 'friends'));
           END IF;
       END
       $$;
       `
        ];

        // Execute Column Additions
        for (const q of queries) {
            try {
                console.log(`Executing: ${q}`);
                await pool.query(q);
                console.log('✅ Success');
            } catch (err) {
                console.error('❌ Error executing query:', err.message);
            }
        }

        // Execute Constraints
        for (const q of constraintQueries) {
            try {
                console.log(`Checking/Adding constraint...`);
                await pool.query(q);
                console.log('✅ Success');
            } catch (err) {
                console.log(`⚠️ Note on constraint: ${err.message}`);
            }
        }

        console.log('🏁 Migration finished.');
        process.exit(0);

    } catch (error) {
        console.error('🔥 Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
