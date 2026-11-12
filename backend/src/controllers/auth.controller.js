import {
  createUser,
  checkLogin,
  createSession,
  deleteSession,
  publicUser,
  adminListUsers,
  impersonateUser,
  adminDeleteUser
} from "../services/auth.service.js";
import { bearerToken } from "../middleware/auth.middleware.js";
import { normalizeWhatsapp } from "../services/qr.service.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const loginId = String(req.body?.login || "").trim();
    const password = String(req.body?.password || "");
    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: "Email atau username dan password wajib diisi." });
    }
    const row = await checkLogin(loginId, password);
    if (!row) {
      return res.status(401).json({ success: false, message: "Email/username atau password salah." });
    }
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

// Daftar pengguna untuk super admin.
export const adminUsers = async (req, res) => {
  try {
    return res.json({ success: true, users: await adminListUsers() });
  } catch (error) {
    return fail(res, error);
  }
};

// Hapus akun pengguna beserta datanya. ?orders=0 mempertahankan riwayat pesanannya.
export const adminRemoveUser = async (req, res) => {
  try {
    if (req.user?.role !== "superadmin" || req.user.impersonated) {
      return res.status(403).json({ success: false, message: "Masuk sebagai super admin terlebih dahulu." });
    }
    const result = await adminDeleteUser(req.user, req.params.id, { deleteOrders: req.query.orders !== "0" });
    return res.json({ success: true, ...result });
  } catch (error) {
    return fail(res, error);
  }
};

// Super admin masuk sebagai pengguna. Hanya lewat sesi super admin (bukan kunci admin cadangan),
// supaya selalu tercatat siapa yang melakukannya.
export const adminImpersonate = async (req, res) => {
  try {
    if (req.user?.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Masuk sebagai super admin terlebih dahulu." });
    }
    if (req.user.impersonated) {
      return res.status(403).json({ success: false, message: "Sesi ini tidak bisa dipakai untuk masuk sebagai pengguna lain." });
    }
    const session = await impersonateUser(req.user, req.params.id);
    return res.json({ success: true, ...session });
  } catch (error) {
    return fail(res, error);
  }
};
