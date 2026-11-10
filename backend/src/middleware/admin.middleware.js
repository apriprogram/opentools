import crypto from "crypto";
import { sessionUser } from "./auth.middleware.js";

// Akses admin diterima dari tiga cara:
// 1. Sesi super admin (token dari halaman masuk), lewat header Authorization.
// 2. Token admin lama (HMAC dengan ADMIN_KEY) lewat header x-admin-key.
// 3. ADMIN_KEY langsung lewat header x-admin-key (untuk skrip dan akses cadangan).
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

export async function requireAdmin(req, res, next) {
  try {
    if (isAdminRequest(req)) return next();
    const user = await sessionUser(req);
    if (user && user.role === "superadmin") {
      req.user = user;
      return next();
    }
    return res.status(401).json({ success: false, message: "Sesi admin tidak valid. Silakan masuk ulang." });
  } catch (error) {
    return next(error);
  }
}
