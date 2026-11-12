import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Camera, CheckCheck, Copy, Download, Eye, FlipHorizontal, FlipVertical, ImagePlus, Move, RotateCcw, UserRound, ZoomIn, ZoomOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { getCampaignBySlug, trackCampaignUsage, trackCampaignView } from '../services/twibbonApi';

const OUTPUT_SIZE = 1080;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const angka = (n) => Number(n || 0).toLocaleString('id-ID');

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gambar tidak bisa dibuka.'));
    img.src = src;
  });

const TOOL_BTN =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-secondary transition-smooth hover:border-blue-500 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40';

// Halaman pakai Twibbon: pilih foto, atur posisi dan ukurannya di dalam bingkai, lalu unduh hasilnya.
export default function TwibbonViewPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const { addToast: toast } = useToast();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // pecahan dari lebar bingkai
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);
  const stageRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getCampaignBySlug(slug)
      .then((data) => {
        if (!alive) return;
        setCampaign(data);
        document.title = `${data.title} | OpenTools`;
        // Dilihat dihitung sekali per sesi browser untuk setiap Twibbon.
        try {
          const key = `tw-view:${data.id}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            trackCampaignView(data.id).catch(() => {});
          }
        } catch {
          trackCampaignView(data.id).catch(() => {});
        }
      })
      .catch(() => alive && setCampaign(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setFlipH(false);
    setFlipV(false);
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ type: 'error', title: 'File tidak bisa dipakai', message: 'Pilih file gambar (JPG, PNG, atau WebP).' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      reset();
    };
    reader.readAsDataURL(file);
  };

  // Geser foto dengan jari atau mouse.
  const onPointerDown = (e) => {
    if (!photo) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: offset };
  };
  const onPointerMove = (e) => {
    if (!drag.current || !stageRef.current) return;
    const size = stageRef.current.clientWidth || 1;
    setOffset({
      x: clamp(drag.current.start.x + (e.clientX - drag.current.x) / size, -1, 1),
      y: clamp(drag.current.start.y + (e.clientY - drag.current.y) / size, -1, 1),
    });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  // Gabungkan foto dan bingkai jadi satu gambar 1080 x 1080, dengan posisi yang sama seperti di pratinjau.
  const download = async () => {
    if (!photo || !campaign?.frameBase64) return;
    setProcessing(true);
    try {
      const [userImg, frameImg] = await Promise.all([loadImage(photo), loadImage(campaign.frameBase64)]);
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const side = Math.min(userImg.width, userImg.height);
      ctx.save();
      ctx.translate(OUTPUT_SIZE / 2 + offset.x * OUTPUT_SIZE, OUTPUT_SIZE / 2 + offset.y * OUTPUT_SIZE);
      ctx.scale(zoom * (flipH ? -1 : 1), zoom * (flipV ? -1 : 1));
      ctx.drawImage(userImg, (userImg.width - side) / 2, (userImg.height - side) / 2, side, side, -OUTPUT_SIZE / 2, -OUTPUT_SIZE / 2, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.restore();

      const fit = Math.min(OUTPUT_SIZE / frameImg.width, OUTPUT_SIZE / frameImg.height);
      const fw = frameImg.width * fit;
      const fh = frameImg.height * fit;
      ctx.drawImage(frameImg, (OUTPUT_SIZE - fw) / 2, (OUTPUT_SIZE - fh) / 2, fw, fh);

      const link = document.createElement('a');
      link.download = `twibbon-${campaign.slug}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      document.body.appendChild(link);
      link.click();
      link.remove();
      trackCampaignUsage(campaign.id).catch(() => {});
      toast({ type: 'success', title: 'Foto diunduh', message: 'Cek folder unduhan kamu.' });
    } catch {
      toast({ type: 'error', title: 'Gagal membuat foto', message: 'Coba pilih foto lain.' });
    } finally {
      setProcessing(false);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/c/${campaign.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ type: 'success', title: 'Link disalin', message: url });
    } catch {
      toast({ type: 'error', title: 'Gagal menyalin', message: `Salin manual: ${url}` });
    }
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-[13px] text-tertiary">{t('home.loading', 'Memuat...')}</div>;
  }

  if (!campaign) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[18px] font-semibold text-primary">{t('twibbon.not_found_title', 'Twibbon tidak ditemukan')}</p>
        <p className="text-[13px] text-secondary">{t('twibbon.not_found_desc', 'Twibbon ini sudah dihapus atau alamatnya salah.')}</p>
        <Link to="/campaigns" className="mt-2">
          <Button variant="primary">{t('twibbon.browse_campaigns', 'Lihat semua Twibbon')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="w-full px-4 pb-28 pt-6 sm:px-6 md:px-8">
      <div className="mx-auto w-full max-w-[960px]">
        <Link to="/campaigns" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-secondary transition-smooth hover:text-primary">
          <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" /> {t('twibbon.back_to_campaigns', 'Semua Twibbon')}
        </Link>

        <div className="grid gap-4 md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] md:gap-6">
          {/* Bingkai dan foto */}
          <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={`relative aspect-square w-full select-none overflow-hidden rounded-md bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-600 dark:to-zinc-800 ${
                photo ? 'cursor-grab touch-none active:cursor-grabbing' : ''
              }`}
            >
              {photo ? (
                <img
                  src={photo}
                  alt="Foto kamu"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ transform: `translate(${offset.x * 100}%, ${offset.y * 100}%) scale(${zoom * (flipH ? -1 : 1)}, ${zoom * (flipV ? -1 : 1)})` }}
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-white/70">
                  <UserRound strokeWidth={1.25} aria-hidden="true" className="h-[42%] w-[42%]" />
                </span>
              )}
              <img src={campaign.frameBase64} alt={`Bingkai ${campaign.title}`} draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
            </div>

            {photo && (
              <div className="mt-3">
                <p className="mb-2 flex items-center gap-1.5 text-[12px] text-secondary">
                  <Move size={13} strokeWidth={1.75} aria-hidden="true" /> Geser foto untuk mengatur posisinya.
                </p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setZoom((z) => clamp(z - 0.1, ZOOM_MIN, ZOOM_MAX))} disabled={zoom <= ZOOM_MIN} title={t('twibbon.zoom_out', 'Perkecil')} aria-label={t('twibbon.zoom_out', 'Perkecil')} className={TOOL_BTN}>
                    <ZoomOut size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <input
                    type="range"
                    min={ZOOM_MIN}
                    max={ZOOM_MAX}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    aria-label="Ukuran foto"
                    className="h-1.5 min-w-0 flex-1 cursor-pointer accent-blue-500"
                  />
                  <button type="button" onClick={() => setZoom((z) => clamp(z + 0.1, ZOOM_MIN, ZOOM_MAX))} disabled={zoom >= ZOOM_MAX} title={t('twibbon.zoom_in', 'Perbesar')} aria-label={t('twibbon.zoom_in', 'Perbesar')} className={TOOL_BTN}>
                    <ZoomIn size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <span aria-hidden="true" className="h-5 w-px bg-border" />
                  <button type="button" onClick={() => setFlipH((v) => !v)} aria-pressed={flipH} title={t('twibbon.flip_horizontal', 'Balik kiri-kanan')} aria-label={t('twibbon.flip_horizontal', 'Balik kiri-kanan')} className={TOOL_BTN}>
                    <FlipHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => setFlipV((v) => !v)} aria-pressed={flipV} title={t('twibbon.flip_vertical', 'Balik atas-bawah')} aria-label={t('twibbon.flip_vertical', 'Balik atas-bawah')} className={TOOL_BTN}>
                    <FlipVertical size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={reset} title="Kembalikan posisi awal" aria-label="Kembalikan posisi awal" className={TOOL_BTN}>
                    <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Keterangan dan langkah */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <h1 className="text-[20px] font-semibold leading-snug text-primary sm:text-[24px]">{campaign.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-secondary">
                <span>{t('twibbon.by', 'oleh')} <span className="font-medium text-primary">{campaign.creatorName || t('twibbon.anonymous', 'Anonim')}</span></span>
                <span className="inline-flex items-center gap-1" title={t('twibbon.views', 'Dilihat')}><Eye size={13} strokeWidth={1.75} aria-hidden="true" /> {angka(campaign.views)}</span>
                <span className="inline-flex items-center gap-1" title={t('twibbon.downloads', 'Dipakai')}><Download size={13} strokeWidth={1.75} aria-hidden="true" /> {angka(campaign.usage)}</span>
              </div>
              {campaign.description && <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-secondary [overflow-wrap:anywhere] sm:text-[14px]">{campaign.description}</p>}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
              <ol className="grid gap-3 text-[13px] text-secondary">
                {[
                  ['Pilih foto dari perangkatmu.', Boolean(photo)],
                  ['Geser dan perbesar sampai pas di bingkai.', false],
                  ['Unduh hasilnya, lalu bagikan.', false],
                ].map(([text, done], i) => (
                  <li key={text} className="flex items-start gap-2.5">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${done ? 'bg-emerald-500 text-white' : 'bg-card-muted text-secondary'}`}>{i + 1}</span>
                    <span className="leading-5">{text}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {photo ? (
                  <>
                    <Button variant="primary" icon={Download} onClick={download} disabled={processing} className="w-full">
                      {processing ? t('twibbon.processing', 'Memproses...') : t('twibbon.download', 'Unduh hasil')}
                    </Button>
                    <Button variant="secondary" icon={Camera} onClick={() => fileRef.current?.click()} className="w-full">
                      {t('twibbon.change_photo', 'Ganti foto')}
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" icon={Camera} onClick={() => fileRef.current?.click()} className="w-full sm:col-span-2">
                    {t('twibbon.choose_photo', 'Pilih foto kamu')}
                  </Button>
                )}
              </div>
              <p className="mt-3 text-[11px] text-tertiary">Fotomu diproses di perangkat ini saja dan tidak diunggah ke server.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" icon={copied ? CheckCheck : Copy} onClick={copyLink}>
                {copied ? 'Link disalin' : 'Salin link Twibbon'}
              </Button>
              <Link to="/dashboard/twibbon/baru">
                <Button size="sm" variant="ghost" icon={ImagePlus}>Buat Twibbon sendiri</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
