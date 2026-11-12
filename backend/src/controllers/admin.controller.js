import crypto from "crypto";
import { issueAdminToken } from "../middleware/admin.middleware.js";
import { verifyPassword } from "../services/admin-auth.service.js";


const sameText = (a, b) => {
  const x = Buffer.from(a.toLowerCase());
  const y = Buffer.from(b.toLowerCase());
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export const adminLogin = (req, res) => {
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
    return res.status(401).json({ success: false, message: "Username atau password salah." });
  }

  return res.json({ success: true, token: issueAdminToken(), expiresInHours: 12 });
};
