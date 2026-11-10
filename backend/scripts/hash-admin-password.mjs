// Membuat hash password admin untuk env ADMIN_PASSWORD_HASH.
// Pemakaian: node scripts/hash-admin-password.mjs
// Ketik password lalu Enter, lalu tekan Ctrl+Z dan Enter (Windows) atau Ctrl+D (Linux/macOS).
import { hashPassword } from "../src/services/admin-auth.service.js";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const password = Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");

if (password.length < 12) {
  console.error("Password minimal 12 karakter.");
  process.exit(1);
}

console.log(hashPassword(password));
