import { PDFDocument, degrees } from 'pdf-lib';

// Alat PDF yang berjalan sepenuhnya di browser: file tidak diunggah ke server, jadi cepat dan tanpa login.
// - Sumber: file PDF atau gambar (JPG, PNG, WEBP) yang dipilih pengguna.
// - Halaman: { id, kind: 'pdf'|'image'|'blank', sourceId, index, rotation, width, height, thumb, label }.
// - Ekspor: pdf-lib menyalin halaman PDF asli (teks tetap tajam), menyisipkan gambar, dan halaman kosong.

export const A4 = { width: 595.28, height: 841.89 };
const THUMB_WIDTH = 220;
let uid = 0;
// Galat dengan kunci terjemahan: halaman yang menampilkannya memanggil t(err.i18n.key, err.i18n.params).
const i18nError = (key, params = {}) => Object.assign(new Error(key), { i18n: { key: `pdf.${key}`, params } });

export const newId = (prefix = 'p') => `${prefix}${Date.now().toString(36)}${(uid += 1).toString(36)}`;

/* ── pdfjs (pratinjau halaman) ───────────────────────────────────────────── */

let pdfjsPromise = null;
// Dimuat saat dibutuhkan saja, karena ukurannya besar.
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export const isPdfFile = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
export const isImageFile = (file) => /^image\/(jpeg|png|webp|gif|bmp)$/i.test(file.type) || /\.(jpe?g|jfif|png|webp|gif|bmp)$/i.test(file.name);

/**
 * Baca file PDF: periksa bisa dibuka, ambil ukuran tiap halaman, dan siapkan dokumen pdfjs untuk pratinjau.
 * Hasil: { source: { id, type:'pdf', name, bytes, preview }, pages: [...] }.
 */
export async function readPdf(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let doc;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    if (/encrypt/i.test(String(err?.message))) {
      throw i18nError('err_locked', { name: file.name });
    }
    throw i18nError('err_unreadable_pdf', { name: file.name });
  }
  const pdfjs = await loadPdfjs();
  // pdfjs memindahkan isi buffer ke worker, jadi diberi salinan.
  const preview = await pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
  const id = newId('s');
  const pages = doc.getPages().map((page, index) => {
    const { width, height } = page.getSize();
    return { id: newId(), kind: 'pdf', sourceId: id, index, rotation: 0, baseRotation: page.getRotation().angle || 0, width, height, thumb: null, label: file.name };
  });
  return { source: { id, type: 'pdf', name: file.name, bytes, preview, pageCount: pages.length }, pages };
}

/** Gambar pratinjau satu halaman PDF sebagai data URL JPEG kecil. */
export async function renderPdfThumb(source, index) {
  const page = await source.preview.getPage(index + 1);
  const viewport0 = page.getViewport({ scale: 1 });
  const scale = THUMB_WIDTH / viewport0.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  page.cleanup();
  return canvas.toDataURL('image/jpeg', 0.72);
}

/* ── Gambar dan filter scan ──────────────────────────────────────────────── */

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(i18nError('err_unreadable_image', { name: file.name }));
    };
    img.src = url;
  });

/** Baca file gambar menjadi sumber dan satu halaman. */
export async function readImage(file) {
  const { img, url } = await loadImage(file);
  const id = newId('s');
  const source = { id, type: 'image', name: file.name, img, url, width: img.naturalWidth, height: img.naturalHeight };
  const page = { id: newId(), kind: 'image', sourceId: id, index: 0, rotation: 0, width: img.naturalWidth, height: img.naturalHeight, thumb: null, label: file.name };
  return { source, pages: [page] };
}

// Nama dan keterangan tiap filter ada di locales/<bahasa>/pdf.json: pdf.filter_<id> dan pdf.filter_<id>_hint.
export const SCAN_FILTERS = [{ id: 'dokumen' }, { id: 'abu' }, { id: 'asli' }];

// Perkiraan terang kertas di setiap titik: gambar dikecilkan, diburamkan, lalu dibesarkan lagi.
// Tulisan yang tipis hilang, yang tersisa hanya terang-gelap cahaya pada kertas.
function paperLight(canvas) {
  const small = document.createElement('canvas');
  small.width = Math.max(8, Math.round(canvas.width / 24));
  small.height = Math.max(8, Math.round(canvas.height / 24));
  const s = small.getContext('2d');
  s.filter = 'blur(2px)';
  s.drawImage(canvas, 0, 0, small.width, small.height);
  const big = document.createElement('canvas');
  big.width = canvas.width;
  big.height = canvas.height;
  const b = big.getContext('2d');
  b.imageSmoothingEnabled = true;
  b.imageSmoothingQuality = 'high';
  b.drawImage(small, 0, 0, big.width, big.height);
  return b.getImageData(0, 0, big.width, big.height).data;
}

// Terapkan filter ke piksel kanvas.
// "Dokumen": tiap titik dibagi terang kertas di sekitarnya, jadi bayangan dan cahaya tidak rata hilang,
// lalu kontras ditegaskan supaya kertas putih dan tulisan gelap. "Abu-abu": abu-abu biasa.
function applyFilter(ctx, width, height, filter) {
  if (filter === 'asli') return;
  const light = filter === 'dokumen' ? paperLight(ctx.canvas) : null;
  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    let v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    if (light) {
      const bg = Math.max(30, 0.299 * light[i] + 0.587 * light[i + 1] + 0.114 * light[i + 2]);
      v = Math.min(255, (v / bg) * 255 * 1.08);
      v = v >= 232 ? 255 : Math.pow(v / 232, 2.2) * 255;
    }
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
}

/**
 * Gambar sumber diputar dan diberi filter, lalu dikembalikan sebagai kanvas.
 * maxSide membatasi sisi terpanjang supaya ukuran PDF wajar.
 */
export function drawImagePage(source, { rotation = 0, filter = 'asli', maxSide = 2200 } = {}) {
  const { img } = source;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const turned = rotation % 180 !== 0;
  const canvas = document.createElement('canvas');
  canvas.width = turned ? h : w;
  canvas.height = turned ? w : h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  applyFilter(ctx, canvas.width, canvas.height, filter);
  return canvas;
}

/** Pratinjau kecil halaman gambar dengan filter (rotasi ditampilkan lewat CSS di kartu). */
export function renderImageThumb(source, filter) {
  return drawImagePage(source, { filter, maxSide: THUMB_WIDTH * 1.5 }).toDataURL('image/jpeg', 0.75);
}

const canvasToJpeg = (canvas, quality = 0.85) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(i18nError('err_image'));
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, 'image/jpeg', quality);
  });

/* ── Menyusun PDF hasil ──────────────────────────────────────────────────── */

/**
 * Susun PDF dari daftar halaman.
 * options.pageSize untuk halaman gambar: 'a4' (gambar dimuat utuh di A4, tegak atau mendatar mengikuti gambar)
 * atau 'fit' (ukuran halaman sama dengan gambar). options.filter: filter scan untuk halaman gambar.
 * onProgress(0..1) dipanggil di setiap halaman.
 */
export async function buildPdf(pages, sources, { pageSize = 'a4', filter = 'asli', margin = 0, onProgress } = {}) {
  if (!pages.length) throw i18nError('err_no_pages');
  const out = await PDFDocument.create();
  out.setProducer('OpenTools');
  out.setCreator('OpenTools');
  const loaded = new Map();
  const firstPdf = pages.find((p) => p.kind === 'pdf');
  const blankSize = firstPdf ? { width: firstPdf.width, height: firstPdf.height } : A4;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const source = sources[page.sourceId];
    if (page.kind === 'pdf') {
      if (!loaded.has(source.id)) loaded.set(source.id, await PDFDocument.load(source.bytes, { updateMetadata: false }));
      const [copy] = await out.copyPages(loaded.get(source.id), [page.index]);
      copy.setRotation(degrees((((copy.getRotation().angle || 0) + page.rotation) % 360 + 360) % 360));
      out.addPage(copy);
    } else if (page.kind === 'blank') {
      const turned = page.rotation % 180 !== 0;
      const size = page.width ? page : blankSize;
      out.addPage(turned ? [size.height, size.width] : [size.width, size.height]);
    } else {
      const canvas = drawImagePage(source, { rotation: page.rotation, filter: page.filter || filter });
      const image = await out.embedJpg(await canvasToJpeg(canvas));
      const landscape = canvas.width > canvas.height;
      const pageW = pageSize === 'fit' ? canvas.width * 0.75 : landscape ? A4.height : A4.width;
      const pageH = pageSize === 'fit' ? canvas.height * 0.75 : landscape ? A4.width : A4.height;
      const pdfPage = out.addPage([pageW, pageH]);
      const room = { w: pageW - margin * 2, h: pageH - margin * 2 };
      const scale = Math.min(room.w / canvas.width, room.h / canvas.height);
      const w = canvas.width * scale;
      const h = canvas.height * scale;
      pdfPage.drawImage(image, { x: (pageW - w) / 2, y: (pageH - h) / 2, width: w, height: h });
    }
    onProgress?.((i + 1) / pages.length);
    // Beri jeda supaya tampilan tetap responsif saat dokumen besar.
    if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0));
  }
  return out.save();
}

/** Unduh byte PDF sebagai file. */
export function downloadPdf(bytes, fileName) {
  const name = (fileName || 'dokumen').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\.pdf$/i, '') || 'dokumen';
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
