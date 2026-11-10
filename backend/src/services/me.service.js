import crypto from "crypto";
import { query } from "../db/mysql.js";

// QR tersimpan milik pengguna. Satu pembelian berlaku untuk satu QR (per QR code).
// QR yang belum punya lisensi berstatus gratis: hitam-putih dengan logo.
const FREE_FG = "#000000";
const FREE_BG = "#FFFFFF";

const iso = (d) => (d instanceof Date ? d.toISOString() : d);

const toQr = (row) => ({
  id: row.id,
  link: row.link,
  fg: row.fg,
  bg: row.bg,
  logo: Boolean(row.logo),
  createdAt: iso(row.created_at)
});

// Status satu QR dari lisensi yang terikat padanya.
// aktif: ada lisensi yang belum berakhir dan tidak dinonaktifkan admin.
// nonaktif: lisensi terakhir dinonaktifkan admin. berakhir: lisensi terakhir sudah lewat masa aktifnya.
// gratis: QR belum pernah punya lisensi.
const qrStatus = (licenses, now) => {
  if (!licenses.length) return { status: "gratis", planExpiresAt: null };
  const newest = (list) => list.reduce((a, b) => (new Date(b.expires_at) > new Date(a.expires_at) ? b : a));
  const active = licenses.filter((l) => !l.revoked && new Date(l.expires_at) > now);
  if (active.length) return { status: "aktif", planExpiresAt: iso(new Date(newest(active).expires_at)) };
  return { status: newest(licenses).revoked ? "nonaktif" : "berakhir", planExpiresAt: null };
};

export const listUserQr = async (user) => {
  const rows = await query(
    "SELECT id, link, fg, bg, logo, created_at FROM user_qr WHERE user_id = ? ORDER BY created_at DESC LIMIT 200",
    [user.id]
  );
  if (!rows.length) return [];
  const licenses = await query(
    "SELECT user_qr_id, expires_at, revoked FROM qr_licenses WHERE user_qr_id IN (?)",
    [rows.map((r) => r.id)]
  );
  const now = new Date();
  return rows.map((row) => ({
    ...toQr(row),
    ...qrStatus(
      licenses.filter((l) => l.user_qr_id === row.id),
      now
    )
  }));
};

// QR dari generator selalu gratis. Paket berbayar dibuat lewat pesanan, satu pesanan untuk satu QR.
export const createUserQr = async (user, { link }) => {
  const id = crypto.randomUUID();
  const createdAt = new Date();
  await query(
    "INSERT INTO user_qr (id, user_id, link, fg, bg, logo, plan_expires_at, created_at) VALUES (?, ?, ?, ?, ?, 1, NULL, ?)",
    [id, user.id, link, FREE_FG, FREE_BG, createdAt]
  );
  return { ...toQr({ id, link, fg: FREE_FG, bg: FREE_BG, logo: 1, created_at: createdAt }), status: "gratis", planExpiresAt: null };
};

export const deleteUserQr = async (userId, id) => {
  const result = await query("DELETE FROM user_qr WHERE id = ? AND user_id = ?", [id, userId]);
  return Number(result.affectedRows || 0) > 0;
};
