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

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');

  let pool;
  try {
    // Connect to database
    pool = await sql.connect(config);
    console.log(`✅ Connected to SQL Server: ${config.server}`);
    console.log(`📊 Database: ${config.database}\n`);

    // Get all seed files
    const seedsDir = path.join(__dirname, 'seeds');
    if (!fs.existsSync(seedsDir)) {
      console.log('⚠️  No seeds directory found');
      return;
    }

    const files = fs.readdirSync(seedsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No seed files found');
      return;
    }

    console.log(`📁 Found ${files.length} seed file(s)\n`);

    // Confirm before seeding
    console.log('⚠️  WARNING: This will insert sample data into your database!');

    // Run each seed file
    for (const file of files) {
      console.log(`▶️  Running ${file}...`);

      const filePath = path.join(seedsDir, file);
      const seedSQL = fs.readFileSync(filePath, 'utf-8');

      try {
        // Split by GO statements and execute each batch
        const batches = seedSQL.split(/^\s*GO\s*$/gim).filter(b => b.trim());

        for (const batch of batches) {
          if (batch.trim()) {
            await pool.request().query(batch);
          }
        }

        console.log(`   ✅ Success\n`);
      } catch (error) {
        console.error(`   ⚠️  Warning: ${error.message}\n`);
        // Continue with other seeds even if one fails
        continue;
      }
    }

    console.log('🎉 All seeds completed!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('\nPlease check:');
    console.error('  - SQL Server is running');
    console.error('  - Database credentials are correct');
    console.error('  - Migrations have been run');
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Run seeds
runSeeds();
