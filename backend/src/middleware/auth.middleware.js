import { getSessionUser } from "../services/auth.service.js";

// Token sesi dikirim lewat header Authorization: Bearer <token>.
export const bearerToken = (req) => {
  const header = String(req.get("authorization") || "");
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
};

export const sessionUser = (req) => getSessionUser(bearerToken(req));

export async function requireUser(req, res, next) {
  try {
    const user = await sessionUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Silakan masuk terlebih dahulu." });
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
