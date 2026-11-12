import QRCode from 'qrcode';

// Logo untuk tampilan (sidebar panel dan lainnya).
export const QR_LOGO_URL = '/qr-logo.svg';

// Logo OpenTools (garis silang): dipakai di tengah QR dan di navbar. Satu path vektor, jadi warnanya
// bisa mengikuti warna QR atau warna teks.
export const QR_MARK_VIEWBOX = '0 0 132 132';
export const QR_MARK_PATH =
  'M39 7l7 -7 19 19 20 -19 7 7 -19 20 31 31 19 -19 8 7 -20 19 21 21 -8 7 -20 -20 -24 23 -7 -7 24 -24 -32 -31 0 0 -7 -7 0 0 -19 -20zm12 27l-24 24 -20 -19 -7 7 20 20 -20 19 7 8 20 -20 31 31 -20 20 7 7 20 -20 21 21 7 -8 -20 -20 -8 -8 -31 -31 24 -24 -7 -7z';

// Logo Garudanexa (sayap): dipakai di footer, halaman masuk, dan Linktree.
export const LOGO_VIEWBOX = '0 0 423 257';
export const LOGO_PATH =
  'M231 185l27 -23c8,-7 13,-13 15,-19 3,-6 3,-11 3,-17l-3 -31 0 0 139 -93c7,-5 11,-1 11,5l0 16c0,12 -5,19 -13,25l-52 34 55 -8c8,-1 10,0 10,5l0 15c0,8 -8,17 -16,18l-64 8 50 25c5,2 3,7 0,10l-13 11c-5,4 -15,3 -19,1l-38 -19 20 39c2,4 0,5 -4,5l-25 0c-3,0 -7,0 -9,-5l-7 -14c-5,5 -10,11 -16,17l-48 41c-9,8 -20,17 -22,26 -3,-9 -14,-18 -23,-26l-48 -41c-6,-6 -11,-12 -15,-17l-8 14c-2,5 -6,5 -9,5l-25 0c-4,0 -6,-1 -4,-5l21 -39 -38 19c-5,2 -15,3 -19,-1l-14 -11c-3,-3 -5,-8 0,-10l51 -25 -64 -8c-9,-1 -17,-10 -17,-18l0 -15c0,-5 2,-6 11,-5l54 8 -52 -34c-8,-6 -13,-13 -13,-25l0 -16c0,-6 4,-10 11,-5l139 93 0 0 -3 31c0,6 0,11 3,17 3,6 7,12 15,19l27 23c12,10 20,19 20,26 0,-7 8,-16 19,-26z';

/** Logo tengah QR sebagai SVG mandiri dengan warna tertentu. */
export function logoSvg(color = '#000000') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${QR_MARK_VIEWBOX}"><path d="${QR_MARK_PATH}" fill="${color}"/></svg>`;
}

/**
 * Logo sebagai data URI. Dipakai halaman sebagai penanda "logo siap ditampilkan".
 * Di dalam QR, logo digambar langsung sebagai vektor dan warnanya mengikuti warna QR (lihat buildQrSvg).
 */
export async function loadLogoDataUrl(color = '#000000') {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg(color))}`;
}

/** Pastikan teks link punya skema. Contoh: "garudanexa.com" -> "https://garudanexa.com". */
export function normalizeLink(input) {
  const value = String(input || '').trim();
  if (!value) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  if (/^[^\s]+\.[^\s]{2,}$/.test(value)) return `https://${value}`;
  return value;
}

/** Alamat pindai QR dinamis: server meneruskannya ke link tujuan, atau menampilkan halaman "tidak aktif". */
export function scanUrl(code) {
  if (!code || typeof window === 'undefined') return '';
  return `${window.location.origin}/api/q/${code}`;
}

/**
 * Teks yang ditanam ke gambar QR. QR di akun punya kode pindai, jadi isinya alamat pindai (bisa dinonaktifkan
 * dan diganti link-nya tanpa mengubah gambar). Tanpa kode (pratinjau sebelum disimpan), isinya link langsung.
 */
export function qrContent({ link, code } = {}) {
  return scanUrl(code) || String(link || '');
}

/**
 * Link (http atau https) yang terselip di antara kata lain, misalnya "Premium Gold https://contoh.com".
 * Biasanya terjadi karena label ikut tersalin saat menyalin link. Kosong bila isinya sudah link saja,
 * atau bila ada lebih dari satu link sehingga tidak jelas mana yang dimaksud.
 */
export function embeddedLink(input) {
  const value = String(input || '').trim();
  if (!/\s/.test(value)) return '';
  const found = value.match(/https?:\/\/[^\s]+/gi) || [];
  return found.length === 1 ? found[0] : '';
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

// Nilai warna latar untuk QR tanpa latar (tembus pandang). PNG dan SVG yang diunduh tidak punya bidang latar.
export const TRANSPARENT_BG = 'transparent';
export const isTransparentBg = (bg) => String(bg || '').toLowerCase() === TRANSPARENT_BG;

// Gaya kotak pratinjau QR: warna latarnya, atau pola kotak-kotak sebagai tanda latar transparan.
export const qrBackdropStyle = (bg, tile = 16) =>
  isTransparentBg(bg)
    ? {
        backgroundColor: '#FFFFFF',
        backgroundImage: 'conic-gradient(#D4D4D8 25%, #FFFFFF 0 50%, #D4D4D8 0 75%, #FFFFFF 0)',
        backgroundSize: `${tile}px ${tile}px`,
      }
    : { backgroundColor: bg };

/**
 * Bangun SVG QR code.
 * opts: { text, fg, bg, logo (opsional), logoDataUrl (opsional), size (px, default 512) }
 * Logo tampil jika logo bernilai true, atau jika logoDataUrl diisi (cara lama).
 * Logo ditaruh di tengah di atas kotak berwarna latar, dan warnanya mengikuti warna QR (fg).
 * bg 'transparent': tanpa bidang latar, dan titik QR di belakang logo dikosongkan.
 * Level koreksi H dipakai agar QR tetap bisa dipindai.
 */
export function buildQrSvg({ text, fg = '#000000', bg = '#FFFFFF', logo: showLogo, logoDataUrl = null, size = 512 }) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const n = qr.modules.size;
  const quiet = 4;
  const total = n + quiet * 2;
  const clear = isTransparentBg(bg);
  const withLogo = showLogo ?? Boolean(logoDataUrl);
  // Kotak kosong di tengah QR 24% dari lebar QR (dalam satuan modul). Logo di dalamnya lebih kecil (15%),
  // jadi ada ruang kosong di sekeliling logo.
  const boxSize = total * 0.24;
  const logoSize = total * 0.15;
  const pad = 0.6;
  const x = (total - logoSize) / 2;
  const y = (total - logoSize) / 2;
  const boxStart = (total - boxSize) / 2 - pad;
  const boxEnd = boxStart + boxSize + pad * 2;
  // Latar transparan tidak punya kotak penutup di belakang logo, jadi titik QR di area logo tidak digambar.
  const underLogo = (mx, my) => clear && withLogo && mx + 1 > boxStart && mx < boxEnd && my + 1 > boxStart && my < boxEnd;

  let path = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c) && !underLogo(c + quiet, r + quiet)) {
        path += `M${c + quiet} ${r + quiet}h1v1h-1z`;
      }
    }
  }

  let logo = '';
  if (withLogo) {
    const backing = clear
      ? ''
      : `<rect x="${boxStart.toFixed(3)}" y="${boxStart.toFixed(3)}" width="${(boxEnd - boxStart).toFixed(3)}" height="${(boxEnd - boxStart).toFixed(3)}" rx="1.2" fill="${bg}"/>`;
    logo = `
  ${backing}
  <svg x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${logoSize.toFixed(3)}" height="${logoSize.toFixed(3)}" viewBox="${QR_MARK_VIEWBOX}" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision"><path d="${QR_MARK_PATH}" fill="${fg}"/></svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">
  ${clear ? '' : `<rect width="${total}" height="${total}" fill="${bg}"/>`}
  <path d="${path}" fill="${fg}"/>${logo}
</svg>`.replace(/\s+/g, ' ').replace(/> </g, '><');
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
