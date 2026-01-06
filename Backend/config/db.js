import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

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
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

// Tạo pool và kết nối
const poolConnection = new sql.ConnectionPool(config);

poolConnection.connect()
  .then(() => {
    console.log("✅ Connected to SQL Server");
    console.log(">>> Using Database:", poolConnection.config.database);
  })
  .catch((err) => {
    console.error("❌ SQL Server connection FAILED:", err.message);
    console.error("Please check:");
    console.error("  - SQL Server is running (check services: SQL Server (MSSQLSERVER))");
    console.error("  - Database exists:", config.database);
    console.error("  - Credentials - User:", config.user);
    console.error("  - Server:", config.server);
    console.error("  - Port:", config.port);
    process.exit(1);
  });

// Export pool connection (không phải Promise)
export const pool = poolConnection;
