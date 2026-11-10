import {
  createUser,
  checkLogin,
  createSession,
  deleteSession,
  publicUser
} from "../services/auth.service.js";
import { bearerToken } from "../middleware/auth.middleware.js";
import { normalizeWhatsapp } from "../services/qr.service.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map();

const clientKey = (req) => String(req.get("cf-connecting-ip") || req.ip || "unknown");

const isBlocked = (key) => {
  const rec = failures.get(key);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return rec.count >= MAX_FAILURES;
};

const recordFailure = (key) => {
  const rec = failures.get(key);
  if (!rec || Date.now() - rec.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else rec.count += 1;
};

const fail = (res, error) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message });
  console.error("Auth error:", error);
  return res.status(500).json({ success: false, message: "Terjadi kesalahan di server." });
};

// Daftar akun pengguna baru (peran user). Setelah daftar langsung masuk.
export const register = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    if (name.length < 2 || name.length > 120) {
      return res.status(400).json({ success: false, message: "Nama wajib diisi (minimal 2 karakter)." });
    }
    if (!EMAIL_RE.test(email) || email.length > 190) {
      return res.status(400).json({ success: false, message: "Email tidak valid." });
    }
    if (password.length < 8 || password.length > 200) {
      return res.status(400).json({ success: false, message: "Password minimal 8 karakter." });
    }
    const whatsapp = normalizeWhatsapp(req.body?.whatsapp);
    if (!whatsapp) {
      return res.status(400).json({ success: false, message: "Nomor WhatsApp wajib diisi. Contoh: 081234567890." });
    }
    const user = await createUser({ name, email, password, whatsapp });
    const session = await createSession(user.id);
    return res.status(201).json({ success: true, token: session.token, expiresAt: session.expiresAt, user });
  } catch (error) {
    return fail(res, error);
  }
};

// Masuk untuk pengguna (email) dan super admin (username).
export const login = async (req, res) => {
  try {
    const key = clientKey(req);
    if (isBlocked(key)) {
      return res.status(429).json({ success: false, message: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." });
    }
    const loginId = String(req.body?.login || "").trim();
    const password = String(req.body?.password || "");
    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: "Email atau username dan password wajib diisi." });
    }
    const row = await checkLogin(loginId, password);
    if (!row) {
      recordFailure(key);
      return res.status(401).json({ success: false, message: "Email/username atau password salah." });
    }
    failures.delete(key);
    const session = await createSession(row.id);
    return res.json({ success: true, token: session.token, expiresAt: session.expiresAt, user: publicUser(row) });
  } catch (error) {
    return fail(res, error);
  }
};

export const logout = async (req, res) => {
  try {
    await deleteSession(bearerToken(req));
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error);
  }
};

export const me = (req, res) => {
  res.json({ success: true, user: req.user });
};
