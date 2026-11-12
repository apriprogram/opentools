import { query } from "../db/mysql.js";

// Pengaturan aplikasi yang bisa diubah super admin dari panel, disimpan di tabel app_settings.
// Isinya: metode pembayaran (DANA dan transfer bank, masing-masing bisa dinyalakan atau dimatikan),
// serta harga dan diskon tiap paket berbayar (lihat bagian "Harga paket" di bawah).
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

/* ── Harga paket ───────────────────────────────────────────────────────────
   Harga normal dan diskon tiap paket berbayar, diatur super admin dari halaman Pengaturan.
   Selama admin belum menyimpan apa pun, harga bawaan di bawah yang dipakai.
   Diskon: persen (1 sampai 90) atau potongan rupiah, boleh diberi tanggal berakhir (WIB). */
const PRICING_KEY = "pricing";
export const PRICE_MIN = 1000;
export const PRICE_MAX = 100000000;
const PERCENT_MAX = 90;
let pricingCache = null;

// Paket berbayar yang harganya bisa diatur. Label dan lama aktif tetap diatur di qr.service.js.
const PRICING_PLANS = {
  monthly: { label: "Bulanan", price: 30000 },
  yearly: { label: "Tahunan", price: 300000 }
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Tanggal hari ini menurut WIB (YYYY-MM-DD).
const todayWib = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
const wholeNumber = (value) => {
  const n = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? Math.floor(n) : 0;
};

const emptyDiscount = () => ({ enabled: false, type: "percent", value: 0, endsAt: null });

const mergeDiscount = (saved) => ({
  enabled: saved?.enabled === true,
  type: saved?.type === "amount" ? "amount" : "percent",
  value: Math.max(0, wholeNumber(saved?.value)),
  endsAt: typeof saved?.endsAt === "string" && DATE_RE.test(saved.endsAt) ? saved.endsAt : null
});

const mergePricing = (saved) => {
  const plans = {};
  for (const [id, base] of Object.entries(PRICING_PLANS)) {
    const s = saved?.plans?.[id];
    const price = wholeNumber(s?.price);
    plans[id] = {
      price: price >= PRICE_MIN && price <= PRICE_MAX ? price : base.price,
      discount: s?.discount ? mergeDiscount(s.discount) : emptyDiscount()
    };
  }
  return { plans };
};

/** Pengaturan harga lengkap (untuk halaman admin). */
export const getPricingSettings = async () => {
  if (pricingCache && Date.now() - pricingCache.at < CACHE_MS) return pricingCache.value;
  const rows = await query("SELECT value FROM app_settings WHERE name = ? LIMIT 1", [PRICING_KEY]);
  let saved = null;
  if (rows.length) {
    try {
      saved = JSON.parse(rows[0].value);
    } catch {
      saved = null;
    }
  }
  const value = mergePricing(saved);
  pricingCache = { at: Date.now(), value };
  return value;
};

// Besar potongan dalam rupiah untuk satu harga. Harga akhir tidak pernah di bawah PRICE_MIN.
const discountAmount = (price, discount) => {
  if (!discount?.enabled || !discount.value) return 0;
  const cut = discount.type === "amount" ? discount.value : Math.round((price * discount.value) / 100);
  return Math.max(0, Math.min(cut, price - PRICE_MIN));
};

/**
 * Harga yang berlaku sekarang untuk satu paket.
 * Mengembalikan { basePrice, price, discount } dengan discount null bila tidak ada diskon yang berlaku
 * (tidak dinyalakan, nilainya nol, atau tanggal berakhirnya sudah lewat).
 */
export const effectivePrice = (planPricing) => {
  const basePrice = planPricing.price;
  const d = planPricing.discount;
  const running = d?.enabled && d.value > 0 && (!d.endsAt || todayWib() <= d.endsAt);
  const cut = running ? discountAmount(basePrice, d) : 0;
  if (!cut) return { basePrice, price: basePrice, discount: null };
  return {
    basePrice,
    price: basePrice - cut,
    discount: { type: d.type, value: d.value, amount: cut, endsAt: d.endsAt }
  };
};

/** Simpan harga dan diskon. Semua paket dikirim sekaligus. */
export const savePricingSettings = async (input) => {
  const plans = {};
  for (const [id, base] of Object.entries(PRICING_PLANS)) {
    const s = input?.plans?.[id] || {};
    const price = wholeNumber(s.price);
    if (price < PRICE_MIN || price > PRICE_MAX) {
      throw httpError(400, `Harga paket ${base.label} harus antara Rp${PRICE_MIN.toLocaleString("id-ID")} dan Rp${PRICE_MAX.toLocaleString("id-ID")}.`);
    }
    const discount = mergeDiscount(s.discount);
    if (s.discount?.endsAt && !discount.endsAt) {
      throw httpError(400, `Tanggal berakhir diskon paket ${base.label} tidak valid.`);
    }
    if (discount.enabled) {
      if (discount.type === "percent" && (discount.value < 1 || discount.value > PERCENT_MAX)) {
        throw httpError(400, `Diskon paket ${base.label} harus antara 1% dan ${PERCENT_MAX}%.`);
      }
      if (discount.type === "amount" && (discount.value < 1 || price - discount.value < PRICE_MIN)) {
        throw httpError(
          400,
          `Potongan paket ${base.label} terlalu besar. Harga setelah diskon minimal Rp${PRICE_MIN.toLocaleString("id-ID")}.`
        );
      }
      if (discount.endsAt && discount.endsAt < todayWib()) {
        throw httpError(400, `Tanggal berakhir diskon paket ${base.label} sudah lewat. Pilih hari ini atau sesudahnya.`);
      }
    }
    plans[id] = { price, discount };
  }

  await query(
    "INSERT INTO app_settings (name, value, updated_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = VALUES(updated_at)",
    [PRICING_KEY, JSON.stringify({ plans }), new Date()]
  );
  pricingCache = null;
  return getPricingSettings();
};
