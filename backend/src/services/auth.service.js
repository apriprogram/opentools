import crypto from "crypto";
import { query } from "../db/mysql.js";
import { hashPassword, verifyPassword } from "./admin-auth.service.js";

// Akun pengguna dan sesi. Sesi disimpan di database sebagai hash SHA-256 dari token,
// jadi token mentah hanya ada di browser pengguna.
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const publicUser = (row) => ({
  id: row.id,
  name: row.name || "",
  email: row.email || "",
  username: row.username || "",
  whatsapp: row.wa_number || "",
  role: row.role
});

export const createUser = async ({ name, email, password, whatsapp }) => {
  const cleanEmail = email.toLowerCase();
  const existing = await query("SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1", [cleanEmail]);
  if (existing.length) throw httpError(409, "Email sudah terdaftar. Silakan masuk.");
  const result = await query(
    "INSERT INTO users (name, email, password_hash, wa_number, role, created_at) VALUES (?, ?, ?, ?, 'user', ?)",
    [name, cleanEmail, hashPassword(password), whatsapp, new Date()]
  );
  return publicUser({ id: result.insertId, name, email: cleanEmail, username: null, wa_number: whatsapp, role: "user" });
};

// Simpan atau ubah nomor WhatsApp akun.
export const updateUserWhatsapp = async (userId, whatsapp) => {
  await query("UPDATE users SET wa_number = ? WHERE id = ?", [whatsapp, userId]);
  const rows = await query("SELECT id, name, email, username, wa_number, role FROM users WHERE id = ? LIMIT 1", [userId]);
  return publicUser(rows[0]);
};

// Masuk memakai email (untuk pengguna) atau username (untuk super admin).
export const checkLogin = async (login, password) => {
  const rows = await query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) LIMIT 1",
    [login, login]
  );
  if (!rows.length) return null;
  return verifyPassword(password, rows[0].password_hash) ? rows[0] : null;
};

export const createSession = async (userId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MS);
  await query(
    "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    [hashToken(token), userId, now, expiresAt]
  );
  return { token, expiresAt };
};

export const getSessionUser = async (token) => {
  if (!token) return null;
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.username, u.wa_number, u.role
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`,
    [hashToken(token), new Date()]
  );
  return rows.length ? publicUser(rows[0]) : null;
};

export const deleteSession = async (token) => {
  if (!token) return;
  await query("DELETE FROM sessions WHERE token_hash = ?", [hashToken(token)]);
};

// Super admin dibuat dari env (ADMIN_USERNAME dan ADMIN_PASSWORD_HASH) setiap server start.
// Env adalah sumber kebenaran: password di database selalu mengikuti env.
export const ensureSuperAdmin = async () => {
  const username = process.env.ADMIN_USERNAME || "";
  const hash = process.env.ADMIN_PASSWORD_HASH || "";
  if (!username || !hash) return;
  const rows = await query("SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1", [username]);
  if (rows.length) {
    await query("UPDATE users SET password_hash = ?, role = 'superadmin' WHERE id = ?", [hash, rows[0].id]);
  } else {
    await query(
      "INSERT INTO users (name, username, password_hash, role, created_at) VALUES (?, ?, ?, 'superadmin', ?)",
      ["Super Admin", username, hash, new Date()]
    );
  }
};
