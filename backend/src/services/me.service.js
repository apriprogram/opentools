import crypto from "crypto";
import { query } from "../db/mysql.js";

// QR tersimpan milik pengguna. Masa aktif mengikuti lisensi berbayar yang aktif:
// tanpa lisensi aktif, QR berstatus gratis (hitam-putih, logo tetap) dan tidak berakhir.
const FREE_FG = "#000000";
const FREE_BG = "#FFFFFF";

const iso = (d) => (d instanceof Date ? d.toISOString() : d);

const toQr = (row) => ({
  id: row.id,
  link: row.link,
  fg: row.fg,
  bg: row.bg,
  logo: Boolean(row.logo),
  createdAt: iso(row.created_at),
  planExpiresAt: row.plan_expires_at ? iso(row.plan_expires_at) : null
});

// Lisensi aktif terlama milik email akun, atau null jika tidak ada.
export const activePlanExpiry = async (email) => {
  if (!email) return null;
  const rows = await query(
    "SELECT MAX(expires_at) AS expires_at FROM qr_licenses WHERE LOWER(email) = LOWER(?) AND revoked = 0 AND expires_at > ?",
    [email, new Date()]
  );
  return rows[0]?.expires_at ? new Date(rows[0].expires_at) : null;
};

// Status QR dihitung dari lisensi saat ini: aktif, nonaktif (dimatikan admin), berakhir, atau gratis.
export const listUserQr = async (user) => {
  const rows = await query(
    "SELECT id, link, fg, bg, logo, plan_expires_at, created_at FROM user_qr WHERE user_id = ? ORDER BY created_at DESC LIMIT 200",
    [user.id]
  );
  const activeExpiry = await activePlanExpiry(user.email);
  const now = new Date();
  return rows.map((row) => {
    const q = toQr(row);
    if (!row.plan_expires_at) return { ...q, status: "gratis", planExpiresAt: null };
    if (activeExpiry) return { ...q, status: "aktif", planExpiresAt: iso(activeExpiry) };
    const expired = new Date(row.plan_expires_at) <= now;
    return { ...q, status: expired ? "berakhir" : "nonaktif", planExpiresAt: null };
  });
};

export const createUserQr = async (user, { link, fg, bg, logo }) => {
  const expiresAt = await activePlanExpiry(user.email);
  const paid = Boolean(expiresAt);
  const id = crypto.randomUUID();
  const row = {
    id,
    link,
    fg: paid && /^#[0-9a-fA-F]{6}$/.test(fg) ? fg : FREE_FG,
    bg: paid && /^#[0-9a-fA-F]{6}$/.test(bg) ? bg : FREE_BG,
    logo: paid ? (logo === false ? 0 : 1) : 1,
    plan_expires_at: expiresAt,
    created_at: new Date()
  };
  await query(
    "INSERT INTO user_qr (id, user_id, link, fg, bg, logo, plan_expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [row.id, user.id, row.link, row.fg, row.bg, row.logo, row.plan_expires_at, row.created_at]
  );
  return { ...toQr(row), status: expiresAt ? "aktif" : "gratis" };
};

export const deleteUserQr = async (userId, id) => {
  const result = await query("DELETE FROM user_qr WHERE id = ? AND user_id = ?", [id, userId]);
  return Number(result.affectedRows || 0) > 0;
};
