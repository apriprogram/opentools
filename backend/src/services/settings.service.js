import { query } from "../db/mysql.js";

// Pengaturan aplikasi yang bisa diubah super admin dari panel, disimpan di tabel app_settings.
// Saat ini: metode pembayaran (DANA dan transfer bank, masing-masing bisa dinyalakan atau dimatikan).
// Selama admin belum menyimpan apa pun, nilai bawaan diambil dari environment (PAY_DANA_NUMBER dan lainnya).

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const PAYMENT_KEY = "payment";
const CACHE_MS = 30 * 1000;
let cache = null;

const paymentDefaults = () => ({
  dana: {
    enabled: true,
    number: process.env.PAY_DANA_NUMBER || "085188009152",
    name: process.env.PAY_DANA_NAME || ""
  },
  bank: { enabled: false, bankName: "", accountNumber: "", accountName: "" },
  whatsapp: process.env.PAY_WHATSAPP || "6282181361433"
});

const text = (value, max) => String(value ?? "").trim().slice(0, max);
const digits = (value) => String(value ?? "").replace(/[\s.-]/g, "");

// Gabungkan nilai tersimpan dengan bawaan, supaya kolom baru tetap punya nilai.
const mergePayment = (saved) => {
  const base = paymentDefaults();
  if (!saved || typeof saved !== "object") return base;
  return {
    dana: {
      enabled: saved.dana?.enabled !== false,
      number: text(saved.dana?.number, 20) || base.dana.number,
      name: text(saved.dana?.name, 120)
    },
    bank: {
      enabled: saved.bank?.enabled === true,
      bankName: text(saved.bank?.bankName, 60),
      accountNumber: text(saved.bank?.accountNumber, 30),
      accountName: text(saved.bank?.accountName, 120)
    },
    whatsapp: text(saved.whatsapp, 20) || base.whatsapp
  };
};

/** Pengaturan pembayaran lengkap (untuk halaman admin). */
export const getPaymentSettings = async () => {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const rows = await query("SELECT value FROM app_settings WHERE name = ? LIMIT 1", [PAYMENT_KEY]);
  let saved = null;
  if (rows.length) {
    try {
      saved = JSON.parse(rows[0].value);
    } catch {
      saved = null;
    }
  }
  const value = mergePayment(saved);
  cache = { at: Date.now(), value };
  return value;
};

/**
 * Simpan pengaturan pembayaran. Metode yang dinyalakan wajib lengkap datanya,
 * dan minimal satu metode harus menyala supaya pembeli tetap bisa membayar.
 * whatsapp sudah dinormalkan pemanggil (format 62...).
 */
export const savePaymentSettings = async (input) => {
  const dana = {
    enabled: input?.dana?.enabled === true,
    number: digits(input?.dana?.number).slice(0, 20),
    name: text(input?.dana?.name, 120)
  };
  const bank = {
    enabled: input?.bank?.enabled === true,
    bankName: text(input?.bank?.bankName, 60),
    accountNumber: digits(input?.bank?.accountNumber).slice(0, 30),
    accountName: text(input?.bank?.accountName, 120)
  };
  const whatsapp = text(input?.whatsapp, 20);

  if (!dana.enabled && !bank.enabled) {
    throw httpError(400, "Minimal satu metode pembayaran harus aktif, supaya pembeli bisa membayar.");
  }
  // Nomor DANA wajib benar saat metodenya aktif. Saat dimatikan boleh kosong, tetapi kalau diisi tetap harus angka.
  if ((dana.enabled || dana.number) && !/^0\d{8,14}$/.test(dana.number)) {
    throw httpError(400, "Nomor DANA tidak valid. Contoh: 085188009152.");
  }
  if (bank.enabled) {
    if (bank.bankName.length < 2) throw httpError(400, "Nama bank wajib diisi. Contoh: BCA.");
    if (!/^\d{5,30}$/.test(bank.accountNumber)) throw httpError(400, "Nomor rekening wajib diisi dan hanya berisi angka.");
    if (bank.accountName.length < 2) throw httpError(400, "Nama pemilik rekening wajib diisi.");
  } else if (bank.accountNumber && !/^\d{5,30}$/.test(bank.accountNumber)) {
    throw httpError(400, "Nomor rekening hanya boleh berisi angka.");
  }
  if (!whatsapp) throw httpError(400, "Nomor WhatsApp konfirmasi tidak valid. Contoh: 085188009152.");

  const value = { dana, bank, whatsapp };
  await query(
    "INSERT INTO app_settings (name, value, updated_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = VALUES(updated_at)",
    [PAYMENT_KEY, JSON.stringify(value), new Date()]
  );
  cache = null;
  return getPaymentSettings();
};

/**
 * Info pembayaran untuk pembeli: hanya metode yang aktif.
 * method, number, dan name (metode pertama) dipertahankan untuk tampilan lama.
 */
export const getPaymentInfo = async () => {
  const s = await getPaymentSettings();
  const methods = [];
  if (s.dana.enabled) {
    methods.push({ id: "dana", label: "DANA", title: "Transfer DANA", number: s.dana.number, name: s.dana.name });
  }
  if (s.bank.enabled) {
    methods.push({
      id: "bank",
      label: s.bank.bankName ? `Bank ${s.bank.bankName}` : "Transfer bank",
      title: s.bank.bankName ? `Transfer bank ${s.bank.bankName}` : "Transfer bank",
      bankName: s.bank.bankName,
      number: s.bank.accountNumber,
      name: s.bank.accountName
    });
  }
  const first = methods[0] || { title: "Transfer", number: "", name: "" };
  return { methods, whatsapp: s.whatsapp, method: first.title, number: first.number, name: first.name };
};
