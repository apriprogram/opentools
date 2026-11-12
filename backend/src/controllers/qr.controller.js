import * as qr from "../services/qr.service.js";
import { renderNotaHtml, renderNotaPdf } from "../services/nota.service.js";
import { getPaymentSettings, savePaymentSettings } from "../services/settings.service.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = (res, error, label) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message });
  console.error(`${label} error:`, error);
  return res.status(500).json({ success: false, message: "Internal server error" });
};

export const getPlans = async (req, res) => {
  try {
    res.json({
      success: true,
      plans: Object.values(qr.PLANS),
      payment: await qr.getPaymentInfo()
    });
  } catch (error) {
    return fail(res, error, "QR plans");
  }
};

// Data statistik pesanan untuk super admin.
export const adminGetOrderStats = async (req, res) => {
  try {
    res.json({ success: true, plans: Object.values(qr.PLANS), orders: await qr.adminOrderStats() });
  } catch (error) {
    return fail(res, error, "Order stats");
  }
};

// Pengaturan metode pembayaran (khusus super admin).
export const adminGetPaymentSettings = async (req, res) => {
  try {
    res.json({ success: true, settings: await getPaymentSettings() });
  } catch (error) {
    return fail(res, error, "Payment settings");
  }
};

export const adminSavePaymentSettings = async (req, res) => {
  try {
    const body = req.body || {};
    const whatsapp = qr.normalizeWhatsapp(body.whatsapp);
    const settings = await savePaymentSettings({ dana: body.dana, bank: body.bank, whatsapp: whatsapp || "" });
    res.json({ success: true, settings });
  } catch (error) {
    return fail(res, error, "Save payment settings");
  }
};

export const createOrder = async (req, res) => {
  try {
    const { plan, name, email, whatsapp, design, qrId } = req.body || {};
    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim();
    if (cleanName.length < 2 || cleanName.length > 120) {
      return res.status(400).json({ success: false, message: "Nama wajib diisi (minimal 2 karakter)" });
    }
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 190) {
      return res.status(400).json({ success: false, message: "Email tidak valid" });
    }
    if (!qr.normalizeWhatsapp(whatsapp)) {
      return res.status(400).json({ success: false, message: "Nomor WhatsApp tidak valid. Contoh: 081234567890" });
    }
    const order = await qr.createOrder({ plan, name: cleanName, email: cleanEmail, whatsapp, design, qrId });
    res.status(201).json({ success: true, order, payment: await qr.getPaymentInfo() });
  } catch (error) {
    return fail(res, error, "Create QR order");
  }
};

export const lookupOrder = async (req, res) => {
  try {
    const { code, email } = req.body || {};
    if (!code || !email) {
      return res.status(400).json({ success: false, message: "Kode pesanan dan email wajib diisi" });
    }
    const order = await qr.lookupOrder(code, String(email).trim());
    if (!order) {
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan. Periksa kode dan email." });
    }
    res.json({ success: true, order });
  } catch (error) {
    return fail(res, error, "Lookup QR order");
  }
};

export const uploadProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Pilih file bukti transfer (JPG, PNG, atau WEBP)." });
    }
    const email = String(req.body?.email || "").trim();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: "Email wajib diisi sesuai pemesan." });
    }
    const order = await qr.submitProof({ code: req.params.code, email, buffer: req.file.buffer });
    res.json({ success: true, order, approved: order.status === "paid" });
  } catch (error) {
    return fail(res, error, "Upload QR proof");
  }
};

// Admin: nota pesanan (HTML untuk dilihat dan dicetak)
export const adminGetNota = async (req, res) => {
  try {
    const data = await qr.getNotaData(req.params.code);
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "no-store");
    res.send(renderNotaHtml(data));
  } catch (error) {
    return fail(res, error, "Admin nota");
  }
};

// Admin: nota pesanan dalam bentuk PDF
export const adminGetNotaPdf = async (req, res) => {
  try {
    const data = await qr.getNotaData(req.params.code);
    const pdf = await renderNotaPdf(data);
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `inline; filename="${data.noNota}.pdf"`);
    res.set("Cache-Control", "no-store");
    res.send(pdf);
  } catch (error) {
    return fail(res, error, "Admin nota pdf");
  }
};

export const adminGetProof = async (req, res) => {
  try {
    const data = await qr.getProof(req.params.code);
    res.set("Content-Type", "image/jpeg");
    res.set("Cache-Control", "no-store");
    res.send(data);
  } catch (error) {
    return fail(res, error, "Admin get proof");
  }
};

export const verifyLicense = async (req, res) => {
  try {
    const result = await qr.verifyLicense(req.body?.key);
    res.json({ success: true, ...result });
  } catch (error) {
    return fail(res, error, "Verify license");
  }
};

export const adminListOrders = async (req, res) => {
  try {
    const orders = await qr.listOrders(req.query.status);
    res.json({ success: true, orders });
  } catch (error) {
    return fail(res, error, "Admin list orders");
  }
};

export const adminConfirmOrder = async (req, res) => {
  try {
    const order = await qr.confirmOrder(req.params.code);
    res.json({ success: true, order });
  } catch (error) {
    return fail(res, error, "Admin confirm order");
  }
};

export const adminCancelOrder = async (req, res) => {
  try {
    const order = await qr.cancelOrder(req.params.code);
    res.json({ success: true, order });
  } catch (error) {
    return fail(res, error, "Admin cancel order");
  }
};

// Admin: nonaktifkan atau aktifkan lisensi (body: { active: true | false })
export const adminSetLicense = async (req, res) => {
  try {
    if (typeof req.body?.active !== "boolean") {
      return res.status(400).json({ success: false, message: "Nilai active harus true atau false." });
    }
    const order = await qr.setLicenseActive(req.params.code, req.body.active);
    res.json({ success: true, order });
  } catch (error) {
    return fail(res, error, "Admin set license");
  }
};

// Admin: hapus pesanan beserta lisensi dan bukti transfernya
export const adminDeleteOrder = async (req, res) => {
  try {
    await qr.deleteOrder(req.params.code);
    res.json({ success: true });
  } catch (error) {
    return fail(res, error, "Admin delete order");
  }
};
