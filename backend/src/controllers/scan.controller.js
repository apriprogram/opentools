import { findScanTarget, isRedirectable, renderScanPage } from "../services/scan.service.js";

const sendPage = (res, status, page) => {
  res.status(status).set("Content-Type", "text/html; charset=utf-8").send(renderScanPage(page));
};

// Alamat yang tertanam di gambar QR: /api/q/<kode>.
// QR aktif diteruskan ke link tujuannya. QR yang dinonaktifkan pemiliknya menampilkan halaman "tidak aktif".
export const scanQr = async (req, res) => {
  // Jangan disimpan browser atau CDN: menonaktifkan atau mengganti link harus langsung berlaku.
  res.set("Cache-Control", "no-store");
  res.set("X-Robots-Tag", "noindex, nofollow");
  try {
    const target = await findScanTarget(String(req.params.code || "").toLowerCase());
    if (!target) {
      return sendPage(res, 404, {
        title: "QR tidak ditemukan",
        message: "QR ini sudah dihapus pemiliknya atau alamatnya tidak lengkap."
      });
    }
    if (target.disabled) {
      return sendPage(res, 200, {
        title: "Link sudah tidak aktif",
        message: "Pemilik QR ini menonaktifkannya, jadi link tujuannya tidak bisa dibuka. Hubungi pemilik QR untuk informasi lebih lanjut."
      });
    }
    if (isRedirectable(target.link)) return res.redirect(302, target.link);
    return sendPage(res, 200, { title: "Isi QR", message: "QR ini berisi teks, bukan link.", body: target.link });
  } catch (error) {
    console.error("Scan QR error:", error);
    return sendPage(res, 500, {
      title: "QR belum bisa dibuka",
      message: "Terjadi gangguan di server. Coba pindai lagi beberapa saat."
    });
  }
};
