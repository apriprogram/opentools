import crypto from "crypto";

// Admin masuk dengan username + password (ADMIN_USERNAME, ADMIN_PASSWORD_HASH) dan menerima sesi berupa token.
// Token ditandatangani HMAC dengan ADMIN_KEY dan berlaku 12 jam. Header x-admin-key tetap menerima ADMIN_KEY langsung
// (untuk skrip dan akses cadangan).
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const signToken = (expiresAt) =>
  crypto.createHmac("sha256", process.env.ADMIN_KEY || "").update(`admin-session:${expiresAt}`).digest("hex");

export function issueAdminToken() {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  return `${expiresAt}.${signToken(expiresAt)}`;
}

export function verifyAdminToken(token) {
  if (!process.env.ADMIN_KEY) return false;
  const [expRaw, signature] = String(token || "").split(".");
  const expiresAt = Number(expRaw);
  if (!Number.isFinite(expiresAt) || !signature || expiresAt < Date.now()) return false;
  return safeEqual(signature, signToken(expiresAt));
}

export function isAdminRequest(req) {
  const given = String(req.get("x-admin-key") || "");
  if (!process.env.ADMIN_KEY || !given) return false;
  return safeEqual(given, process.env.ADMIN_KEY) || verifyAdminToken(given);
}

export function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_KEY) {
    return res.status(503).json({ success: false, message: "ADMIN_KEY belum diatur di server" });
  }
  if (!isAdminRequest(req)) {
    return res.status(401).json({ success: false, message: "Sesi admin tidak valid. Silakan masuk ulang." });
  }
  next();
}
