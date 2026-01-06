import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  port: parseInt(process.env.SQL_PORT) || 1433,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: process.env.SQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.SQL_TRUST_CERT === 'true',
    useUTC: false,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  let pool;
  try {
    // Connect to database
    pool = await sql.connect(config);
    console.log(`✅ Connected to SQL Server: ${config.server}`);
    console.log(`📊 Database: ${config.database}\n`);

    // Create migrations table if not exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='migrations' AND xtype='U')
      CREATE TABLE migrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        filename NVARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Migrations table ready\n');

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    console.log(`📁 Found ${files.length} migration file(s)\n`);

    // Run each migration
    for (const file of files) {
      // Check if already executed
      const result = await pool.request()
        .input('filename', sql.NVarChar, file)
        .query('SELECT * FROM migrations WHERE filename = @filename');

      if (result.recordset.length > 0) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`▶️  Running ${file}...`);

      // Read and execute migration
      const filePath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(filePath, 'utf-8');

      try {
        // Split by GO statements and execute each batch
        const batches = migrationSQL.split(/^\s*GO\s*$/gim).filter(b => b.trim());

        for (const batch of batches) {
          if (batch.trim()) {
            await pool.request().query(batch);
          }
        }

        // Record migration
        await pool.request()
          .input('filename', sql.NVarChar, file)
          .query('INSERT INTO migrations (filename) VALUES (@filename)');

        console.log(`   ✅ Success\n`);
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}\n`);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nPlease check:');
    console.error('  - SQL Server is running');
    console.error('  - Database credentials are correct');
    console.error('  - Database exists');
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run migrations
runMigrations();
