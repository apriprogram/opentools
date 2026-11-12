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
