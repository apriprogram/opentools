import crypto from "crypto";

// Hash password admin memakai scrypt. Format tersimpan: scrypt$<salt base64>$<hash base64>
const SCRYPT = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, KEY_LENGTH, SCRYPT);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = crypto.scryptSync(String(password), Buffer.from(saltB64, "base64"), expected.length, SCRYPT);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
