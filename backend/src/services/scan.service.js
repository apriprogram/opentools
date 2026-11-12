import crypto from "crypto";
import { query } from "../db/mysql.js";

// QR dinamis: gambar QR berisi alamat pendek /api/q/<kode>, lalu server meneruskan ke link tujuan.
// Dengan begitu pemilik bisa menonaktifkan QR atau mengganti link tanpa mencetak ulang gambarnya.

// Tanpa huruf dan angka yang mirip (i, l, o, 0, 1), supaya kode mudah dibaca bila perlu diketik.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const SCAN_CODE_RE = /^[a-z0-9]{6,12}$/;

export const newScanCode = (length = 8) =>
  [...crypto.randomBytes(length)].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");

// Skema yang boleh dituju langsung. Isi lain (teks biasa atau skema lain) ditampilkan sebagai teks, tidak dialihkan.
const REDIRECT_RE = /^(https?:\/\/|mailto:|tel:)\S+$/i;
export const isRedirectable = (link) => REDIRECT_RE.test(String(link || "").trim());

/** Data QR untuk satu kode pindai: { link, disabled } atau null bila kodenya tidak ada. */
export const findScanTarget = async (code) => {
  if (!SCAN_CODE_RE.test(String(code || ""))) return null;
  const rows = await query("SELECT link, disabled FROM user_qr WHERE code = ? LIMIT 1", [code]);
  if (!rows.length) return null;
  return { link: String(rows[0].link || "").trim(), disabled: Number(rows[0].disabled) === 1 };
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Halaman mandiri (tanpa aplikasi React) dengan logo Garudanexa, dipakai saat QR tidak bisa diteruskan:
 * QR dinonaktifkan pemiliknya, QR sudah dihapus, atau isi QR berupa teks biasa.
 * body: teks biasa yang ditampilkan apa adanya (sudah di-escape di sini).
 */
export const renderScanPage = ({ title, message, body = "" }) => `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex, nofollow" />
<title>${escapeHtml(title)} · OpenTools</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root { --page: #FAFAFA; --card: #FFFFFF; --border: #E4E4E7; --primary: #18181B; --secondary: #52525B; --tertiary: #A1A1AA; }
  @media (prefers-color-scheme: dark) {
    :root { --page: #09090B; --card: #18181B; --border: #27272A; --primary: #FAFAFA; --secondary: #A1A1AA; --tertiary: #71717A; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 24px 16px; background: var(--page); color: var(--primary); font-family: Poppins, system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { width: 100%; max-width: 420px; padding: 32px 24px; border: 1px solid var(--border); border-radius: 16px; background: var(--card); text-align: center; }
  .logo { display: block; width: 96px; height: auto; margin: 0 auto 20px; }
  h1 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; letter-spacing: -0.01em; }
  p { margin: 8px 0 0; font-size: 14px; line-height: 22px; color: var(--secondary); }
  .body { margin-top: 16px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; font-size: 14px; line-height: 22px;
    color: var(--primary); text-align: left; white-space: pre-wrap; overflow-wrap: anywhere; }
  footer { margin-top: 20px; font-size: 12px; line-height: 18px; color: var(--tertiary); text-align: center; }
  footer a { color: inherit; }
</style>
</head>
<body>
<main>
  <img class="logo" src="/qr-logo.svg" alt="Garudanexa" />
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(message)}</p>
  ${body ? `<div class="body">${escapeHtml(body)}</div>` : ""}
</main>
<footer>QR ini dibuat dengan <a href="/">OpenTools</a> · PT. Garuda Nexa Bahtera</footer>
</body>
</html>`;
