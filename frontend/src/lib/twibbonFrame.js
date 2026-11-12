// Siapkan gambar bingkai Twibbon dari file perangkat:
// diperkecil (sisi terpanjang maksimal 1080 px), area transparan dipertahankan, dan dicek apakah ada lubang fotonya.
// Disimpan sebagai WebP (jauh lebih kecil dari PNG). Browser yang tidak bisa membuat WebP memakai PNG.
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File tidak bisa dibaca.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gambar tidak bisa dibuka.'));
      img.onload = () => resolve(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const draw = (img, side) => {
  const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
};

// Ada area transparan jika cukup banyak piksel yang tembus pandang (diperiksa di salinan kecil supaya cepat).
const hasHole = (img) => {
  const { canvas, ctx } = draw(img, 160);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let clear = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 200) clear += 1;
  return clear / (data.length / 4) > 0.02;
};

export async function prepareFrame(file, { maxSide = 1080, maxChars = 900000 } = {}) {
  if (!file || !/^image\/(png|webp|jpeg)$/.test(file.type || '')) {
    throw new Error('File harus berupa gambar PNG, WebP, atau JPG.');
  }
  if (file.size > MAX_FILE_BYTES) throw new Error('Ukuran file maksimal 10 MB.');
  const img = await loadImage(file);
  const transparent = hasHole(img);

  let side = maxSide;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { canvas } = draw(img, side);
    let dataUrl = canvas.toDataURL('image/webp', 0.92);
    if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/png');
    if (dataUrl.length <= maxChars) {
      return { dataUrl, transparent, width: canvas.width, height: canvas.height };
    }
    side = Math.round(side * 0.8);
  }
  throw new Error('Gambar terlalu besar. Pakai gambar yang lebih sederhana atau lebih kecil.');
}

const imageFromUrl = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Gambar bingkai tidak bisa dibuka.'));
    img.onload = () => resolve(img);
    img.src = src;
  });

/** Apakah gambar bingkai (data URL) punya area transparan untuk foto. */
export async function frameHasHole(dataUrl) {
  return hasHole(await imageFromUrl(dataUrl));
}

/**
 * Buat area foto di bingkai yang belum transparan: mulai dari titik yang diketuk, semua piksel bersebelahan
 * yang warnanya mirip dijadikan tembus pandang (seperti alat "tongkat ajaib" di aplikasi desain).
 * x, y: posisi ketukan di kotak pratinjau persegi (0 sampai 1). tolerance: seberapa mirip warnanya (0 sampai 100).
 */
export async function punchHole(dataUrl, { x, y, tolerance = 40, maxChars = 900000 } = {}) {
  const img = await imageFromUrl(dataUrl);
  const { canvas, ctx } = draw(img, Math.max(img.naturalWidth, img.naturalHeight));
  const { width, height } = canvas;

  // Pratinjau menampilkan gambar utuh di dalam kotak persegi, jadi gambar yang tidak persegi punya tepi kosong.
  const boxW = width >= height ? 1 : width / height;
  const boxH = height >= width ? 1 : height / width;
  const ix = (x - (1 - boxW) / 2) / boxW;
  const iy = (y - (1 - boxH) / 2) / boxH;
  if (ix < 0 || ix >= 1 || iy < 0 || iy >= 1) throw new Error('Ketuk di dalam gambar bingkainya.');

  const image = ctx.getImageData(0, 0, width, height);
  const d = image.data;
  const sx = Math.min(width - 1, Math.floor(ix * width));
  const sy = Math.min(height - 1, Math.floor(iy * height));
  const seed = (sy * width + sx) * 4;
  if (d[seed + 3] < 16) throw new Error('Bagian itu sudah transparan. Ketuk bagian lain.');
  const r0 = d[seed];
  const g0 = d[seed + 1];
  const b0 = d[seed + 2];
  const limit = tolerance * tolerance * 3;

  const total = width * height;
  const seen = new Uint8Array(total);
  const stack = new Int32Array(total);
  let top = 0;
  let cleared = 0;
  stack[top++] = sy * width + sx;
  seen[sy * width + sx] = 1;
  while (top) {
    const p = stack[--top];
    const i = p * 4;
    if (d[i + 3] >= 16) {
      const dr = d[i] - r0;
      const dg = d[i + 1] - g0;
      const db = d[i + 2] - b0;
      if (dr * dr + dg * dg + db * db > limit) continue;
    }
    d[i + 3] = 0;
    cleared += 1;
    const px = p % width;
    if (px > 0 && !seen[p - 1]) { seen[p - 1] = 1; stack[top++] = p - 1; }
    if (px < width - 1 && !seen[p + 1]) { seen[p + 1] = 1; stack[top++] = p + 1; }
    if (p >= width && !seen[p - width]) { seen[p - width] = 1; stack[top++] = p - width; }
    if (p < total - width && !seen[p + width]) { seen[p + width] = 1; stack[top++] = p + width; }
  }
  if (cleared / total > 0.9) {
    throw new Error('Hampir seluruh gambar ikut terhapus. Kecilkan kepekaan warna, lalu coba lagi.');
  }
  ctx.putImageData(image, 0, 0);

  for (const quality of [0.92, 0.82, 0.7]) {
    let out = canvas.toDataURL('image/webp', quality);
    if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/png');
    if (out.length <= maxChars) return { dataUrl: out, transparent: true, width, height, cleared: cleared / total };
  }
  throw new Error('Gambar terlalu besar setelah diubah. Pakai gambar yang lebih kecil.');
}
