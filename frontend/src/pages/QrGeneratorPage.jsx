import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
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
          toast({
            type: 'success',
            title: t('qr.generator.toast.licenseValid'),
            message: t('qr.generator.toast.licenseValidMsg', {
              plan: res.planLabel,
              date: new Date(res.expiresAt).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'id-ID'),
            }),
          });
        } else {
          toast({ type: 'error', title: res.expired ? t('qr.generator.toast.licenseExpired') : t('qr.generator.toast.licenseInvalid'), message: t('qr.generator.toast.licenseCheck') });
        }
      })
      .catch(() => toast({ type: 'error', title: t('qr.generator.toast.failed'), message: t('qr.generator.toast.serverError') }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToAccount = async () => {
    if (!target) return;
    if (!clearBg && colors.fg.toLowerCase() === colors.bg.toLowerCase()) {
      toast({ type: 'error', title: t('qr.generator.toast.colorInvalid'), message: t('qr.generator.toast.colorSame') });
      return;
    }
    setSaving(true);
    try {
      const saved = await saveMyQr({ link: target, fg: colors.fg, bg: colors.bg, logo: colors.logo });
      setSavedQr(saved);
      toast({ type: 'success', title: t('qr.generator.toast.savedTitle'), message: t('qr.generator.toast.savedMsg') });
    } catch (err) {
      toast({ type: 'error', title: t('qr.generator.toast.saveFailed'), message: err?.response?.data?.message || t('qr.generator.toast.tryLater') });
    } finally {
      setSaving(false);
    }
  };

  const placeOrder = () => {
    if (!target || tooLong) {
      toast({ type: 'error', title: t('qr.generator.toast.linkInvalid'), message: t('qr.generator.toast.linkInvalidMsg') });
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
      toast({ type: 'error', title: t('qr.generator.toast.failed'), message: t('qr.generator.toast.pngFailed') });
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
            {isPaid ? `Premium Gold ${orderPlan.label}` : freePremium ? t('qr.generator.titleAdmin') : t('qr.generator.title')}
          </h1>
          <p className="text-[14px] text-secondary leading-[22px] mt-1">
            {isPaid
              ? t('qr.generator.subtitlePaid')
              : freePremium
                ? t('qr.generator.subtitleAdmin')
              : t('qr.generator.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Pengaturan */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-card p-5">
              <label htmlFor="qr-link" className="flex items-center gap-2 text-[14px] font-medium text-primary mb-2">
                <Link2 size={16} strokeWidth={1.75} /> {t('qr.generator.linkLabel')}
              </label>
              <input
                id="qr-link"
                type="text"
                inputMode="url"
                placeholder={t('qr.generator.linkPlaceholder')}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                maxLength={1000}
                className="w-full h-[44px] px-3 rounded-md border border-border bg-card text-primary text-[14px] placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth"
              />
              {link && target !== link.trim() && (
                <p className="text-[12px] text-secondary mt-2">{t('qr.generator.willBeCreatedAs', { target })}</p>
              )}
              {linkInside && (
                <div className="mt-2 flex flex-col gap-2 rounded-md bg-amber-500/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="min-w-0 text-[12px] leading-relaxed text-amber-700 dark:text-amber-400">
                    {t('qr.generator.linkInside')}
                  </p>
                  <Button size="sm" variant="secondary" onClick={() => setLink(linkInside)} className="shrink-0">{t('qr.generator.useLinkOnly')}</Button>
                </div>
              )}
              {tooLong && <p className="text-[12px] text-danger mt-2">{t('qr.generator.tooLong')}</p>}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-primary">{t('qr.generator.appearance')}</h2>
                {isPaid ? (
                  <span className="premium-gold inline-flex items-center gap-1.5 text-[12px] font-semibold border rounded-full px-2.5 py-1">
                    <Crown size={13} strokeWidth={1.75} /> Premium Gold {orderPlan.label}
                  </span>
                ) : freePremium ? (
                  <span className="premium-gold inline-flex items-center gap-1.5 text-[12px] font-semibold border rounded-full px-2.5 py-1">
                    <Crown size={13} strokeWidth={1.75} /> {t('qr.generator.premiumFeature')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-secondary border border-border rounded-full px-2.5 py-1">
                    {t('qr.generator.freePlan')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ColorField id="qr-fg" label={t('qr.generator.fgLabel')} value={fg} onChange={setFg} presets={FG_PRESETS} />
                <ColorField id="qr-bg" label={t('qr.generator.bgLabel')} value={bg} onChange={setBg} presets={BG_PRESETS} allowTransparent />
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
                    <p className="text-[13px] font-medium text-primary">{t('qr.generator.logoTitle')}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-secondary">
                      {custom ? (
                        colors.logo ? t('qr.generator.logoShown') : t('qr.generator.logoHidden')
                      ) : (
                        <>
                          <Lock size={12} strokeWidth={1.75} aria-hidden="true" className="shrink-0" /> {t('qr.generator.logoRequired')}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {custom && (
                  <Switch size="md" checked={useLogo} onChange={setUseLogo} label={t('qr.generator.logoSwitch')} title={useLogo ? t('qr.generator.logoSwitchHide') : t('qr.generator.logoSwitchShow')} />
                )}
              </div>

              {sameColor && (
                <p className="mt-3 flex items-start gap-2 rounded-md bg-red-500/10 px-2.5 py-2 text-[12px] text-red-700 dark:text-red-400">
                  <AlertTriangle size={14} className="mt-[1px] shrink-0" />
                  {t('qr.generator.sameColor')}
                </p>
              )}

              {clearBg && (
                <p className="mt-3 rounded-md bg-blue-500/10 px-2.5 py-2 text-[12px] leading-relaxed text-blue-700 dark:text-blue-300">
                  {t('qr.generator.transparentNote')}
                </p>
              )}

              {lowContrast && (
                <p className="mt-3 flex items-start gap-2 rounded-md bg-amber-500/10 px-2.5 py-2 text-[12px] text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={14} className="mt-[1px] shrink-0" />
                  {t('qr.generator.lowContrast', { ratio: contrast.toFixed(1) })}
                </p>
              )}

              {!custom && (
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card-muted p-4">
                  <p className="text-[13px] text-secondary">
                    {t('qr.generator.upsell')}
                  </p>
                  <Link to={user ? '/dashboard/qr?view=pilih' : '/qr/harga'} className="shrink-0">
                    <Button variant="primary" size="sm" icon={Crown}>{t('qr.generator.seePlans')}</Button>
                  </Link>
                </div>
              )}
            </div>

            {isPaid && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-[15px] font-semibold text-primary mb-2">{t('qr.generator.orderSummary')}</h2>
                <p className="text-[13px] text-secondary">
                  {t('qr.generator.orderLine', { plan: orderPlan.label, note: orderPlan.note, price: rupiah(orderPlan.price) })}
                  {orderPlan.discount && orderPlan.basePrice > orderPlan.price && (
                    <>
                      {' '}
                      ({t('qr.generator.orderFrom')} <s>{rupiah(orderPlan.basePrice)}</s>, {t('qr.generator.orderSave', { amount: rupiah(orderPlan.basePrice - orderPlan.price) })})
                    </>
                  )}
                  .
                </p>
                <p className="text-[12px] text-tertiary mt-2">
                  {t('qr.generator.orderNote')}
                </p>
              </div>
            )}
          </div>

          {/* Pratinjau */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
              <div className="aspect-square w-full rounded-xl border border-border flex items-center justify-center overflow-hidden" style={previewSrc ? qrBackdropStyle(colors.bg) : { backgroundColor: clearBg ? '#FFFFFF' : colors.bg }}>
                {previewSrc ? (
                  <img src={previewSrc} alt={t('qr.generator.previewAlt')} className="w-full h-full object-contain p-3" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-tertiary px-6 text-center">
                    <QrCode size={40} strokeWidth={1.25} />
                    <span className="text-[13px]">{t('qr.generator.previewEmpty')}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="primary" icon={Download} onClick={downloadPng} disabled={!svg}>PNG</Button>
                <Button variant="secondary" icon={Download} onClick={downloadSvg} disabled={!svg}>SVG</Button>
              </div>

              {isPaid ? (
                <Button variant="primary" icon={ReceiptText} className="w-full mt-2" disabled={!svg || orderBusy} onClick={placeOrder}>
                  {orderBusy ? t('qr.generator.creatingOrder') : t('qr.generator.payNow', { price: rupiah(orderPlan.price) })}
                </Button>
              ) : user ? (
                <>
                  <Button variant="secondary" icon={Save} className="w-full mt-2" disabled={!svg || saving || isSaved} onClick={saveToAccount}>
                    {saving ? t('qr.generator.saving') : isSaved ? t('qr.generator.saved') : t('qr.generator.save')}
                  </Button>
                  {svg && !isSaved && (
                    <p className="mt-2 text-center text-[12px] leading-relaxed text-secondary">
                      {t('qr.generator.saveHint')}
                    </p>
                  )}
                </>
              ) : (
                <Link to="/masuk" className="mt-3 block text-center text-[13px] text-secondary underline hover:text-primary">
                  {t('qr.generator.loginToSave')}
                </Link>
              )}
              <p className="text-[12px] text-tertiary mt-3 text-center">
                {t('qr.generator.downloadNote')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </Wrap>
  );
}
