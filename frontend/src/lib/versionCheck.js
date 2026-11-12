// Pengecek versi situs. Setiap build menghasilkan nama file berbeda (assets/index-<hash>.js dan .css),
// jadi versi yang sedang berjalan dibandingkan dengan yang tertulis di index.html terbaru di server.
// Dipakai supaya tab yang masih menjalankan versi lama memuat ulang sendiri setelah ada deploy.
const ASSET_RE = /\/assets\/index-[\w-]+\.(?:js|css)/g;

const signature = (list) => [...new Set(list)].sort().join('|');

/** Versi yang sedang berjalan di tab ini. Kosong saat mode pengembangan (tanpa file build). */
export function currentBuild() {
  const urls = [...document.querySelectorAll('script[src], link[rel="stylesheet"][href]')].map(
    (el) => el.getAttribute('src') || el.getAttribute('href') || ''
  );
  return signature(urls.flatMap((url) => url.match(ASSET_RE) || []));
}

/**
 * Versi terbaru di server. Mengembalikan teks kosong bila belum bisa dipastikan,
 * misalnya server sedang tidak terjangkau atau file build baru belum selesai disalin.
 */
export async function latestBuild() {
  const res = await fetch(`/index.html?v=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return '';
  const assets = (await res.text()).match(ASSET_RE) || [];
  const script = assets.find((url) => url.endsWith('.js'));
  if (!script) return '';
  // File yang belum ada dibalas server dengan index.html (text/html). Tunggu sampai file JS-nya benar-benar ada,
  // supaya tab tidak dimuat ulang ke halaman kosong saat deploy masih berjalan.
  const probe = await fetch(script, { method: 'HEAD', cache: 'no-store' });
  if (!probe.ok || !/javascript/i.test(probe.headers.get('content-type') || '')) return '';
  return signature(assets);
}
