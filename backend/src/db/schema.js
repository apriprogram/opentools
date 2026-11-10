import { pool } from "./mysql.js";

// Tabel dibuat otomatis saat server start (CREATE TABLE IF NOT EXISTS). Aman dijalankan berulang.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS twibbon_users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL,
    created_at DATETIME NOT NULL,
    UNIQUE KEY uq_twibbon_users_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS twibbon_campaigns (
    id VARCHAR(36) PRIMARY KEY,
    slug VARCHAR(190) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    frame_base64 LONGTEXT NOT NULL,
    creator_id VARCHAR(36) NOT NULL,
    views INT UNSIGNED NOT NULL DEFAULT 0,
    usage_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    UNIQUE KEY uq_twibbon_campaigns_slug (slug),
    KEY idx_twibbon_campaigns_creator (creator_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS qr_orders (
    code VARCHAR(20) PRIMARY KEY,
    plan ENUM('monthly','yearly') NOT NULL,
    price INT UNSIGNED NOT NULL,
    unique_code INT UNSIGNED NOT NULL,
    amount INT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL,
    status ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
    license_key VARCHAR(64) NULL,
    created_at DATETIME NOT NULL,
    paid_at DATETIME NULL,
    KEY idx_qr_orders_status (status),
    KEY idx_qr_orders_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS qr_licenses (
    license_key VARCHAR(64) PRIMARY KEY,
    plan ENUM('monthly','yearly') NOT NULL,
    email VARCHAR(190) NOT NULL,
    order_code VARCHAR(20) NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked TINYINT(1) NOT NULL DEFAULT 0,
    KEY idx_qr_licenses_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NULL,
    email VARCHAR(190) NULL,
    username VARCHAR(60) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user','superadmin') NOT NULL DEFAULT 'user',
    created_at DATETIME NOT NULL,
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_username (username)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash CHAR(64) PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    KEY idx_sessions_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS user_qr (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    link VARCHAR(2048) NOT NULL,
    fg VARCHAR(9) NOT NULL,
    bg VARCHAR(9) NOT NULL,
    logo TINYINT(1) NOT NULL DEFAULT 1,
    plan_expires_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    KEY idx_user_qr_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

// Kolom bukti pembayaran ditambahkan ke tabel qr_orders yang sudah ada (ALTER hanya jika belum ada).
const QR_ORDER_COLUMNS = [
  ["wa_number", "VARCHAR(20) NULL"],
  ["nota_number", "VARCHAR(20) NULL"],
  ["proof_data", "MEDIUMBLOB NULL"],
  ["proof_hash", "CHAR(64) NULL"],
  ["proof_uploaded_at", "DATETIME NULL"],
  ["proof_attempts", "TINYINT UNSIGNED NOT NULL DEFAULT 0"],
  ["verify_status", "VARCHAR(20) NOT NULL DEFAULT 'none'"],
  ["verify_note", "VARCHAR(500) NULL"],
  ["verify_amount", "INT UNSIGNED NULL"],
  ["verify_detail", "TEXT NULL"],
  // Desain QR (JSON: link, fg, bg, logo) dan QR yang dituju (perpanjang). Satu pesanan untuk satu QR.
  ["qr_payload", "TEXT NULL"],
  ["user_qr_id", "VARCHAR(36) NULL"]
];

async function ensureColumn(table, column, definition) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (Number(rows[0].n) === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

export async function ensureSchema() {
  for (const sql of STATEMENTS) {
    await pool.query(sql);
  }
  for (const [column, definition] of QR_ORDER_COLUMNS) {
    await ensureColumn("qr_orders", column, definition);
  }
  // Nomor WhatsApp pemilik akun (dipakai untuk pesanan dari dashboard).
  await ensureColumn("users", "wa_number", "VARCHAR(20) NULL");
  // Lisensi terikat pada satu QR (per QR code).
  await ensureColumn("qr_licenses", "user_qr_id", "VARCHAR(36) NULL");
}
