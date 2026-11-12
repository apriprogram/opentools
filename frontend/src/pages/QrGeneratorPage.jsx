import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Lock, Crown, Link2, AlertTriangle, QrCode, Save, ReceiptText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveMyQr } from '../services/authApi';
import { verifyQrLicense } from '../services/qrApi';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import {
  loadLogoDataUrl,
  normalizeLink,
  embeddedLink,
  qrContent,
  buildQrSvg,
  contrastRatio,
  svgToPngBlob,
  downloadBlob,
} from '../lib/qrCode';

const FREE_FG = '#000000';
const FREE_BG = '#FFFFFF';
const rupiah = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;

// Di dalam panel dashboard, halaman tidak perlu pembungkus <main> sendiri.
function EmbeddedWrap({ children }) {
  return <div className="w-full">{children}</div>;
}

// Generator QR. Tanpa orderPlan: mode gratis (hitam putih dengan logo hitam), bisa disimpan ke akun.
// Dengan orderPlan: mode pemesanan Premium untuk satu QR. Warna dan logo bisa diatur, lalu lanjut bayar.
// renewQr: QR yang sudah ada (jadikan Premium atau perpanjang), desainnya dipakai sebagai awal.
// freePremium: warna dan logo bisa diatur tanpa pesanan (dipakai super admin di menu Tools Admin).
export default function QrGeneratorPage({ embedded = false, orderPlan = null, renewQr = null, onOrder = null, orderBusy = false, freePremium = false }) {
  const Wrap = embedded ? EmbeddedWrap : PageContainer;
  const { addToast: toast } = useToast();
  const { user } = useAuth();
  const [link, setLink] = useState(renewQr?.link || '');
  const [fg, setFg] = useState(renewQr?.fg || '#111111');
  const [bg, setBg] = useState(renewQr?.bg || '#FFFFFF');
  const [useLogo, setUseLogo] = useState(renewQr ? renewQr.logo !== false : true);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  // QR yang baru disimpan ke akun. Selama link belum diubah lagi, pratinjau dan unduhan memakai alamat pindainya
  // (QR dinamis), supaya gambar yang diunduh bisa dinonaktifkan atau diganti link-nya nanti.
  const [savedQr, setSavedQr] = useState(null);

  const isPaid = Boolean(orderPlan);
  // Warna dan logo bebas diatur: saat memesan paket, atau untuk admin tanpa pesanan.
  const custom = isPaid || freePremium;
  // Mode gratis: warna tetap hitam-putih dan logo hitam selalu tampil.
  const colors = {
    fg: custom ? fg : FREE_FG,
    bg: custom ? bg : FREE_BG,
    logo: custom ? useLogo : true,
  };
  const target = normalizeLink(link);
  // Link yang tersalin bersama kata lain: saat dipindai hasilnya teks biasa, bukan link yang langsung terbuka.
  const linkInside = embeddedLink(link);

  useEffect(() => {
    loadLogoDataUrl().then(setLogoDataUrl).catch(() => setLogoDataUrl(null));
  }, []);

  const isSaved = Boolean(savedQr) && savedQr.link === target;
  const content = isSaved ? qrContent(savedQr) : target;

  const svg = useMemo(() => {
    if (!target) return '';
    try {
      return buildQrSvg({
        text: content,
        fg: colors.fg,
        bg: colors.bg,
        logoDataUrl: colors.logo ? logoDataUrl : null,
        size: 512,
      });
    } catch {
      return ''; // teks terlalu panjang untuk QR
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, content, colors.fg, colors.bg, colors.logo, logoDataUrl]);

  const tooLong = Boolean(target) && !svg;

  // Barcode lisensi (?lisensi=KODE): hanya memeriksa masa berlaku lisensi itu.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('lisensi');
    if (!key) return;
    verifyQrLicense(key.trim().toUpperCase())
      .then((res) => {
        if (res.valid) {
          toast({ type: 'success', title: 'Lisensi valid', message: `${res.planLabel} berlaku sampai ${new Date(res.expiresAt).toLocaleDateString('id-ID')}. Lisensi ini terikat pada satu QR.` });
        } else {
          toast({ type: 'error', title: res.expired ? 'Lisensi kedaluwarsa' : 'Kode tidak valid', message: 'Periksa kembali link lisensi Anda.' });
        }
      })
      .catch(() => toast({ type: 'error', title: 'Gagal', message: 'Tidak bisa menghubungi server. Coba lagi.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToAccount = async () => {
    if (!target) return;
    setSaving(true);
    try {
      const saved = await saveMyQr({ link: target, fg: colors.fg, bg: colors.bg, logo: colors.logo });
      setSavedQr(saved);
      toast({ type: 'success', title: 'QR disimpan', message: 'QR ini sekarang bisa dinonaktifkan atau dikelola dari daftar QR.' });
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menyimpan', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setSaving(false);
    }
  };

  const placeOrder = () => {
    if (!target || tooLong) {
      toast({ type: 'error', title: 'Link belum valid', message: 'Isi link atau teks QR terlebih dahulu.' });
      return;
    }
    onOrder?.({ link: target, fg: colors.fg, bg: colors.bg, logo: colors.logo });
  };

  const contrast = contrastRatio(colors.fg, colors.bg);
  const lowContrast = contrast < 3;

  const downloadPng = async () => {
    if (!svg) return;
    try {
      const blob = await svgToPngBlob(svg, 1024);
      downloadBlob(blob, 'qr-opentools.png');
    } catch {
      toast({ type: 'error', title: 'Gagal', message: 'QR tidak bisa diunduh sebagai PNG.' });
    }
  };

  const downloadSvg = () => {
    if (!svg) return;
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'qr-opentools.svg');
  };

  const previewSrc = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : '';

  return (
    <Wrap>
      <section className="max-w-5xl mx-auto pt-4">
        <div className="mb-6">
          <h1 className="text-[24px] sm:text-[28px] font-semibold text-primary tracking-tight leading-[32px]">
            {isPaid ? `Premium Gold ${orderPlan.label}` : freePremium ? 'Buat QR' : 'QR Generator'}
          </h1>
          <p className="text-[14px] text-secondary leading-[22px] mt-1">
            {isPaid
              ? 'Untuk satu QR code. Atur link, warna, dan logo, lalu lanjut bayar.'
              : freePremium
                ? 'Atur link, warna, dan logo, lalu simpan. QR buatan admin memakai fitur Premium tanpa biaya.'
              : 'Ubah link menjadi QR Code. Gratis dengan logo hitam dan warna hitam putih.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Pengaturan */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-card p-5">
              <label htmlFor="qr-link" className="flex items-center gap-2 text-[14px] font-medium text-primary mb-2">
                <Link2 size={16} strokeWidth={1.75} /> Link atau teks
              </label>
              <input
                id="qr-link"
                type="text"
                inputMode="url"
                placeholder="https://contoh.com/halaman-saya"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                maxLength={1000}
                className="w-full h-[44px] px-3 rounded-md border border-border bg-card text-primary text-[14px] placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth"
              />
              {link && target !== link.trim() && (
                <p className="text-[12px] text-secondary mt-2">Akan dibuat sebagai: {target}</p>
              )}
              {linkInside && (
                <div className="mt-2 flex flex-col gap-2 rounded-md bg-amber-500/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="min-w-0 text-[12px] leading-relaxed text-amber-700 dark:text-amber-400">
                    Isian ini berisi link dan kata lain. Saat dipindai, hasilnya teks biasa dan link tidak langsung terbuka.
                  </p>
                  <Button size="sm" variant="secondary" onClick={() => setLink(linkInside)} className="shrink-0">Pakai link saja</Button>
                </div>
              )}
              {tooLong && <p className="text-[12px] text-danger mt-2">Teks terlalu panjang untuk QR Code. Persingkat link Anda.</p>}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-primary">Tampilan</h2>
                {isPaid ? (
                  <span className="premium-gold inline-flex items-center gap-1.5 text-[12px] font-semibold border rounded-full px-2.5 py-1">
                    <Crown size={13} strokeWidth={1.75} /> Premium Gold {orderPlan.label}
                  </span>
                ) : freePremium ? (
                  <span className="premium-gold inline-flex items-center gap-1.5 text-[12px] font-semibold border rounded-full px-2.5 py-1">
                    <Crown size={13} strokeWidth={1.75} /> Fitur Premium
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-secondary border border-border rounded-full px-2.5 py-1">
                    Paket Gratis
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[13px] text-secondary mb-2">Warna QR</p>
                  {custom ? (
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-[13px] text-primary">
                        <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-9 w-9 rounded border border-border bg-transparent cursor-pointer" />
                        Warna QR
                      </label>
                      <label className="flex items-center gap-2 text-[13px] text-primary">
                        <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-9 rounded border border-border bg-transparent cursor-pointer" />
                        Latar
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-[13px] text-tertiary">
                      <span className="h-6 w-6 rounded border border-border" style={{ background: FREE_FG }} />
                      <span className="h-6 w-6 rounded border border-border" style={{ background: FREE_BG }} />
                      <span className="flex items-center gap-1"><Lock size={13} /> Hitam-putih di paket gratis</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[13px] text-secondary mb-2">Logo di tengah</p>
                  {custom ? (
                    <label className="flex items-center gap-2 text-[13px] text-primary cursor-pointer select-none">
                      <input type="checkbox" checked={useLogo} onChange={(e) => setUseLogo(e.target.checked)} className="h-4 w-4 accent-black" />
                      Tampilkan logo
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 text-[13px] text-tertiary">
                      <input type="checkbox" checked disabled className="h-4 w-4" />
                      <span className="flex items-center gap-1"><Lock size={13} /> Logo wajib di paket gratis</span>
                    </div>
                  )}
                </div>
              </div>

              {custom && lowContrast && (
                <p className="flex items-start gap-2 text-[12px] text-amber-500 mt-4">
                  <AlertTriangle size={14} className="mt-[1px] shrink-0" />
                  Kontras warna rendah ({contrast.toFixed(1)}:1). QR mungkin sulit dipindai. Pilih warna yang lebih gelap untuk QR dan lebih terang untuk latar.
                </p>
              )}

              {!custom && (
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card-muted p-4">
                  <p className="text-[13px] text-secondary">
                    Ingin ubah warna atau hapus logo? Paket Bulanan Rp30.000 atau Tahunan Rp300.000 untuk satu QR.
                  </p>
                  <Link to={user ? '/dashboard/qr?view=pilih' : '/qr/harga'} className="shrink-0">
                    <Button variant="primary" size="sm" icon={Crown}>Lihat paket</Button>
                  </Link>
                </div>
              )}
            </div>

            {isPaid && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-[15px] font-semibold text-primary mb-2">Ringkasan pesanan</h2>
                <p className="text-[13px] text-secondary">
                  Paket {orderPlan.label} untuk 1 QR code: {orderPlan.note}. Harga {rupiah(orderPlan.price)}.
                </p>
                <p className="text-[12px] text-tertiary mt-2">
                  Saat transfer, nominal ditambah kode unik 1 sampai 99 agar mudah dicocokkan. Lisensi aktif setelah pembayaran lunas.
                </p>
              </div>
            )}
          </div>

          {/* Pratinjau */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
              <div className="aspect-square w-full rounded-xl border border-border flex items-center justify-center overflow-hidden" style={{ background: colors.bg }}>
                {previewSrc ? (
                  <img src={previewSrc} alt="Pratinjau QR Code" className="w-full h-full object-contain p-3" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-tertiary px-6 text-center">
                    <QrCode size={40} strokeWidth={1.25} />
                    <span className="text-[13px]">Masukkan link untuk melihat QR Code</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="primary" icon={Download} onClick={downloadPng} disabled={!svg}>PNG</Button>
                <Button variant="secondary" icon={Download} onClick={downloadSvg} disabled={!svg}>SVG</Button>
              </div>

              {isPaid ? (
                <Button variant="primary" icon={ReceiptText} className="w-full mt-2" disabled={!svg || orderBusy} onClick={placeOrder}>
                  {orderBusy ? 'Membuat pesanan...' : `Lanjut bayar ${rupiah(orderPlan.price)}`}
                </Button>
              ) : user ? (
                <>
                  <Button variant="secondary" icon={Save} className="w-full mt-2" disabled={!svg || saving || isSaved} onClick={saveToAccount}>
                    {saving ? 'Menyimpan...' : isSaved ? 'Tersimpan di akun' : 'Simpan ke akun'}
                  </Button>
                  {svg && !isSaved && (
                    <p className="mt-2 text-center text-[12px] leading-relaxed text-secondary">
                      Simpan ke akun sebelum mengunduh, supaya QR bisa dinonaktifkan nanti.
                    </p>
                  )}
                </>
              ) : (
                <Link to="/masuk" className="mt-3 block text-center text-[13px] text-secondary underline hover:text-primary">
                  Masuk untuk menyimpan QR ke akun
                </Link>
              )}
              <p className="text-[12px] text-tertiary mt-3 text-center">
                PNG 1024 px untuk cetak dan media sosial. SVG bisa diperbesar tanpa pecah.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Wrap>
  );
}
