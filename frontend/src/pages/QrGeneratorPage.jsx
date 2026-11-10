import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Lock, Crown, KeyRound, LogOut, Link2, AlertTriangle, QrCode, Save } from 'lucide-react';
import Countdown from '../components/ui/Countdown';
import { useAuth } from '../contexts/AuthContext';
import { fetchMyLicenses, saveMyQr } from '../services/authApi';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import {
  loadLogoDataUrl,
  normalizeLink,
  buildQrSvg,
  contrastRatio,
  svgToPngBlob,
  downloadBlob,
} from '../lib/qrCode';
import {
  verifyQrLicense,
  getStoredLicenseKey,
  storeLicenseKey,
  clearStoredLicenseKey,
} from '../services/qrApi';

const FREE_FG = '#000000';
const FREE_BG = '#FFFFFF';

// Di dalam panel dashboard, halaman tidak perlu pembungkus <main> sendiri.
function EmbeddedWrap({ children }) {
  return <div className="w-full">{children}</div>;
}

export default function QrGeneratorPage({ embedded = false }) {
  const Wrap = embedded ? EmbeddedWrap : PageContainer;
  const { addToast: toast } = useToast();
  const [link, setLink] = useState('');
  const [fg, setFg] = useState('#111111');
  const [bg, setBg] = useState('#FFFFFF');
  const [useLogo, setUseLogo] = useState(true);
  const [logos, setLogos] = useState({ color: null, mono: null });
  const [license, setLicense] = useState(null);
  const [licenseInput, setLicenseInput] = useState('');
  const [checkingLicense, setCheckingLicense] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const isPaid = Boolean(license);
  // Paket gratis: warna tetap hitam-putih dan logo selalu tampil.
  const colors = {
    fg: isPaid ? fg : FREE_FG,
    bg: isPaid ? bg : FREE_BG,
    logo: isPaid ? useLogo : true,
  };
  const target = normalizeLink(link);

  useEffect(() => {
    Promise.all([loadLogoDataUrl('color'), loadLogoDataUrl('mono')])
      .then(([color, mono]) => setLogos({ color, mono }))
      .catch(() => setLogos({ color: null, mono: null }));

    const stored = getStoredLicenseKey();
    if (!stored) {
      // Akun masuk: pakai lisensi aktif milik email akun, tanpa perlu memasukkan kode.
      if (user) {
        fetchMyLicenses()
          .then((list) => {
            const active = list
              .filter((l) => l.active)
              .sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt))[0];
            if (active) setLicense({ valid: true, plan: active.plan, planLabel: active.planLabel, expiresAt: active.expiresAt });
          })
          .catch(() => { /* tetap mode gratis */ });
      }
      return;
    }
    verifyQrLicense(stored)
      .then((res) => {
        if (res.valid) setLicense(res);
        else clearStoredLicenseKey();
      })
      .catch(() => { /* server belum bisa dihubungi: tetap mode gratis */ });
  }, [user]);

  const svg = useMemo(() => {
    if (!target) return '';
    try {
      return buildQrSvg({
        text: target,
        fg: colors.fg,
        bg: colors.bg,
        logoDataUrl: colors.logo ? (isPaid ? logos.color : logos.mono) : null,
        size: 512,
      });
    } catch {
      return ''; // teks terlalu panjang untuk QR
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, colors.fg, colors.bg, colors.logo, isPaid, logos]);

  const tooLong = Boolean(target) && !svg;

  // Link lisensi dari dashboard (?lisensi=KODE): aktifkan lisensi di browser ini.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('lisensi');
    if (!key) return;
    const code = key.trim().toUpperCase();
    verifyQrLicense(code)
      .then((res) => {
        if (res.valid) {
          storeLicenseKey(code);
          setLicense(res);
          toast({ type: 'success', title: 'Lisensi aktif', message: `Paket ${res.planLabel} aktif sampai ${new Date(res.expiresAt).toLocaleDateString('id-ID')}` });
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
      await saveMyQr({ link: target, fg: colors.fg, bg: colors.bg, logo: colors.logo });
      toast({ type: 'success', title: 'QR disimpan', message: 'Lihat dan unduh lagi di menu QR Generator.' });
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menyimpan', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setSaving(false);
    }
  };

  const contrast = contrastRatio(colors.fg, colors.bg);
  const lowContrast = contrast < 3;

  const activateLicense = async () => {
    const key = licenseInput.trim().toUpperCase();
    if (!key) return;
    setCheckingLicense(true);
    try {
      const res = await verifyQrLicense(key);
      if (res.valid) {
        storeLicenseKey(key);
        setLicense(res);
        setLicenseInput('');
        toast({ type: 'success', title: 'Lisensi aktif', message: `Paket ${res.planLabel} aktif sampai ${new Date(res.expiresAt).toLocaleDateString('id-ID')}` });
      } else {
        toast({
          type: 'error',
          title: res.expired ? 'Lisensi kedaluwarsa' : 'Kode tidak valid',
          message: res.expired ? 'Perpanjang paket Anda untuk membuka fitur berbayar lagi.' : 'Periksa kembali kode lisensi Anda.',
        });
      }
    } catch {
      toast({ type: 'error', title: 'Gagal', message: 'Tidak bisa menghubungi server. Coba lagi.' });
    } finally {
      setCheckingLicense(false);
    }
  };

  const removeLicense = () => {
    clearStoredLicenseKey();
    setLicense(null);
    setUseLogo(true);
    toast({ type: 'info', title: 'Lisensi dihapus', message: 'Kembali ke paket gratis.' });
  };

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
            QR Generator
          </h1>
          <p className="text-[14px] text-secondary leading-[22px] mt-1">
            Ubah link menjadi QR Code. Gratis dengan logo, paket berbayar bisa mengganti warna dan menghapus logo.
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
              {tooLong && <p className="text-[12px] text-danger mt-2">Teks terlalu panjang untuk QR Code. Persingkat link Anda.</p>}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-primary">Tampilan</h2>
                {isPaid ? (
                  <span className="premium-gold inline-flex items-center gap-1.5 text-[12px] font-semibold border rounded-full px-2.5 py-1">
                    <Crown size={13} strokeWidth={1.75} /> Paket {license.planLabel}
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
                  {isPaid ? (
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
                  {isPaid ? (
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

              {isPaid && lowContrast && (
                <p className="flex items-start gap-2 text-[12px] text-amber-500 mt-4">
                  <AlertTriangle size={14} className="mt-[1px] shrink-0" />
                  Kontras warna rendah ({contrast.toFixed(1)}:1). QR mungkin sulit dipindai. Pilih warna yang lebih gelap untuk QR dan lebih terang untuk latar.
                </p>
              )}

              {!isPaid && (
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card-muted p-4">
                  <p className="text-[13px] text-secondary">
                    Ingin ubah warna atau hapus logo? Paket Bulanan Rp15.000 atau Tahunan Rp100.000.
                  </p>
                  <Link to={user ? '/dashboard/qr?view=pilih' : '/qr/harga'} className="shrink-0">
                    <Button variant="primary" size="sm" icon={Crown}>Lihat paket</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Lisensi */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-[15px] font-semibold text-primary mb-1">Kode lisensi</h2>
              {isPaid ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-[13px] text-secondary">
                    Aktif sampai {new Date(license.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.
                  </p>
                  <p className="text-[13px] text-secondary">
                    Sisa waktu: <Countdown expiresAt={license.expiresAt} className="font-medium text-primary" />
                  </p>
                  <Button variant="secondary" size="sm" icon={LogOut} onClick={removeLicense}>Keluarkan lisensi</Button>
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-secondary mb-3">
                    Sudah membayar? Masukkan kode lisensi yang Anda terima setelah transfer dikonfirmasi.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="OTP-XXXX-XXXX-XXXX-XXXX"
                      value={licenseInput}
                      onChange={(e) => setLicenseInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') activateLicense(); }}
                      className="flex-1 h-[40px] px-3 rounded-md border border-border bg-card text-primary text-[14px] uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth"
                    />
                    <Button variant="secondary" icon={KeyRound} onClick={activateLicense} disabled={checkingLicense || !licenseInput.trim()}>
                      {checkingLicense ? 'Memeriksa...' : 'Aktifkan'}
                    </Button>
                  </div>
                  <p className="text-[12px] text-tertiary mt-3">
                    Belum punya kode? <Link to={user ? '/dashboard/qr?view=pilih' : '/qr/harga'} className="underline hover:text-primary">Beli paket</Link> atau cek status pesanan di halaman yang sama.
                  </p>
                </>
              )}
            </div>
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
              {user ? (
                <Button variant="secondary" icon={Save} className="w-full mt-2" disabled={!svg || saving} onClick={saveToAccount}>
                  {saving ? 'Menyimpan...' : 'Simpan ke akun'}
                </Button>
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
