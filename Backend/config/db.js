import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  port: 1433,
  database: process.env.SQL_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    useUTC: false,
  },

  // pool: {
  //   max: 10,
  //   min: 0,
  //   idleTimeoutMillis: 30000,
  // },
  // connectionTimeout: 15000,
  // requestTimeout: 30000,

  // options: {
  //   encrypt: process.env.SQL_ENCRYPT,
  //   trustServerCertificate: process.env.SQL_TRUST_CERT,
  //   useUTC: false,
  // },

};

export const pool = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to SQL Server");
    console.log(">>> Using Database:", pool.config.database);
    return pool;
  })
  .catch((err) => console.error("SQL Server connection failed:", err));
