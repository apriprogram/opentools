// Ubah gambar dari perangkat menjadi data URL JPEG yang sudah diperkecil.
// square: potong tengah menjadi persegi (untuk foto profil). maxChars: batas ukuran teks hasil.
export function readImageAsDataUrl(file, { maxSide = 1200, maxChars = 1400000, square = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar (JPG, PNG, atau WebP).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File tidak bisa dibaca.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gambar tidak bisa dibuka.'));
      img.onload = () => {
        let sx = 0;
        let sy = 0;
        let sw = img.naturalWidth;
        let sh = img.naturalHeight;
        if (square) {
          const side = Math.min(sw, sh);
          sx = (sw - side) / 2;
          sy = (sh - side) / 2;
          sw = side;
          sh = side;
        }
        const scale = Math.min(1, maxSide / Math.max(sw, sh));
        const w = Math.max(1, Math.round(sw * scale));
        const h = Math.max(1, Math.round(sh * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        let quality = 0.9;
        let url = canvas.toDataURL('image/jpeg', quality);
        while (url.length > maxChars && quality > 0.4) {
          quality -= 0.1;
          url = canvas.toDataURL('image/jpeg', quality);
        }
        if (url.length > maxChars) {
          reject(new Error('Gambar masih terlalu besar. Pilih gambar lain.'));
          return;
        }
        resolve(url);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
