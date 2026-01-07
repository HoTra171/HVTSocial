import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
};

async function applyIndexes() {
  try {
    const pool = await sql.connect(config);
    console.log('Connected to MSSQL');

    const migrationPath = path.join(
      __dirname,
      '..',
      'database',
      'migrations',
      '006_optimize_indexes.sql'
    );
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    // Split by GO batch separator
    const batches = sqlContent.split(/^\s*GO\s*$/gim).filter((b) => b.trim());

    for (const batch of batches) {
      if (batch.trim()) {
        await pool.request().query(batch);
      }
    }

    console.log('Optimized Indexes Applied Successfully.');
    await pool.close();
  } catch (err) {
    console.error('Index Application Failed:', err);
  }
}

applyIndexes();
