import * as qr from "../services/qr.service.js";
import * as me from "../services/me.service.js";
import { renderNotaHtml, renderNotaPdf } from "../services/nota.service.js";
import { updateUserWhatsapp } from "../services/auth.service.js";

const LINK_MAX = 2048;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

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
    if (!COLOR_RE.test(fg) || !COLOR_RE.test(bg)) {
      return res.status(400).json({ success: false, message: "Format warna tidak valid." });
    }
    const saved = await me.createUserQr(req.user, { link, fg, bg, logo: req.body?.logo !== false });
    return res.status(201).json({ success: true, qr: saved });
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
