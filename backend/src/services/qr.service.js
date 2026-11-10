import crypto from "crypto";
import { pool, query } from "../db/mysql.js";
import {
  MAX_PROOF_ATTEMPTS,
  normalizeProof,
  sha256Hex,
  analyzeProof,
  decideProof
} from "./proof.service.js";
import { buildNotaData, notaPeriod, formatNotaNumber } from "./nota.service.js";

// Paket QR Generator (pembayaran transfer, dikonfirmasi admin atau otomatis dari bukti).
export const PLANS = {
  monthly: { id: "monthly", label: "Bulanan", price: 15000, days: 30, note: "Aktif 30 hari" },
  yearly: { id: "yearly", label: "Tahunan", price: 100000, days: 365, note: "Aktif 365 hari, hemat Rp80.000" }
};

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa 0/O/1/I agar mudah dibaca

const randomChars = (length) => {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHA[crypto.randomInt(0, ALPHA.length)];
  return out;
};

const iso = (d) => (d instanceof Date ? d.toISOString() : d);

// Nomor WhatsApp pembeli dinormalisasi ke format 62xxxxxxxxxx. Mengembalikan null jika tidak valid.
export const normalizeWhatsapp = (input) => {
  let digits = String(input || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  return /^628\d{7,11}$/.test(digits) ? digits : null;
};

export const getPaymentInfo = () => ({
  method: "Transfer DANA",
  number: process.env.PAY_DANA_NUMBER || "082181361433",
  name: process.env.PAY_DANA_NAME || "",
  whatsapp: process.env.PAY_WHATSAPP || "6282181361433"
});

// Kolom pesanan tanpa data gambar (proof_data), agar daftar pesanan tetap ringan.
const ORDER_COLUMNS = `code, plan, price, unique_code, amount, name, email, wa_number, nota_number, status, license_key, created_at, paid_at,
  verify_status, verify_note, verify_amount, proof_uploaded_at, proof_attempts, (proof_data IS NOT NULL) AS has_proof,
  (SELECT l.revoked FROM qr_licenses l WHERE l.order_code = qr_orders.code LIMIT 1) AS license_revoked,
  (SELECT l.expires_at FROM qr_licenses l WHERE l.order_code = qr_orders.code LIMIT 1) AS license_expires_at`;

// Status lisensi pesanan lunas: aktif, nonaktif (dimatikan admin), atau berakhir.
const licenseStateOf = (row) => {
  if (row.license_revoked === undefined && row.license_expires_at === undefined) return null;
  if (row.license_revoked === null && row.license_expires_at === null) return "tidak_ada";
  if (Number(row.license_revoked) === 1) return "nonaktif";
  return new Date(row.license_expires_at).getTime() > Date.now() ? "aktif" : "berakhir";
};

const toOrder = (row, { withLicense = false } = {}) => ({
  code: row.code,
  plan: row.plan,
  planLabel: PLANS[row.plan]?.label || row.plan,
  price: row.price,
  uniqueCode: row.unique_code,
  amount: row.amount,
  name: row.name,
  email: row.email,
  whatsapp: row.wa_number || null,
  notaNumber: row.nota_number || null,
  status: row.status,
  createdAt: iso(row.created_at),
  paidAt: row.paid_at ? iso(row.paid_at) : null,
  licenseKey: withLicense && row.status === "paid" ? row.license_key : null,
  verifyStatus: row.verify_status || "none",
  verifyNote: row.verify_note || null,
  verifyAmount: row.verify_amount ?? null,
  proofUploadedAt: row.proof_uploaded_at ? iso(row.proof_uploaded_at) : null,
  proofAttempts: row.proof_attempts || 0,
  maxProofAttempts: MAX_PROOF_ATTEMPTS,
  hasProof: Boolean(row.has_proof),
  licenseState: row.status === "paid" ? licenseStateOf(row) : null
});

export const createOrder = async ({ plan, name, email, whatsapp }) => {
  const p = PLANS[plan];
  if (!p) throw httpError(400, "Paket tidak valid");
  const waNumber = normalizeWhatsapp(whatsapp);
  if (!waNumber) throw httpError(400, "Nomor WhatsApp tidak valid. Contoh: 081234567890");

  // Kode unik 1-99 ditambahkan ke harga agar transfer mudah dicocokkan.
  const uniqueCode = crypto.randomInt(1, 100);
  const amount = p.price + uniqueCode;

  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    code = `OT${randomChars(6)}`;
    const exists = await query("SELECT code FROM qr_orders WHERE code = ? LIMIT 1", [code]);
    if (!exists.length) break;
  }

  await query(
    `INSERT INTO qr_orders (code, plan, price, unique_code, amount, name, email, wa_number, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [code, plan, p.price, uniqueCode, amount, name, email, waNumber, new Date()]
  );

  await assignNotaNumber(code, new Date());
  const rows = await query(`SELECT ${ORDER_COLUMNS} FROM qr_orders WHERE code = ?`, [code]);
  return toOrder(rows[0]);
};

// Nomor nota INV-YYYYMM-NNN, urut per bulan (WIB). Pesanan lama diberi nomor saat nota pertama kali dibuka.
export const assignNotaNumber = async (code, createdAt) => {
  const period = notaPeriod(createdAt);
  for (let attempt = 0; attempt < 5; attempt++) {
    const [{ n }] = await query("SELECT COUNT(*) AS n FROM qr_orders WHERE nota_number LIKE ?", [`INV-${period}-%`]);
    const number = formatNotaNumber(period, Number(n) + 1 + attempt);
    const taken = await query("SELECT code FROM qr_orders WHERE nota_number = ? LIMIT 1", [number]);
    if (taken.length) continue;
    await query("UPDATE qr_orders SET nota_number = ? WHERE code = ? AND nota_number IS NULL", [number, code]);
    const check = await query("SELECT nota_number FROM qr_orders WHERE code = ?", [code]);
    if (check[0]?.nota_number) return check[0].nota_number;
  }
  throw httpError(500, "Gagal membuat nomor nota");
};

// Data nota untuk satu pesanan (dipakai untuk tampilan HTML dan PDF).
const notaFromRows = async (rows) => {
  if (!rows.length) throw httpError(404, "Pesanan tidak ditemukan");
  const order = toOrder(rows[0]);
  const notaNumber = order.notaNumber || (await assignNotaNumber(order.code, order.createdAt));
  const pay = getPaymentInfo();
  return buildNotaData(order, {
    notaNumber,
    planDays: PLANS[order.plan]?.days || 0,
    dana: { method: pay.method, number: pay.number, name: pay.name }
  });
};

export const getNotaData = async (code) => {
  const rows = await query(`SELECT ${ORDER_COLUMNS} FROM qr_orders WHERE code = ? LIMIT 1`, [
    String(code).trim().toUpperCase()
  ]);
  return notaFromRows(rows);
};

// Nota milik pengguna: hanya bila email akun cocok dengan email pesanan.
export const getNotaDataForEmail = async (code, email) => {
  const rows = await query(
    `SELECT ${ORDER_COLUMNS} FROM qr_orders WHERE code = ? AND LOWER(email) = LOWER(?) LIMIT 1`,
    [String(code).trim().toUpperCase(), email]
  );
  return notaFromRows(rows);
};

export const lookupOrder = async (code, email) => {
  const rows = await query(
    `SELECT ${ORDER_COLUMNS} FROM qr_orders WHERE code = ? AND LOWER(email) = LOWER(?) LIMIT 1`,
    [String(code).trim().toUpperCase(), email]
  );
  if (!rows.length) return null;
  return toOrder(rows[0], { withLicense: true });
};

// Pembeli unggah bukti transfer. Bukti dianalisa; jika lolos semua pemeriksaan, lisensi langsung aktif.
export const submitProof = async ({ code, email, buffer }) => {
  const orderCode = String(code).trim().toUpperCase();
  const rows = await query(
    `SELECT ${ORDER_COLUMNS} FROM qr_orders WHERE code = ? AND LOWER(email) = LOWER(?) LIMIT 1`,
    [orderCode, email]
  );
  if (!rows.length) throw httpError(404, "Pesanan tidak ditemukan. Periksa kode dan email.");
  const order = rows[0];
  if (order.status === "paid") throw httpError(409, "Pesanan ini sudah lunas.");
  if (order.status === "cancelled") throw httpError(409, "Pesanan ini sudah dibatalkan.");
  if ((order.proof_attempts || 0) >= MAX_PROOF_ATTEMPTS) {
    throw httpError(429, `Batas unggah bukti (${MAX_PROOF_ATTEMPTS} kali) sudah tercapai. Hubungi admin lewat WhatsApp.`);
  }

  const normalized = await normalizeProof(buffer);
  const hash = sha256Hex(normalized);

  // Simpan bukti dan hitung percobaan sebelum analisa, agar percobaan yang gagal tetap tercatat.
  await query(
    `UPDATE qr_orders
     SET proof_data = ?, proof_hash = ?, proof_uploaded_at = ?, proof_attempts = proof_attempts + 1, verify_status = 'checking'
     WHERE code = ?`,
    [normalized, hash, new Date(), order.code]
  );

  const duplicates = await query("SELECT code FROM qr_orders WHERE proof_hash = ? AND code <> ? LIMIT 1", [hash, order.code]);

  let decision;
  let detail = null;
  if (duplicates.length) {
    decision = {
      status: "rejected",
      note: "Bukti ini sudah pernah dipakai untuk pesanan lain. Unggah bukti transfer Anda sendiri."
    };
  } else {
    const result = await analyzeProof(normalized);
    if (!result.ok) console.warn(`[QR proof] analisa gagal untuk ${order.code}: ${result.error}`);
    detail = result.ok ? result.data : { error: result.error };
    decision = decideProof({
      analysis: result.ok ? result.data : null,
      order: { amount: order.amount, createdAt: order.created_at },
      danaNumber: getPaymentInfo().number
    });
  }

  await query(
    "UPDATE qr_orders SET verify_status = ?, verify_note = ?, verify_amount = ?, verify_detail = ? WHERE code = ?",
    [
      decision.status,
      decision.note,
      detail?.amountIdr ?? null,
      detail ? JSON.stringify(detail) : null,
      order.code
    ]
  );

  if (decision.status === "approved") {
    try {
      await confirmOrder(order.code);
    } catch (error) {
      console.error(`[QR proof] aktivasi otomatis gagal untuk ${order.code}:`, error);
      await query(
        "UPDATE qr_orders SET verify_status = 'review', verify_note = ? WHERE code = ?",
        ["Bukti valid, tetapi aktivasi otomatis gagal. Admin akan memprosesnya.", order.code]
      );
    }
  }

  const updated = await query(`SELECT ${ORDER_COLUMNS} FROM qr_orders WHERE code = ?`, [order.code]);
  return toOrder(updated[0], { withLicense: true });
};

// Admin: ambil gambar bukti transfer.
export const getProof = async (code) => {
  const rows = await query("SELECT proof_data FROM qr_orders WHERE code = ? LIMIT 1", [
    String(code).trim().toUpperCase()
  ]);
  if (!rows.length || !rows[0].proof_data) throw httpError(404, "Bukti tidak ditemukan");
  return rows[0].proof_data;
};

// Bukti transfer milik pengguna: hanya bila email akun cocok dengan email pesanan.
export const getProofForEmail = async (code, email) => {
  const rows = await query(
    "SELECT proof_data FROM qr_orders WHERE code = ? AND LOWER(email) = LOWER(?) LIMIT 1",
    [String(code).trim().toUpperCase(), email]
  );
  if (!rows.length || !rows[0].proof_data) throw httpError(404, "Bukti tidak ditemukan");
  return rows[0].proof_data;
};

export const verifyLicense = async (key) => {
  const rows = await query(
    "SELECT plan, expires_at, revoked FROM qr_licenses WHERE license_key = ? LIMIT 1",
    [String(key || "").trim().toUpperCase()]
  );
  if (!rows.length || rows[0].revoked) return { valid: false };
  const lic = rows[0];
  const expires = new Date(lic.expires_at);
  const planLabel = PLANS[lic.plan]?.label || lic.plan;
  if (expires.getTime() <= Date.now()) {
    return { valid: false, expired: true, plan: lic.plan, planLabel, expiresAt: expires.toISOString() };
  }
  return { valid: true, plan: lic.plan, planLabel, expiresAt: expires.toISOString() };
};

const newLicenseKey = () => `OTP-${randomChars(4)}-${randomChars(4)}-${randomChars(4)}-${randomChars(4)}`;

// Tandai pesanan lunas dan terbitkan kode lisensi (dipakai admin maupun aktivasi otomatis).
export const confirmOrder = async (code) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT code, plan, email, status FROM qr_orders WHERE code = ? FOR UPDATE", [code]);
    if (!rows.length) throw httpError(404, "Pesanan tidak ditemukan");
    const order = rows[0];
    if (order.status === "paid") throw httpError(409, "Pesanan sudah dikonfirmasi");
    if (order.status === "cancelled") throw httpError(409, "Pesanan sudah dibatalkan");

    const plan = PLANS[order.plan];
    const now = new Date();
    const expires = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);
    let key = newLicenseKey();
    for (let attempt = 0; attempt < 5; attempt++) {
      const [dup] = await conn.query("SELECT license_key FROM qr_licenses WHERE license_key = ?", [key]);
      if (!dup.length) break;
      key = newLicenseKey();
    }

    await conn.query(
      "INSERT INTO qr_licenses (license_key, plan, email, order_code, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
      [key, order.plan, order.email, order.code, now, expires]
    );
    await conn.query(
      "UPDATE qr_orders SET status = 'paid', license_key = ?, paid_at = ? WHERE code = ?",
      [key, now, order.code]
    );
    await conn.commit();
    const updated = await query(`SELECT ${ORDER_COLUMNS} FROM qr_orders WHERE code = ?`, [order.code]);
    return toOrder(updated[0], { withLicense: true });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const cancelOrder = async (code) => {
  const rows = await query("SELECT status FROM qr_orders WHERE code = ?", [code]);
  if (!rows.length) throw httpError(404, "Pesanan tidak ditemukan");
  if (rows[0].status === "paid") throw httpError(409, "Pesanan yang sudah lunas tidak bisa dibatalkan");
  await query("UPDATE qr_orders SET status = 'cancelled' WHERE code = ?", [code]);
  const updated = await query(`SELECT ${ORDER_COLUMNS} FROM qr_orders WHERE code = ?`, [code]);
  return toOrder(updated[0], { withLicense: true });
};

// Pesanan milik pengguna (dicocokkan dari email akun).
export const listOrdersByEmail = async (email) => {
  if (!email) return [];
  const rows = await query(
    `SELECT ${ORDER_COLUMNS} FROM qr_orders WHERE LOWER(email) = LOWER(?) ORDER BY created_at DESC LIMIT 100`,
    [email]
  );
  return rows.map((r) => toOrder(r, { withLicense: true }));
};

// Lisensi milik pengguna, termasuk tanggal berakhir untuk hitung mundur.
export const listLicensesByEmail = async (email) => {
  if (!email) return [];
  const rows = await query(
    "SELECT license_key, plan, created_at, expires_at, revoked FROM qr_licenses WHERE LOWER(email) = LOWER(?) ORDER BY expires_at DESC LIMIT 50",
    [email]
  );
  const now = Date.now();
  return rows.map((l) => ({
    licenseKey: l.license_key,
    plan: l.plan,
    planLabel: PLANS[l.plan]?.label || l.plan,
    createdAt: iso(l.created_at),
    expiresAt: iso(l.expires_at),
    status: l.revoked ? "nonaktif" : new Date(l.expires_at).getTime() > now ? "aktif" : "berakhir",
    active: !l.revoked && new Date(l.expires_at).getTime() > now
  }));
};

// Admin: nonaktifkan atau aktifkan lisensi pesanan lunas. Kode dan barcode tetap sama.
export const setLicenseActive = async (code, active) => {
  const rows = await query("SELECT code, status FROM qr_orders WHERE code = ? LIMIT 1", [code]);
  if (!rows.length) throw httpError(404, "Pesanan tidak ditemukan");
  if (rows[0].status !== "paid") throw httpError(409, "Pesanan belum lunas, jadi belum ada lisensi.");
  const result = await query("UPDATE qr_licenses SET revoked = ? WHERE order_code = ?", [active ? 0 : 1, code]);
  if (!result.affectedRows) throw httpError(404, "Lisensi untuk pesanan ini tidak ditemukan");
  const updated = await query(`SELECT ${ORDER_COLUMNS} FROM qr_orders WHERE code = ?`, [code]);
  return toOrder(updated[0], { withLicense: true });
};

// Admin: hapus pesanan beserta bukti dan lisensinya. Akun pembeli ikut kehilangan datanya.
export const deleteOrder = async (code) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT code FROM qr_orders WHERE code = ? FOR UPDATE", [code]);
    if (!rows.length) throw httpError(404, "Pesanan tidak ditemukan");
    await conn.query("DELETE FROM qr_licenses WHERE order_code = ?", [code]);
    await conn.query("DELETE FROM qr_orders WHERE code = ?", [code]);
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const listOrders = async (status) => {
  const allowed = ["pending", "paid", "cancelled"];
  const rows = allowed.includes(status)
    ? await query(`SELECT ${ORDER_COLUMNS} FROM qr_orders WHERE status = ? ORDER BY created_at DESC LIMIT 300`, [status])
    : await query(`SELECT ${ORDER_COLUMNS} FROM qr_orders ORDER BY created_at DESC LIMIT 300`);
  return rows.map((r) => toOrder(r, { withLicense: true }));
};

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
