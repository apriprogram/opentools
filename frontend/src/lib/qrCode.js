import QRCode from 'qrcode';

// Logo default QR (hasil trace dari logo yang diunggah pengguna), disimpan di public/qr-logo.svg
export const QR_LOGO_URL = '/qr-logo.svg';

let logoCache = null;

/**
 * Ambil logo hitam sebagai data URI (agar tetap tampil saat SVG dirender ke PNG).
 * Logo dibuat hitam di semua paket supaya sesuai QR hitam putih (paket gratis) dan tidak berwarna biru.
 */
export async function loadLogoDataUrl() {
  if (!logoCache) {
    logoCache = fetch(QR_LOGO_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Logo tidak ditemukan');
        return res.text();
      })
      .then((text) => {
        const black = text.replace(/fill="#[0-9a-fA-F]{6}"/g, 'fill="#000000"');
        return `data:image/svg+xml;base64,${toBase64(black)}`;
      });
  }
  return logoCache;
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

/** Pastikan teks link punya skema. Contoh: "garudanexa.com" -> "https://garudanexa.com". */
export function normalizeLink(input) {
  const value = String(input || '').trim();
  if (!value) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  if (/^[^\s]+\.[^\s]{2,}$/.test(value)) return `https://${value}`;
  return value;
}

/** Hitung kontras WCAG sederhana (1 - 21). Dipakai untuk memberi peringatan jika QR sulit dipindai. */
export function contrastRatio(hexA, hexB) {
  const lum = (hex) => {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const a = lum(hexA);
  const b = lum(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * Bangun SVG QR code.
 * opts: { text, fg, bg, logoDataUrl (opsional), size (px, default 512) }
 * Logo ditaruh di tengah dengan kotak latar putih; level koreksi H agar tetap bisa dipindai.
 */
export function buildQrSvg({ text, fg = '#000000', bg = '#FFFFFF', logoDataUrl = null, size = 512 }) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const n = qr.modules.size;
  const quiet = 4;
  const total = n + quiet * 2;
  const cell = size / total;

  let path = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) {
        path += `M${c + quiet} ${r + quiet}h1v1h-1z`;
      }
    }
  }

  let logo = '';
  if (logoDataUrl) {
    const logoSize = total * 0.24; // 24% dari lebar QR (dalam satuan modul)
    const pad = 0.6;
    const x = (total - logoSize) / 2;
    const y = (total - logoSize) / 2;
    logo = `
  <rect x="${(x - pad).toFixed(3)}" y="${(y - pad).toFixed(3)}" width="${(logoSize + pad * 2).toFixed(3)}" height="${(logoSize + pad * 2).toFixed(3)}" rx="1.2" fill="${bg}"/>
  <image href="${logoDataUrl}" x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${logoSize.toFixed(3)}" height="${logoSize.toFixed(3)}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">
  <rect width="${total}" height="${total}" fill="${bg}"/>
  <path d="${path}" fill="${fg}"/>${logo}
</svg>`.replace(/\s+/g, ' ').replace('> <', '><');
}

export function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Render SVG ke PNG (Blob) dengan ukuran px x px. */
export function svgToPngBlob(svg, px = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, px, px);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Gagal membuat PNG'))), 'image/png');
    };
    img.onerror = () => reject(new Error('Gagal merender QR'));
    img.src = svgToDataUrl(svg);
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
