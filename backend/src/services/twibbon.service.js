import crypto from "crypto";
import { query } from "../db/mysql.js";

// Twibbon: bingkai foto yang dibuat akun terdaftar. Satu akun bisa membuat banyak Twibbon.
// Halaman pakai (/c/:slug) dan daftar publik bisa dibuka siapa saja; membuat, mengubah, dan menghapus wajib masuk akun.
export const MAX_TWIBBONS_PER_USER = 50;
// Bingkai disimpan sebagai data URL. Batasnya dijaga di bawah 1 MB supaya satu perintah simpan
// tetap muat dalam batas paket MySQL bawaan.
const FRAME_MAX = 900000;
const FRAME_RE = /^data:image\/(png|webp|jpeg);base64,/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,59}$/;

const iso = (value) => (value instanceof Date ? value.toISOString() : value);

export const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Data yang aman untuk publik: tanpa ID pemilik.
const toCampaign = (row, { withFrame = true } = {}) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description || "",
  ...(withFrame ? { frameBase64: row.frame_base64 } : {}),
  creatorName: row.owner_name || row.creator_name || "Anonim",
  createdAt: iso(row.created_at),
  views: Number(row.views) || 0,
  usage: Number(row.usage_count) || 0
});

// Pemilik baru ada di tabel users (user_id). Twibbon lama dibuat sebelum ada akun, pemiliknya di twibbon_users.
const SELECT = `
  SELECT c.id, c.slug, c.title, c.description, c.frame_base64, c.user_id, c.creator_id,
         c.views, c.usage_count, c.created_at, u.name AS owner_name, tu.name AS creator_name
  FROM twibbon_campaigns c
  LEFT JOIN users u ON u.id = c.user_id
  LEFT JOIN twibbon_users tu ON tu.id = c.creator_id`;

// Twibbon milik akun: yang dibuat akun itu, ditambah Twibbon lama yang emailnya sama dengan email akun.
const OWNED = `(c.user_id = ? OR (c.user_id IS NULL AND c.creator_id IN (
  SELECT id FROM twibbon_users WHERE LOWER(email) = LOWER(?))))`;
const ownerParams = (user) => [user.id, user.email || ""];

const cleanTitle = (value) => {
  const title = String(value || "").trim();
  if (title.length < 2 || title.length > 120) throw httpError(400, "Judul wajib diisi (2 sampai 120 karakter).");
  return title;
};

const cleanDescription = (value) => {
  const description = String(value || "").trim();
  if (description.length > 500) throw httpError(400, "Deskripsi maksimal 500 karakter.");
  return description;
};

const cleanFrame = (value) => {
  if (typeof value !== "string" || !FRAME_RE.test(value)) {
    throw httpError(400, "Bingkai harus berupa gambar PNG, WebP, atau JPEG.");
  }
  if (value.length > FRAME_MAX) throw httpError(400, "Ukuran bingkai terlalu besar. Pakai gambar yang lebih kecil.");
  return value;
};

const cleanSlug = (value) => {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  if (!SLUG_RE.test(slug)) throw httpError(400, "Alamat hanya boleh huruf kecil, angka, dan tanda - (minimal 3 karakter).");
  return slug;
};

// Kalau alamat sudah dipakai, tambahkan angka di belakangnya.
const uniqueSlug = async (base) => {
  let candidate = base;
  for (let counter = 2; ; counter++) {
    const rows = await query("SELECT id FROM twibbon_campaigns WHERE slug = ? LIMIT 1", [candidate]);
    if (!rows.length) return candidate;
    candidate = `${base.slice(0, 55)}-${counter}`;
  }
};

export const createCampaign = async (user, body = {}) => {
  const count = await query(`SELECT COUNT(*) AS n FROM twibbon_campaigns c WHERE ${OWNED}`, ownerParams(user));
  if (Number(count[0].n) >= MAX_TWIBBONS_PER_USER) {
    throw httpError(400, `Maksimal ${MAX_TWIBBONS_PER_USER} Twibbon per akun.`);
  }
  const title = cleanTitle(body.title);
  const description = cleanDescription(body.description);
  const frame = cleanFrame(body.frameBase64);
  const slug = await uniqueSlug(cleanSlug(body.slug || title));
  const id = crypto.randomUUID();
  // creator_id (kolom lama, wajib diisi) memakai penanda akun supaya tidak bentrok dengan data lama.
  await query(
    `INSERT INTO twibbon_campaigns
      (id, slug, title, description, frame_base64, creator_id, user_id, views, usage_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
    [id, slug, title, description, frame, `user:${user.id}`.slice(0, 36), user.id, new Date()]
  );
  return getOwnedCampaign(user, id);
};

export const listMyCampaigns = async (user) => {
  const rows = await query(`${SELECT} WHERE ${OWNED} ORDER BY c.created_at DESC LIMIT 100`, ownerParams(user));
  return rows.map((r) => toCampaign(r));
};

export const getOwnedCampaign = async (user, id) => {
  const rows = await query(`${SELECT} WHERE c.id = ? AND ${OWNED} LIMIT 1`, [String(id), ...ownerParams(user)]);
  if (!rows.length) throw httpError(404, "Twibbon tidak ditemukan di akun Anda.");
  return toCampaign(rows[0]);
};

// Ubah judul, deskripsi, dan (opsional) gambar bingkai. Alamat tidak berubah supaya link yang sudah dibagikan tetap jalan.
export const updateCampaign = async (user, id, body = {}) => {
  await getOwnedCampaign(user, id);
  const title = cleanTitle(body.title);
  const description = cleanDescription(body.description);
  await query("UPDATE twibbon_campaigns SET title = ?, description = ? WHERE id = ?", [title, description, String(id)]);
  if (body.frameBase64 !== undefined && body.frameBase64 !== null) {
    await query("UPDATE twibbon_campaigns SET frame_base64 = ? WHERE id = ?", [cleanFrame(body.frameBase64), String(id)]);
  }
  return getOwnedCampaign(user, id);
};

export const deleteOwnedCampaign = async (user, id) => {
  await getOwnedCampaign(user, id);
  await query("DELETE FROM twibbon_campaigns WHERE id = ?", [String(id)]);
};

// Super admin: hapus Twibbon mana pun (moderasi).
export const deleteCampaignById = async (id) => {
  const result = await query("DELETE FROM twibbon_campaigns WHERE id = ?", [String(id)]);
  return result.affectedRows > 0;
};

export const getAllCampaigns = async () => {
  const rows = await query(`${SELECT} ORDER BY c.created_at DESC LIMIT 60`);
  return rows.map((r) => toCampaign(r));
};

export const getCampaignBySlug = async (slug) => {
  const rows = await query(`${SELECT} WHERE c.slug = ? LIMIT 1`, [String(slug || "").toLowerCase()]);
  return rows.length ? toCampaign(rows[0]) : null;
};

export const trackCampaignView = async (id) => {
  const result = await query("UPDATE twibbon_campaigns SET views = views + 1 WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

export const trackCampaignUsage = async (id) => {
  const result = await query("UPDATE twibbon_campaigns SET usage_count = usage_count + 1 WHERE id = ?", [id]);
  return result.affectedRows > 0;
};
