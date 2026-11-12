import crypto from "crypto";
import { pool, query } from "../db/mysql.js";
import { httpError } from "./qr.service.js";

// Linktree: satu akun bisa membuat banyak Linktree. Halaman publik bisa dibuka siapa saja,
// sedangkan membuat dan mengedit wajib masuk akun.
export const MAX_TREES_PER_USER = 50;
export const MAX_ITEMS = 100;
export const SOCIAL_PLATFORMS = [
  "website", "instagram", "youtube", "tiktok", "facebook", "x", "threads", "linkedin", "github",
  "whatsapp", "telegram", "shopee", "email"
];

const SLUG_RE = /^[a-z0-9][a-z0-9_-]{2,29}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const ITEM_TYPES = ["link", "header", "social"];
const BG_TYPES = ["color", "gradient", "image"];
const BUTTON_STYLES = ["fill", "outline", "shadow", "soft", "glass", "liquid"];
const SOCIAL_STYLES = ["outline", "plain", "fill", "brand", "liquid"];
// Huruf halaman. Harus sama dengan daftar di frontend (components/linktree/fonts.js).
const FONT_IDS = ["poppins", "inter", "jakarta", "montserrat", "outfit", "nunito", "space", "playfair", "bebas", "caveat"];
const BUTTON_RADII = ["pill", "rounded", "square"];
const IMAGE_DATA_RE = /^data:image\/(png|jpeg|webp);base64,/;
const AVATAR_MAX = 600000; // karakter data URL, sekitar 400 KB
// Gambar latar disimpan di dalam tema. Batasnya dijaga di bawah 1 MB supaya satu perintah simpan
// tetap muat dalam batas paket MySQL bawaan.
const BG_IMAGE_MAX = 800000; // karakter data URL, sekitar 600 KB
const ICON_MAX = 40000; // karakter data URL, sekitar 30 KB (ikon 96 px)
const ICON_PRESET_RE = /^preset:[a-z0-9-]{1,30}$/;

const DEFAULT_THEME = {
  preset: "putih",
  bg: { type: "color", color: "#FFFFFF", color2: "#E0E7FF", image: null },
  text: "#111111",
  button: { style: "fill", radius: "pill", color: "#111111", textColor: "#FFFFFF" },
  avatar: { outline: true },
  social: { style: "outline" },
  font: "poppins",
};

const iso = (d) => (d instanceof Date ? d.toISOString() : d);

// Tema dibersihkan di server: hanya warna hex, gaya tombol, dan gambar latar yang diizinkan.
export const sanitizeTheme = (input) => {
  const t = input && typeof input === "object" ? input : {};
  const hex = (v, fallback) => (typeof v === "string" && HEX_RE.test(v) ? v : fallback);
  const bg = t.bg && typeof t.bg === "object" ? t.bg : {};
  const button = t.button && typeof t.button === "object" ? t.button : {};
  const avatar = t.avatar && typeof t.avatar === "object" ? t.avatar : {};
  const social = t.social && typeof t.social === "object" ? t.social : {};
  const type = BG_TYPES.includes(bg.type) ? bg.type : "color";
  const image =
    type === "image" && typeof bg.image === "string" && IMAGE_DATA_RE.test(bg.image) && bg.image.length <= BG_IMAGE_MAX
      ? bg.image
      : null;
  return {
    preset: typeof t.preset === "string" ? t.preset.slice(0, 30) : "custom",
    bg: {
      type: type === "image" && !image ? "color" : type,
      color: hex(bg.color, DEFAULT_THEME.bg.color),
      color2: hex(bg.color2, DEFAULT_THEME.bg.color2),
      image,
    },
    text: hex(t.text, DEFAULT_THEME.text),
    button: {
      style: BUTTON_STYLES.includes(button.style) ? button.style : "fill",
      radius: BUTTON_RADII.includes(button.radius) ? button.radius : "pill",
      color: hex(button.color, DEFAULT_THEME.button.color),
      textColor: hex(button.textColor, DEFAULT_THEME.button.textColor),
    },
    // Foto profil: pakai garis tepi atau tidak. Ikon sosial: garis, polos, berlatar, atau warna brand.
    avatar: { outline: avatar.outline !== false },
    social: { style: SOCIAL_STYLES.includes(social.style) ? social.style : "outline" },
    font: FONT_IDS.includes(t.font) ? t.font : "poppins",
  };
};

const sanitizeAvatar = (value) => {
  if (!value) return null;
  if (typeof value !== "string" || !IMAGE_DATA_RE.test(value) || value.length > AVATAR_MAX) {
    throw httpError(400, "Foto profil harus PNG, JPEG, atau WebP dengan ukuran maksimal sekitar 400 KB.");
  }
  return value;
};

const cleanTitle = (value, max = 120) => {
  const text = String(value || "").trim();
  if (!text || text.length > max) throw httpError(400, `Judul wajib diisi (maksimal ${max} karakter).`);
  return text;
};

// Ikon tautan: pilihan bawaan ("preset:<nama>") atau gambar kecil yang diunggah (data URL).
const sanitizeIcon = (value) => {
  if (!value) return null;
  if (typeof value !== "string") throw httpError(400, "Ikon tautan tidak valid.");
  if (ICON_PRESET_RE.test(value)) return value;
  if (IMAGE_DATA_RE.test(value) && value.length <= ICON_MAX) return value;
  throw httpError(400, "Ikon tautan harus dipilih dari daftar, atau gambar PNG, JPEG, atau WebP berukuran kecil.");
};

// Alamat link: http, https, mailto, atau tel. Tanpa skema, dianggap https.
export const normalizeUrl = (raw, platform) => {
  let value = String(raw || "").trim();
  if (!value) throw httpError(400, "URL wajib diisi.");
  if (value.length > 2048) throw httpError(400, "URL terlalu panjang (maksimal 2048 karakter).");
  if (platform === "email" && !/^[a-z]+:/i.test(value)) value = `mailto:${value}`;
  else if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value}`;
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(value)) {
    throw httpError(400, "Hanya link http, https, mailto, atau tel yang diizinkan.");
  }
  try {
    new URL(value);
  } catch {
    throw httpError(400, "Format URL tidak valid.");
  }
  return value;
};

// Item dibersihkan dan diberi urutan sesuai posisi di daftar.
const sanitizeItems = (items) => {
  if (!Array.isArray(items)) throw httpError(400, "Daftar tautan tidak valid.");
  if (items.length > MAX_ITEMS) throw httpError(400, `Maksimal ${MAX_ITEMS} item per Linktree.`);
  return items.map((it, position) => {
    if (!it || typeof it !== "object" || !ITEM_TYPES.includes(it.type)) throw httpError(400, "Jenis item tidak valid.");
    const id = typeof it.id === "string" && it.id.length <= 36 ? it.id : null;
    const enabled = it.enabled === false ? 0 : 1;
    if (it.type === "header") {
      const title = String(it.title || "").trim().slice(0, 200);
      if (!title) throw httpError(400, "Teks header tidak boleh kosong.");
      return { id, type: "header", title, url: null, platform: null, icon: null, enabled, position };
    }
    if (it.type === "social") {
      if (!SOCIAL_PLATFORMS.includes(it.platform)) throw httpError(400, "Platform ikon sosial tidak dikenal.");
      return { id, type: "social", title: null, url: normalizeUrl(it.url, it.platform), platform: it.platform, icon: null, enabled, position };
    }
    const title = String(it.title || "").trim().slice(0, 200);
    if (!title) throw httpError(400, "Judul tautan wajib diisi.");
    return { id, type: "link", title, url: normalizeUrl(it.url), platform: null, icon: sanitizeIcon(it.icon), enabled, position };
  });
};

const parseTheme = (text) => {
  try {
    return sanitizeTheme(JSON.parse(text || "null"));
  } catch {
    return sanitizeTheme(null);
  }
};

const toItem = (r) => ({
  id: r.id,
  type: r.type,
  title: r.title,
  url: r.url,
  platform: r.platform,
  icon: r.icon || null,
  enabled: Boolean(r.enabled),
  position: r.position,
  clicks: Number(r.clicks || 0),
});

const toTree = (r, items) => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  bio: r.bio || "",
  avatar: r.avatar || null,
  theme: parseTheme(r.theme),
  published: Boolean(r.published),
  views: Number(r.views || 0),
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
  items: items.map(toItem),
});

// Versi publik: hanya item yang aktif, tanpa jumlah klik.
const toPublic = (r, items) => ({
  slug: r.slug,
  title: r.title,
  bio: r.bio || "",
  avatar: r.avatar || null,
  theme: parseTheme(r.theme),
  items: items
    .map(toItem)
    .filter((i) => i.enabled)
    .map(({ id, type, title, url, platform, icon }) => ({ id, type, title, url, platform, icon })),
});

const loadItems = (treeId) =>
  query(
    "SELECT id, type, title, url, platform, icon, enabled, position, clicks FROM linktree_items WHERE linktree_id = ? ORDER BY position ASC, created_at ASC",
    [treeId]
  );

const findOwned = async (userId, id) => {
  const rows = await query("SELECT * FROM linktrees WHERE id = ? AND user_id = ? LIMIT 1", [String(id), userId]);
  if (!rows.length) throw httpError(404, "Linktree tidak ditemukan.");
  return rows[0];
};

// Alamat (slug) dibersihkan dan harus unik di seluruh situs.
const checkSlug = async (raw, selfId) => {
  const slug = String(raw || "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw httpError(400, "Alamat hanya boleh huruf kecil, angka, - dan _ (3 sampai 30 karakter).");
  const taken = await query("SELECT id FROM linktrees WHERE slug = ? AND id <> ? LIMIT 1", [slug, selfId || ""]);
  if (taken.length) throw httpError(409, "Alamat ini sudah dipakai. Pilih alamat lain.");
  return slug;
};

// Simpan ulang daftar item. Item yang sudah ada dipertahankan (termasuk jumlah kliknya).
const replaceItems = async (conn, treeId, items, now) => {
  const [existing] = await conn.query("SELECT id FROM linktree_items WHERE linktree_id = ?", [treeId]);
  const existingIds = new Set(existing.map((r) => r.id));
  const keep = new Set(items.filter((it) => it.id && existingIds.has(it.id)).map((it) => it.id));
  const removed = [...existingIds].filter((id) => !keep.has(id));
  if (removed.length) {
    await conn.query("DELETE FROM linktree_items WHERE linktree_id = ? AND id IN (?)", [treeId, removed]);
  }
  for (const it of items) {
    if (it.id && keep.has(it.id)) {
      await conn.query(
        "UPDATE linktree_items SET type = ?, title = ?, url = ?, platform = ?, icon = ?, position = ?, enabled = ? WHERE id = ? AND linktree_id = ?",
        [it.type, it.title, it.url, it.platform, it.icon, it.position, it.enabled, it.id, treeId]
      );
    } else {
      await conn.query(
        "INSERT INTO linktree_items (id, linktree_id, type, title, url, platform, icon, position, enabled, clicks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)",
        [crypto.randomUUID(), treeId, it.type, it.title, it.url, it.platform, it.icon, it.position, it.enabled, now]
      );
    }
  }
};

export const listLinktrees = async (userId) => {
  const rows = await query(
    `SELECT t.id, t.slug, t.title, t.published, t.views, t.created_at, t.updated_at,
      (SELECT COUNT(*) FROM linktree_items i WHERE i.linktree_id = t.id AND i.type = 'link') AS link_count,
      (SELECT COALESCE(SUM(i.clicks), 0) FROM linktree_items i WHERE i.linktree_id = t.id) AS clicks
     FROM linktrees t WHERE t.user_id = ? ORDER BY t.created_at DESC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    published: Boolean(r.published),
    views: Number(r.views || 0),
    linkCount: Number(r.link_count || 0),
    clicks: Number(r.clicks || 0),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  }));
};

export const getLinktree = async (userId, id) => {
  const row = await findOwned(userId, id);
  return toTree(row, await loadItems(row.id));
};

export const createLinktree = async (userId, { title, slug }) => {
  const count = await query("SELECT COUNT(*) AS n FROM linktrees WHERE user_id = ?", [userId]);
  if (Number(count[0].n) >= MAX_TREES_PER_USER) {
    throw httpError(400, `Maksimal ${MAX_TREES_PER_USER} Linktree per akun.`);
  }
  const cleanedTitle = cleanTitle(title);
  const cleanedSlug = await checkSlug(slug, null);
  const id = crypto.randomUUID();
  const now = new Date();
  await query(
    "INSERT INTO linktrees (id, user_id, slug, title, bio, avatar, theme, published, views, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, NULL, ?, 0, 0, ?, ?)",
    [id, userId, cleanedSlug, cleanedTitle, JSON.stringify(DEFAULT_THEME), now, now]
  );
  return getLinktree(userId, id);
};

// Ubah profil, tema, foto, dan item. Hanya kolom yang dikirim yang diubah.
export const updateLinktree = async (userId, id, body = {}) => {
  await findOwned(userId, id);
  const sets = [];
  const params = [];
  if (body.title !== undefined) {
    sets.push("title = ?");
    params.push(cleanTitle(body.title));
  }
  if (body.bio !== undefined) {
    const bio = String(body.bio || "").trim();
    if (bio.length > 300) throw httpError(400, "Bio maksimal 300 karakter.");
    sets.push("bio = ?");
    params.push(bio || null);
  }
  if (body.slug !== undefined) {
    sets.push("slug = ?");
    params.push(await checkSlug(body.slug, id));
  }
  if (body.published !== undefined) {
    sets.push("published = ?");
    params.push(body.published ? 1 : 0);
  }
  // Tema (bisa berisi gambar latar) dan foto profil disimpan dengan perintah terpisah.
  // Keduanya berukuran besar; kalau digabung dalam satu perintah, ukurannya bisa melewati
  // batas paket MySQL (max_allowed_packet, bawaannya 1 MB di banyak server).
  const large = [];
  if (body.theme !== undefined) large.push(["theme", JSON.stringify(sanitizeTheme(body.theme))]);
  if (body.avatar !== undefined) large.push(["avatar", sanitizeAvatar(body.avatar)]);
  const items = body.items !== undefined ? sanitizeItems(body.items) : null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const now = new Date();
    sets.push("updated_at = ?");
    params.push(now);
    await conn.query(`UPDATE linktrees SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, [...params, String(id), userId]);
    for (const [column, value] of large) {
      await conn.query(`UPDATE linktrees SET ${column} = ? WHERE id = ? AND user_id = ?`, [value, String(id), userId]);
    }
    if (items) await replaceItems(conn, String(id), items, now);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
  return getLinktree(userId, id);
};

export const deleteLinktree = async (userId, id) => {
  await findOwned(userId, id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM linktree_items WHERE linktree_id = ?", [String(id)]);
    await conn.query("DELETE FROM linktrees WHERE id = ? AND user_id = ?", [String(id), userId]);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Super admin: semua Linktree dari semua akun, beserta pemiliknya. Hanya untuk dilihat.
const toOwner = (r) => ({
  id: r.user_id,
  name: r.owner_name || "",
  email: r.owner_email || "",
  whatsapp: r.owner_whatsapp || "",
});

const ADMIN_TREE_SELECT = `SELECT t.id, t.user_id, t.slug, t.title, t.bio, t.published, t.views, t.created_at, t.updated_at,
  u.name AS owner_name, u.email AS owner_email, u.wa_number AS owner_whatsapp,
  (SELECT COUNT(*) FROM linktree_items i WHERE i.linktree_id = t.id AND i.type = 'link') AS link_count,
  (SELECT COUNT(*) FROM linktree_items i WHERE i.linktree_id = t.id) AS item_count,
  (SELECT COALESCE(SUM(i.clicks), 0) FROM linktree_items i WHERE i.linktree_id = t.id) AS clicks
  FROM linktrees t LEFT JOIN users u ON u.id = t.user_id`;

const toAdminTree = (r) => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  bio: r.bio || "",
  published: Boolean(r.published),
  views: Number(r.views || 0),
  linkCount: Number(r.link_count || 0),
  itemCount: Number(r.item_count || 0),
  clicks: Number(r.clicks || 0),
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
  owner: toOwner(r),
});

export const adminListLinktrees = async () => {
  const rows = await query(`${ADMIN_TREE_SELECT} ORDER BY t.created_at DESC LIMIT 1000`);
  return rows.map(toAdminTree);
};

// Detail satu Linktree: data di atas, ditambah foto profil dan semua itemnya.
export const adminGetLinktree = async (id) => {
  const rows = await query(`${ADMIN_TREE_SELECT} WHERE t.id = ? LIMIT 1`, [String(id)]);
  if (!rows.length) throw httpError(404, "Linktree tidak ditemukan.");
  const extra = await query("SELECT avatar FROM linktrees WHERE id = ? LIMIT 1", [rows[0].id]);
  const items = await loadItems(rows[0].id);
  return { ...toAdminTree(rows[0]), avatar: extra[0]?.avatar || null, items: items.map(toItem) };
};

const findPublished = async (slug) => {
  const rows = await query("SELECT * FROM linktrees WHERE slug = ? AND published = 1 LIMIT 1", [String(slug || "").toLowerCase()]);
  if (!rows.length) throw httpError(404, "Halaman ini tidak ditemukan atau belum diterbitkan.");
  return rows[0];
};

export const getPublicLinktree = async (slug) => {
  const row = await findPublished(slug);
  return toPublic(row, await loadItems(row.id));
};

export const recordView = async (slug) => {
  await query("UPDATE linktrees SET views = views + 1 WHERE slug = ? AND published = 1", [String(slug || "").toLowerCase()]);
};

// Klik tautan: hitung klik lalu kembalikan URL tujuan.
export const recordClick = async (slug, itemId) => {
  const rows = await query(
    `SELECT i.id, i.type, i.url FROM linktree_items i JOIN linktrees t ON t.id = i.linktree_id
     WHERE t.slug = ? AND t.published = 1 AND i.id = ? AND i.enabled = 1 LIMIT 1`,
    [String(slug || "").toLowerCase(), String(itemId || "")]
  );
  if (!rows.length || rows[0].type === "header" || !rows[0].url) {
    throw httpError(404, "Tautan tidak ditemukan.");
  }
  await query("UPDATE linktree_items SET clicks = clicks + 1 WHERE id = ?", [rows[0].id]);
  return { url: rows[0].url };
};
