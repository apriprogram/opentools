import { setMyQrActive } from '../../services/authApi';

// Nonaktifkan atau aktifkan lagi satu QR milik pengguna, lengkap dengan konfirmasi dan notifikasi.
// Dipakai kartu di Daftar QR dan menu aksi di tabel pesanan. Mengembalikan true bila statusnya berubah.
export async function toggleQrActive(qr, toast) {
  const turningOff = !qr.disabled;
  if (
    turningOff &&
    !window.confirm('Nonaktifkan QR ini?\n\nSaat dipindai, QR akan menampilkan halaman "Link sudah tidak aktif". QR bisa diaktifkan lagi kapan saja.')
  ) {
    return false;
  }
  try {
    await setMyQrActive(qr.id, !turningOff);
    toast({
      type: 'success',
      title: turningOff ? 'QR dinonaktifkan' : 'QR diaktifkan lagi',
      message: turningOff
        ? 'Saat dipindai, QR ini sekarang menampilkan halaman "Link sudah tidak aktif".'
        : 'Saat dipindai, QR ini kembali membuka link tujuannya.',
    });
    return true;
  } catch (err) {
    toast({ type: 'error', title: 'Gagal mengubah status QR', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    return false;
  }
}
