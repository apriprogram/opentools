import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Download, Lock, Crown, Link2, AlertTriangle, QrCode, Save, ReceiptText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveMyQr } from '../services/authApi';
import { verifyQrLicense } from '../services/qrApi';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import ColorField from '../components/ui/ColorField';
import Switch from '../components/ui/Switch';
import { useToast } from '../components/ui/Toast';
import {
  loadLogoDataUrl,
  normalizeLink,
  embeddedLink,
  qrContent,
  buildQrSvg,
  contrastRatio,
  isTransparentBg,
  qrBackdropStyle,
  svgToPngBlob,
  downloadBlob,
} from '../lib/qrCode';

// Pilihan warna cepat. Warna QR sebaiknya gelap dan latar terang supaya mudah dipindai.
const FG_PRESETS = ['#111111', '#1D4ED8', '#6D28D9', '#BE185D', '#B91C1C', '#C2410C', '#15803D', '#0F766E'];
// Tujuh warna latar: bersama pilihan transparan jadi tepat satu baris.
const BG_PRESETS = ['#FFFFFF', '#FEF3C7', '#FCE7F3', '#DBEAFE', '#DCFCE7', '#EDE9FE', '#FFEDD5'];
const FREE_FG = '#000000';
const FREE_BG = '#FFFFFF';
const rupiah = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;

// Di dalam panel dashboard, halaman tidak perlu pembungkus <main> sendiri.
function EmbeddedWrap({ children }) {
  return <div className="w-full">{children}</div>;
}

// Generator QR. Tanpa orderPlan: mode gratis (warna bebas, logo selalu tampil), bisa disimpan ke akun.
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
  // Warna QR dan latar bebas dipilih di semua paket. Di paket gratis logo selalu tampil.
  const colors = {
    fg,
    bg,
    logo: custom ? useLogo : true,
  };
  // Latar transparan: QR diunduh tanpa bidang latar, jadi warnanya tidak dibandingkan dengan warna QR.
  const clearBg = isTransparentBg(bg);
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
    if (!clearBg && colors.fg.toLowerCase() === colors.bg.toLowerCase()) {
      toast({ type: 'error', title: 'Warna belum bisa dipakai', message: 'Warna QR dan warna latar tidak boleh sama.' });
      return;
    }
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

  const contrast = clearBg ? 0 : contrastRatio(colors.fg, colors.bg);
  const sameColor = !clearBg && colors.fg.toLowerCase() === colors.bg.toLowerCase();
  const lowContrast = !clearBg && !sameColor && contrast < 3;

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
              : 'Ubah link menjadi QR Code. Gratis, warna bisa dipilih sendiri, dengan logo di tengah.'}
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ColorField id="qr-fg" label="Warna QR" value={fg} onChange={setFg} presets={FG_PRESETS} />
                <ColorField id="qr-bg" label="Warna latar" value={bg} onChange={setBg} presets={BG_PRESETS} allowTransparent />
              </div>

              {/* Logo di tengah: bisa dimatikan di paket Premium, selalu tampil di paket gratis. */}
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${colors.logo ? 'bg-blue-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]' : 'border border-border text-transparent'}`}
                  >
                    <Check size={15} strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p className="text-[13px] font-medium text-primary">Logo di tengah</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-secondary">
                      {custom ? (
                        colors.logo ? 'Logo tampil di tengah QR.' : 'QR tampil tanpa logo.'
                      ) : (
                        <>
                          <Lock size={12} strokeWidth={1.75} aria-hidden="true" className="shrink-0" /> Wajib di paket gratis
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {custom && (
                  <Switch size="md" checked={useLogo} onChange={setUseLogo} label="Tampilkan logo di tengah QR" title={useLogo ? 'Klik untuk menyembunyikan logo' : 'Klik untuk menampilkan logo'} />
                )}
              </div>

              {sameColor && (
                <p className="mt-3 flex items-start gap-2 rounded-md bg-red-500/10 px-2.5 py-2 text-[12px] text-red-700 dark:text-red-400">
                  <AlertTriangle size={14} className="mt-[1px] shrink-0" />
                  Warna QR dan warna latar sama, jadi QR tidak bisa dipindai. Pilih dua warna yang berbeda.
                </p>
              )}

              {clearBg && (
                <p className="mt-3 rounded-md bg-blue-500/10 px-2.5 py-2 text-[12px] leading-relaxed text-blue-700 dark:text-blue-300">
                  Latar transparan: PNG dan SVG diunduh tanpa bidang latar. Tempel QR di atas bidang polos yang warnanya jauh berbeda dari warna QR, supaya tetap mudah dipindai.
                </p>
              )}

              {lowContrast && (
                <p className="mt-3 flex items-start gap-2 rounded-md bg-amber-500/10 px-2.5 py-2 text-[12px] text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={14} className="mt-[1px] shrink-0" />
                  Kontras warna rendah ({contrast.toFixed(1)}:1). QR mungkin sulit dipindai. Pilih warna yang lebih gelap untuk QR dan lebih terang untuk latar.
                </p>
              )}

              {!custom && (
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card-muted p-4">
                  <p className="text-[13px] text-secondary">
                    Ingin QR tanpa logo, dan warna serta link yang bisa diganti kapan saja? Paket Bulanan Rp30.000 atau Tahunan Rp300.000 untuk satu QR.
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
                  Paket {orderPlan.label} untuk 1 QR code: {orderPlan.note}. Harga {rupiah(orderPlan.price)}
                  {orderPlan.discount && orderPlan.basePrice > orderPlan.price && (
                    <>
                      {' '}
                      (dari <s>{rupiah(orderPlan.basePrice)}</s>, hemat {rupiah(orderPlan.basePrice - orderPlan.price)})
                    </>
                  )}
                  .
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
              <div className="aspect-square w-full rounded-xl border border-border flex items-center justify-center overflow-hidden" style={previewSrc ? qrBackdropStyle(colors.bg) : { backgroundColor: clearBg ? '#FFFFFF' : colors.bg }}>
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
