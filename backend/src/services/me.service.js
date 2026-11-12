import crypto from "crypto";
import { query } from "../db/mysql.js";
import { newScanCode } from "./scan.service.js";

// QR tersimpan milik pengguna. Satu pembelian berlaku untuk satu QR (per QR code).
// QR yang belum punya lisensi berstatus gratis: hitam-putih dengan logo.
const FREE_FG = "#000000";
const FREE_BG = "#FFFFFF";

const iso = (d) => (d instanceof Date ? d.toISOString() : d);

const QR_COLUMNS = "id, link, fg, bg, logo, code, disabled, dynamic_at, created_at";

// code: kode pindai untuk alamat /api/q/<kode> yang tertanam di gambar QR.
// disabled: QR dinonaktifkan pemiliknya (saat dipindai tampil halaman "tidak aktif").
// legacyStatic: QR dibuat sebelum ada QR dinamis, jadi gambar yang diunduh sebelum dynamicAt masih berisi link langsung.
const toQr = (row) => ({
  id: row.id,
  link: row.link,
  fg: row.fg,
  bg: row.bg,
  logo: Boolean(row.logo),
  code: row.code || null,
  disabled: Number(row.disabled) === 1,
  dynamicAt: row.dynamic_at ? iso(row.dynamic_at) : null,
  legacyStatic: Boolean(row.dynamic_at) && new Date(row.dynamic_at).getTime() - new Date(row.created_at).getTime() > 60 * 1000,
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

// QR milik super admin (menu Tools Admin) memakai fitur Premium tanpa pesanan dan tanpa batas waktu.
const ADMIN_FREE = { status: "aktif", planExpiresAt: null, unlimited: true };
const isAdminFree = (user) => user?.role === "superadmin";

export const listUserQr = async (user) => {
  const rows = await query(
    `SELECT ${QR_COLUMNS} FROM user_qr WHERE user_id = ? ORDER BY created_at DESC LIMIT 200`,
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
    ...(isAdminFree(user)
      ? ADMIN_FREE
      : qrStatus(
          licenses.filter((l) => l.user_qr_id === row.id),
          now
        ))
  }));
};

// QR dari generator selalu gratis (hitam putih dengan logo). Paket berbayar dibuat lewat pesanan, satu pesanan untuk satu QR.
// Pengecualian: super admin boleh langsung memakai warna sendiri dan mematikan logo.
export const createUserQr = async (user, { link, fg, bg, logo }) => {
  const custom = isAdminFree(user);
  const design = custom ? { fg: fg || FREE_FG, bg: bg || FREE_BG, logo: logo === false ? 0 : 1 } : { fg: FREE_FG, bg: FREE_BG, logo: 1 };
  const id = crypto.randomUUID();
  const code = newScanCode();
  const createdAt = new Date();
  await query(
    "INSERT INTO user_qr (id, user_id, link, fg, bg, logo, plan_expires_at, code, dynamic_at, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)",
    [id, user.id, link, design.fg, design.bg, design.logo, code, createdAt, createdAt]
  );
  return {
    ...toQr({ id, link, ...design, code, disabled: 0, dynamic_at: createdAt, created_at: createdAt }),
    ...(custom ? ADMIN_FREE : { status: "gratis", planExpiresAt: null })
  };
};

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Ubah QR: link tujuan (opsional), warna QR, warna latar, dan logo.
// Hanya untuk QR yang paket Premium-nya masih aktif. QR gratis tetap hitam putih dengan logo.
export const updateUserQrDesign = async (user, id, { link, fg, bg, logo }) => {
  const rows = await query(
    `SELECT ${QR_COLUMNS} FROM user_qr WHERE id = ? AND user_id = ? LIMIT 1`,
    [String(id), user.id]
  );
  if (!rows.length) throw httpError(404, "QR tidak ditemukan.");
  const licenses = isAdminFree(user)
    ? []
    : await query("SELECT user_qr_id, expires_at, revoked FROM qr_licenses WHERE user_qr_id = ?", [rows[0].id]);
  const state = isAdminFree(user) ? ADMIN_FREE : qrStatus(licenses, new Date());
  if (state.status !== "aktif") {
    throw httpError(403, "Link, warna, dan logo hanya bisa diubah untuk QR dengan paket Premium Gold yang masih aktif.");
  }
  const nextLink = link || rows[0].link;
  await query("UPDATE user_qr SET link = ?, fg = ?, bg = ?, logo = ? WHERE id = ? AND user_id = ?", [
    nextLink,
    fg,
    bg,
    logo ? 1 : 0,
    rows[0].id,
    user.id
  ]);
  return { ...toQr({ ...rows[0], link: nextLink, fg, bg, logo: logo ? 1 : 0 }), ...state };
};

// Nonaktifkan atau aktifkan lagi QR milik sendiri. QR nonaktif menampilkan halaman "tidak aktif" saat dipindai.
// Berlaku untuk semua QR di akun (gratis maupun Premium).
export const setUserQrActive = async (user, id, active) => {
  const result = await query("UPDATE user_qr SET disabled = ? WHERE id = ? AND user_id = ?", [active ? 0 : 1, String(id), user.id]);
  if (!Number(result.affectedRows || 0)) {
    const exists = await query("SELECT id FROM user_qr WHERE id = ? AND user_id = ? LIMIT 1", [String(id), user.id]);
    if (!exists.length) throw httpError(404, "QR tidak ditemukan.");
  }
  return { id: String(id), disabled: !active };
};

export const deleteUserQr = async (userId, id) => {
  const result = await query("DELETE FROM user_qr WHERE id = ? AND user_id = ?", [id, userId]);
  return Number(result.affectedRows || 0) > 0;
};
