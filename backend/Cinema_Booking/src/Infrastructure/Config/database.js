import mysql from "mysql2/promise";

import { env } from "./env.js";

const pool = mysql.createPool({
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT || 3306,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10, // tối đa 10 connection cùng lúc
  queueLimit: 0,
});

// Test kết nối khi khởi động
const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("MySQL connected");
    conn.release();
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  }
};

export { pool, connectDB };
