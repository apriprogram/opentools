import "../config/env.js";
import mysql from "mysql2/promise";

// Koneksi MySQL. Nilai diambil dari environment (.env di folder backend).
// Default cocok untuk XAMPP lokal: root tanpa password, database db_opentools.
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASS || "",
  database: process.env.MYSQL_DB || "db_opentools",
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "Z",
  dateStrings: false
});

export const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};
