// Hitungan harga dan diskon di sisi tampilan. Aturannya sama dengan settings.service.js di server,
// supaya pratinjau di halaman Pengaturan cocok dengan harga yang nanti dibayar pengguna.
export const PRICE_MIN = 1000;
export const PRICE_MAX = 100000000;
export const PERCENT_MAX = 90;

export const rupiah = (n) => `${Number(n) < 0 ? '-' : ''}Rp${Math.abs(Number(n) || 0).toLocaleString('id-ID')}`;

// Tanggal hari ini menurut WIB (YYYY-MM-DD), sama dengan cara server menentukan diskon masih berlaku.
export const todayWib = () => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const tanggalPanjang = (ymd) =>
  ymd ? new Date(`${ymd}T00:00:00+07:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }) : '';

/** Besar potongan (rupiah) untuk harga dan diskon tertentu. Harga akhir tidak pernah di bawah PRICE_MIN. */
export function discountCut(price, discount) {
  const base = Number(price) || 0;
  const value = Number(discount?.value) || 0;
  if (!discount?.enabled || value <= 0 || base <= PRICE_MIN) return 0;
  const cut = discount.type === 'amount' ? value : Math.round((base * value) / 100);
  return Math.max(0, Math.min(cut, base - PRICE_MIN));
}

/** Label singkat diskon: "Diskon 15%" atau "Hemat Rp5.000". */
export const discountLabel = (discount) =>
  !discount ? '' : discount.type === 'percent' ? `Diskon ${discount.value}%` : `Hemat ${rupiah(discount.amount ?? discount.value)}`;
