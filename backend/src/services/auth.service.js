import crypto from "crypto";
import { pool, query } from "../db/mysql.js";
import { hashPassword, verifyPassword } from "./admin-auth.service.js";

// Akun pengguna dan sesi. Sesi disimpan di database sebagai hash SHA-256 dari token,
// jadi token mentah hanya ada di browser pengguna.
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
// Sesi "masuk sebagai pengguna" oleh super admin sengaja singkat.
const IMPERSONATE_MS = 2 * 60 * 60 * 1000;

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
  avatar: row.avatar || "",
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
  const rows = await query("SELECT id, name, email, username, wa_number, role, avatar FROM users WHERE id = ? LIMIT 1", [userId]);
  return publicUser(rows[0]);
};

const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const AVATAR_MAX = 200000;

// Ubah profil akun: nama, WhatsApp, username, dan foto. Nilai yang tidak dikirim (undefined) tidak diubah.
// - username: huruf kecil, angka, titik, garis bawah, atau strip. Wajib untuk super admin, boleh kosong untuk user.
// - email: hanya super admin yang bisa menggantinya. Email user dipakai untuk mencatat pesanan, jadi tetap.
// - avatar: gambar kecil (data URL), atau kosong untuk menghapus foto.
export const updateUserProfile = async (account, { name, whatsapp, username, email, avatar }) => {
  const userId = account.id;
  const isAdmin = account.role === "superadmin";
  const sets = ["name = ?", "wa_number = ?"];
  const params = [name, whatsapp || null];

  if (username !== undefined) {
    const clean = String(username || "").trim().toLowerCase();
    if (!clean && isAdmin) throw httpError(400, "Username super admin wajib diisi.");
    if (clean && !USERNAME_RE.test(clean)) {
      throw httpError(400, "Username 3 sampai 30 karakter: huruf kecil, angka, titik, garis bawah, atau strip.");
    }
    if (clean) {
      const taken = await query("SELECT id FROM users WHERE LOWER(username) = ? AND id <> ? LIMIT 1", [clean, userId]);
      if (taken.length) throw httpError(409, "Username itu sudah dipakai akun lain.");
    }
    sets.push("username = ?");
    params.push(clean || null);
  }

  if (email !== undefined && isAdmin) {
    const clean = String(email || "").trim();
    if (clean && (!EMAIL_RE.test(clean) || clean.length > 190)) throw httpError(400, "Email tidak valid.");
    if (clean) {
      const taken = await query("SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id <> ? LIMIT 1", [clean, userId]);
      if (taken.length) throw httpError(409, "Email itu sudah dipakai akun lain.");
    }
    sets.push("email = ?");
    params.push(clean || null);
  }

  if (avatar !== undefined) {
    const clean = avatar ? String(avatar) : "";
    if (clean && (clean.length > AVATAR_MAX || !AVATAR_RE.test(clean))) {
      throw httpError(400, "Foto profil tidak valid atau terlalu besar. Pakai gambar JPG, PNG, atau WebP.");
    }
    sets.push("avatar = ?");
    params.push(clean || null);
  }

  await query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, [...params, userId]);
  const rows = await query("SELECT id, name, email, username, wa_number, role, avatar FROM users WHERE id = ? LIMIT 1", [userId]);
  return publicUser(rows[0]);
};

// Ganti password akun. Password saat ini wajib benar. Sesi di perangkat lain dikeluarkan,
// sesi yang sedang dipakai (currentToken) tetap berlaku.
// Berlaku juga untuk super admin: password dari panel dipertahankan sampai nilai di env server diganti.
export const changeUserPassword = async (userId, currentPassword, newPassword, currentToken) => {
  const rows = await query("SELECT password_hash, role FROM users WHERE id = ? LIMIT 1", [userId]);
  if (!rows.length) throw httpError(404, "Akun tidak ditemukan.");
  if (!verifyPassword(currentPassword, rows[0].password_hash)) throw httpError(400, "Password saat ini salah.");
  await query("UPDATE users SET password_hash = ? WHERE id = ?", [hashPassword(newPassword), userId]);
  await query("DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?", [userId, hashToken(currentToken || "")]);
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

// impersonatedBy: id super admin, bila sesi ini dibuat admin untuk masuk sebagai pengguna.
export const createSession = async (userId, { ttlMs = SESSION_MS, impersonatedBy = null } = {}) => {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);
  await query(
    "INSERT INTO sessions (token_hash, user_id, created_at, expires_at, impersonated_by) VALUES (?, ?, ?, ?, ?)",
    [hashToken(token), userId, now, expiresAt, impersonatedBy]
  );
  return { token, expiresAt };
};

export const getSessionUser = async (token) => {
  if (!token) return null;
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.username, u.wa_number, u.role, u.avatar, s.impersonated_by
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`,
    [hashToken(token), new Date()]
  );
  if (!rows.length) return null;
  // impersonated: sesi ini dibuka super admin, bukan oleh pemilik akunnya.
  return { ...publicUser(rows[0]), impersonated: rows[0].impersonated_by !== null && rows[0].impersonated_by !== undefined };
};

// Daftar semua akun untuk super admin, dengan jumlah data yang dimiliki tiap akun.
export const adminListUsers = async () => {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.username, u.wa_number, u.role, u.created_at,
       (SELECT COUNT(*) FROM user_qr q WHERE q.user_id = u.id) AS qr_count,
       (SELECT COUNT(*) FROM linktrees l WHERE l.user_id = u.id) AS linktree_count,
       (SELECT COUNT(*) FROM twibbon_campaigns t WHERE t.user_id = u.id) AS twibbon_count,
       (SELECT COUNT(*) FROM qr_orders o WHERE u.email IS NOT NULL AND LOWER(o.email) = LOWER(u.email)) AS order_count,
       (SELECT COUNT(*) FROM qr_orders o WHERE u.email IS NOT NULL AND LOWER(o.email) = LOWER(u.email) AND o.status = 'paid') AS paid_count,
       (SELECT MAX(s.created_at) FROM sessions s WHERE s.user_id = u.id AND s.impersonated_by IS NULL) AS last_login
     FROM users u ORDER BY u.created_at DESC LIMIT 2000`
  );
  const iso = (d) => (d instanceof Date ? d.toISOString() : d || null);
  return rows.map((row) => ({
    ...publicUser(row),
    createdAt: iso(row.created_at),
    lastLoginAt: iso(row.last_login),
    qrCount: Number(row.qr_count || 0),
    linktreeCount: Number(row.linktree_count || 0),
    twibbonCount: Number(row.twibbon_count || 0),
    orderCount: Number(row.order_count || 0),
    paidCount: Number(row.paid_count || 0)
  }));
};

// Super admin masuk sebagai pengguna tanpa password pengguna itu. Sesinya terpisah, singkat (2 jam),
// dan mencatat admin yang membuatnya. Akun super admin lain tidak bisa dimasuki dengan cara ini.
export const impersonateUser = async (admin, targetId) => {
  const rows = await query("SELECT id, name, email, username, wa_number, role, avatar FROM users WHERE id = ? LIMIT 1", [Number(targetId) || 0]);
  if (!rows.length) throw httpError(404, "Pengguna tidak ditemukan.");
  if (rows[0].role !== "user") throw httpError(403, "Akun super admin tidak bisa dimasuki dengan cara ini.");
  const session = await createSession(rows[0].id, { ttlMs: IMPERSONATE_MS, impersonatedBy: admin.id });
  console.log(`[Admin] ${admin.username || admin.email || admin.id} masuk sebagai pengguna #${rows[0].id} (${rows[0].email || "-"})`);
  return { token: session.token, expiresAt: session.expiresAt, user: { ...publicUser(rows[0]), impersonated: true } };
};

export const deleteSession = async (token) => {
  if (!token) return;
  await query("DELETE FROM sessions WHERE token_hash = ?", [hashToken(token)]);
};

// Super admin pertama dibuat dari env (ADMIN_USERNAME dan ADMIN_PASSWORD_HASH).
// Setelah itu username dan password bisa diganti dari halaman profil, dan perubahan itu dipertahankan
// saat server dinyalakan ulang. Jalan darurat bila lupa password: ganti nilai env di server, lalu restart.
// Env yang berubah sejak terakhir diterapkan akan menimpa username dan password super admin pertama.
export const ensureSuperAdmin = async () => {
  const username = process.env.ADMIN_USERNAME || "";
  const hash = process.env.ADMIN_PASSWORD_HASH || "";
  if (!username || !hash) return;
  const fingerprint = crypto.createHash("sha256").update(`${username}\n${hash}`).digest("hex");
  const saved = await query("SELECT value FROM app_settings WHERE name = 'admin_env_applied' LIMIT 1");
  const applied = saved.length ? saved[0].value : null;
  const remember = () =>
    query(
      "INSERT INTO app_settings (name, value, updated_at) VALUES ('admin_env_applied', ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = VALUES(updated_at)",
      [fingerprint, new Date()]
    );

  const admins = await query("SELECT id FROM users WHERE role = 'superadmin' ORDER BY id ASC LIMIT 1");
  if (!admins.length) {
    const taken = await query("SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1", [username]);
    if (taken.length) {
      await query("UPDATE users SET password_hash = ?, role = 'superadmin' WHERE id = ?", [hash, taken[0].id]);
    } else {
      await query(
        "INSERT INTO users (name, username, password_hash, role, created_at) VALUES (?, ?, ?, 'superadmin', ?)",
        ["Super Admin", username, hash, new Date()]
      );
    }
    await remember();
    return;
  }
  // Pertama kali memakai versi ini: password di database masih sama dengan env, cukup dicatat.
  if (applied === null) {
    await remember();
    return;
  }
  if (applied === fingerprint) return;

  // Env diganti sejak terakhir diterapkan: terapkan ke super admin pertama dan keluarkan semua sesinya.
  const adminId = admins[0].id;
  const clash = await query("SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id <> ? LIMIT 1", [username, adminId]);
  if (clash.length) {
    await query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, adminId]);
  } else {
    await query("UPDATE users SET username = ?, password_hash = ? WHERE id = ?", [username, hash, adminId]);
  }
  await query("DELETE FROM sessions WHERE user_id = ?", [adminId]);
  console.log("[Admin] Username dan password super admin diterapkan ulang dari env server.");
  await remember();
};

// Hapus akun pengguna beserta semua datanya: sesi, QR dan lisensinya, Linktree dan isinya, serta Twibbon.
// deleteOrders: ikut menghapus riwayat pesanan (termasuk bukti bayar dan nota) atas email akun itu.
// Akun super admin tidak bisa dihapus dari sini.
export const adminDeleteUser = async (admin, targetId, { deleteOrders = true } = {}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT id, name, email, role FROM users WHERE id = ? FOR UPDATE", [Number(targetId) || 0]);
    if (!rows.length) throw httpError(404, "Pengguna tidak ditemukan.");
    if (rows[0].role !== "user") throw httpError(403, "Akun super admin tidak bisa dihapus dari sini.");
    const user = rows[0];
    const email = String(user.email || "").trim();
    const run = async (sql, params) => Number((await conn.query(sql, params))[0].affectedRows || 0);

    const removed = { orders: 0 };
    removed.sessions = await run("DELETE FROM sessions WHERE user_id = ?", [user.id]);
    removed.linktreeItems = await run(
      "DELETE FROM linktree_items WHERE linktree_id IN (SELECT id FROM linktrees WHERE user_id = ?)",
      [user.id]
    );
    removed.linktrees = await run("DELETE FROM linktrees WHERE user_id = ?", [user.id]);
    removed.twibbons = await run("DELETE FROM twibbon_campaigns WHERE user_id = ?", [user.id]);
    if (email) {
      // Twibbon lama (sebelum ada akun) yang dikenali dari email pembuatnya.
      removed.twibbons += await run(
        "DELETE FROM twibbon_campaigns WHERE user_id IS NULL AND creator_id IN (SELECT id FROM twibbon_users WHERE LOWER(email) = LOWER(?))",
        [email]
      );
    }
    // Lisensi yang terikat pada QR akun ini selalu ikut terhapus bersama QR-nya.
    removed.licenses = await run("DELETE FROM qr_licenses WHERE user_qr_id IN (SELECT id FROM user_qr WHERE user_id = ?)", [user.id]);
    if (deleteOrders && email) {
      removed.licenses += await run("DELETE FROM qr_licenses WHERE LOWER(email) = LOWER(?)", [email]);
      removed.orders = await run("DELETE FROM qr_orders WHERE LOWER(email) = LOWER(?)", [email]);
    }
    removed.qrs = await run("DELETE FROM user_qr WHERE user_id = ?", [user.id]);
    await conn.query("DELETE FROM users WHERE id = ?", [user.id]);
    await conn.commit();
    console.log(
      `[Admin] ${admin.username || admin.email || admin.id} menghapus akun #${user.id} (${email || "-"}): ${JSON.stringify(removed)}`
    );
    return { user: { id: user.id, name: user.name || "", email }, removed };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};
