import crypto from "crypto";
import { issueAdminToken } from "../middleware/admin.middleware.js";
import { verifyPassword } from "../services/admin-auth.service.js";

// Batasi percobaan login: 5 kali gagal per IP dalam 15 menit.
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
  if (!rec || Date.now() - rec.first > WINDOW_MS) {
    failures.set(key, { count: 1, first: Date.now() });
  } else {
    rec.count += 1;
  }
};

const sameText = (a, b) => {
  const x = Buffer.from(a.toLowerCase());
  const y = Buffer.from(b.toLowerCase());
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export const adminLogin = (req, res) => {
  const key = clientKey(req);
  if (isBlocked(key)) {
    return res.status(429).json({ success: false, message: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." });
  }

  const expectedUser = process.env.ADMIN_USERNAME || "";
  const storedHash = process.env.ADMIN_PASSWORD_HASH || "";
  if (!process.env.ADMIN_KEY || !expectedUser || !storedHash) {
    return res.status(503).json({
      success: false,
      message: "Login admin belum diatur di server (ADMIN_KEY, ADMIN_USERNAME, ADMIN_PASSWORD_HASH)."
    });
  }

  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  const userOk = username.length > 0 && sameText(username, expectedUser);
  const passOk = verifyPassword(password, storedHash);

  if (!userOk || !passOk) {
    recordFailure(key);
    return res.status(401).json({ success: false, message: "Username atau password salah." });
  }

  failures.delete(key);
  return res.json({ success: true, token: issueAdminToken(), expiresInHours: 12 });
};
