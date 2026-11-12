import * as qr from "../services/qr.service.js";
import * as me from "../services/me.service.js";
import { renderNotaHtml, renderNotaPdf } from "../services/nota.service.js";
import { updateUserWhatsapp, updateUserProfile, changeUserPassword } from "../services/auth.service.js";
import { bearerToken } from "../middleware/auth.middleware.js";

const LINK_MAX = 2048;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
// Warna latar boleh juga "transparent" (QR tanpa bidang latar).
const BG_RE = /^(#[0-9a-fA-F]{6}|transparent)$/;

const fail = (res, error) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message });
  console.error("Me error:", error);
  return res.status(500).json({ success: false, message: "Terjadi kesalahan di server." });
};

export const myQr = async (req, res) => {
  try {
    res.json({ success: true, qr: await me.listUserQr(req.user) });
  } catch (error) {
    return fail(res, error);
  }
};

export const saveQr = async (req, res) => {
  try {
    const link = String(req.body?.link || "").trim();
    if (!link || link.length > LINK_MAX) {
      return res.status(400).json({ success: false, message: "Link wajib diisi (maksimal 2048 karakter)." });
    }
    const fg = String(req.body?.fg || "#000000");
    const bg = String(req.body?.bg || "#FFFFFF");
    if (!COLOR_RE.test(fg) || !BG_RE.test(bg)) {
      return res.status(400).json({ success: false, message: "Format warna tidak valid." });
    }
    if (fg.toLowerCase() === bg.toLowerCase()) {
      return res.status(400).json({ success: false, message: "Warna QR dan warna latar tidak boleh sama." });
    }
    const saved = await me.createUserQr(req.user, { link, fg, bg, logo: req.body?.logo !== false });
    return res.status(201).json({ success: true, qr: saved });
  } catch (error) {
    return fail(res, error);
  }
};

// Ubah link, warna, dan logo QR milik sendiri (hanya QR Premium yang aktif). Link boleh tidak dikirim (tidak berubah).
export const updateQr = async (req, res) => {
  try {
    const hasLink = req.body?.link !== undefined && req.body?.link !== null;
    const link = hasLink ? String(req.body.link).trim() : undefined;
    if (hasLink && (!link || link.length > LINK_MAX)) {
      return res.status(400).json({ success: false, message: "Link wajib diisi (maksimal 2048 karakter)." });
    }
    const fg = String(req.body?.fg || "");
    const bg = String(req.body?.bg || "");
    if (!COLOR_RE.test(fg) || !BG_RE.test(bg)) {
      return res.status(400).json({ success: false, message: "Format warna tidak valid." });
    }
    if (fg.toLowerCase() === bg.toLowerCase()) {
      return res.status(400).json({ success: false, message: "Warna QR dan warna latar tidak boleh sama." });
    }
    const saved = await me.updateUserQrDesign(req.user, req.params.id, { link, fg, bg, logo: req.body?.logo !== false });
    return res.json({ success: true, qr: saved });
  } catch (error) {
    return fail(res, error);
  }
};

// Nonaktifkan atau aktifkan lagi QR milik sendiri.
export const setQrActive = async (req, res) => {
  try {
    if (typeof req.body?.active !== "boolean") {
      return res.status(400).json({ success: false, message: "Status aktif wajib diisi." });
    }
    const qr = await me.setUserQrActive(req.user, req.params.id, req.body.active);
    return res.json({ success: true, qr });
  } catch (error) {
    return fail(res, error);
  }
};

export const removeQr = async (req, res) => {
  try {
    const ok = await me.deleteUserQr(req.user.id, req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: "QR tidak ditemukan." });
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error);
  }
};

export const myOrders = async (req, res) => {
  try {
    res.json({ success: true, orders: await qr.listOrdersByEmail(req.user.email) });
  } catch (error) {
    return fail(res, error);
  }
};

// Bukti transfer untuk pesanan milik pengguna yang sedang masuk.
export const myProof = async (req, res) => {
  try {
    const data = await qr.getProofForEmail(req.params.code, req.user.email);
    res.set("Content-Type", "image/jpeg");
    res.set("Cache-Control", "private, no-store");
    res.send(data);
  } catch (error) {
    return fail(res, error);
  }
};

// Simpan atau ubah nomor WhatsApp akun (dipakai untuk pesanan).
export const setWhatsapp = async (req, res) => {
  try {
    const whatsapp = qr.normalizeWhatsapp(req.body?.whatsapp);
    if (!whatsapp) {
      return res.status(400).json({ success: false, message: "Nomor WhatsApp tidak valid. Contoh: 081234567890." });
    }
    const user = await updateUserWhatsapp(req.user.id, whatsapp);
    return res.json({ success: true, user });
  } catch (error) {
    return fail(res, error);
  }
};

// Ubah profil akun: nama dan nomor WhatsApp.
export const updateProfile = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (name.length < 2 || name.length > 120) {
      return res.status(400).json({ success: false, message: "Nama wajib diisi (minimal 2 karakter)." });
    }
    const rawWhatsapp = String(req.body?.whatsapp || "").trim();
    const whatsapp = rawWhatsapp ? qr.normalizeWhatsapp(rawWhatsapp) : "";
    // Akun user wajib punya nomor WhatsApp (dipakai untuk pesanan). Super admin boleh kosong.
    if ((rawWhatsapp && !whatsapp) || (!rawWhatsapp && req.user.role !== "superadmin")) {
      return res.status(400).json({ success: false, message: "Nomor WhatsApp tidak valid. Contoh: 081234567890." });
    }
    const user = await updateUserProfile(req.user, {
      name,
      whatsapp,
      username: req.body?.username,
      email: req.body?.email,
      avatar: req.body?.avatar
    });
    return res.json({ success: true, user });
  } catch (error) {
    return fail(res, error);
  }
};

// Ganti password. Dibatasi 5 kali salah per 15 menit untuk tiap akun.
const PASSWORD_MAX_FAILURES = 5;
const PASSWORD_WINDOW_MS = 15 * 60 * 1000;
const passwordFailures = new Map();

export const changePassword = async (req, res) => {
  try {
    const key = req.user.id;
    const record = passwordFailures.get(key);
    if (record && Date.now() - record.first > PASSWORD_WINDOW_MS) passwordFailures.delete(key);
    if ((passwordFailures.get(key)?.count || 0) >= PASSWORD_MAX_FAILURES) {
      return res.status(429).json({ success: false, message: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." });
    }
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    if (!currentPassword) {
      return res.status(400).json({ success: false, message: "Password saat ini wajib diisi." });
    }
    if (newPassword.length < 8 || newPassword.length > 200) {
      return res.status(400).json({ success: false, message: "Password baru minimal 8 karakter." });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ success: false, message: "Password baru harus berbeda dari password saat ini." });
    }
    try {
      await changeUserPassword(req.user.id, currentPassword, newPassword, bearerToken(req));
    } catch (error) {
      if (error.status === 400) {
        const rec = passwordFailures.get(key);
        if (rec) rec.count += 1;
        else passwordFailures.set(key, { count: 1, first: Date.now() });
      }
      throw error;
    }
    passwordFailures.delete(key);
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error);
  }
};

// Nota pesanan milik pengguna (HTML untuk dilihat, PDF untuk diunduh).
export const myNota = async (req, res) => {
  try {
    const data = await qr.getNotaDataForEmail(req.params.code, req.user.email);
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "private, no-store");
    res.send(renderNotaHtml(data));
  } catch (error) {
    return fail(res, error);
  }
};

export const myNotaPdf = async (req, res) => {
  try {
    const data = await qr.getNotaDataForEmail(req.params.code, req.user.email);
    const pdf = await renderNotaPdf(data);
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `inline; filename="${data.noNota}.pdf"`);
    res.set("Cache-Control", "private, no-store");
    res.send(pdf);
  } catch (error) {
    return fail(res, error);
  }
};

export const myLicenses = async (req, res) => {
  try {
    res.json({ success: true, licenses: await qr.listLicensesByEmail(req.user.email) });
  } catch (error) {
    return fail(res, error);
  }
};
