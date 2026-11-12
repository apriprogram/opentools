import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, Camera, CheckCheck, Copy, Download, Eye, FlipHorizontal, FlipVertical, ImagePlus, Loader2, Move, RotateCcw, Share2, UserRound, X,
  ZoomIn, ZoomOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { brandIcon } from '../components/linktree/brandIcons';
import { frameHasHole } from '../lib/twibbonFrame';
import { getCampaignBySlug, trackCampaignUsage, trackCampaignView } from '../services/twibbonApi';

const OUTPUT_SIZE = 1080;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const PHOTO_MAX_BYTES = 30 * 1024 * 1024;
const PHOTO_MAX_SIDE = 2000;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const angka = (n) => Number(n || 0).toLocaleString('id-ID');

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gambar tidak bisa dibuka.'));
    img.src = src;
  });

// Baca file foto sambil melaporkan kemajuannya (0 sampai 1).
const readFile = (file, onProgress) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    reader.onerror = () => reject(new Error('File tidak bisa dibaca.'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

// Beri kesempatan layar menggambar ulang (misalnya menampilkan tanda memuat) sebelum pekerjaan berat dimulai.
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

const WhatsappIcon = brandIcon('whatsapp');
const FacebookIcon = brandIcon('facebook');
const XIcon = brandIcon('x');
const TelegramIcon = brandIcon('telegram');

// Gaya halaman ini mengikuti tampilan iPhone: kartu kaca buram dengan sudut besar di atas latar yang diambil
// dari warna bingkai, tombol bulat, dan daftar berkelompok. Warna kaca memakai putih atau gelap tembus pandang
// supaya tetap terbaca di mode terang maupun gelap.
const GLASS =
  'rounded-[28px] border border-white/70 bg-white/70 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/65';
const GLASS_PILL =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 text-[13px] font-medium text-primary backdrop-blur-xl transition-[transform,background-color] duration-150 hover:bg-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100 dark:border-white/10 dark:bg-zinc-900/65 dark:hover:bg-zinc-800';
const PRIMARY_PILL =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-500 px-5 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(59,130,246,0.9)] transition-[transform,background-color] duration-150 hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100';
const TOOL_BTN =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900/[0.06] text-primary transition-[transform,background-color] duration-150 hover:bg-zinc-900/[0.12] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100 dark:bg-white/10 dark:hover:bg-white/20 aria-pressed:bg-blue-500 aria-pressed:text-white';

// Lembar "Bagikan": bagikan fotonya lewat menu bagikan perangkat (bila didukung), atau bagikan link Twibbon
// ke media sosial. Media sosial tidak menerima foto lewat tautan, jadi untuk itu fotonya diunduh dulu.
function ShareSheet({ title, url, resultUrl, canShareFile, onShareFile, onDownload, onCopy, copied, onClose }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const text = `Yuk pakai Twibbon "${title}"`;
  const link = encodeURIComponent(url);
  const message = encodeURIComponent(`${text}: ${url}`);
  const targets = [
    { name: 'WhatsApp', icon: WhatsappIcon, color: '#25D366', href: `https://wa.me/?text=${message}` },
    { name: 'Facebook', icon: FacebookIcon, color: '#0866FF', href: `https://www.facebook.com/sharer/sharer.php?u=${link}` },
    { name: 'X', icon: XIcon, color: '#000000', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${link}` },
    { name: 'Telegram', icon: TelegramIcon, color: '#26A5E4', href: `https://t.me/share/url?url=${link}&text=${encodeURIComponent(text)}` },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4" onClick={() => closeRef.current()} role="dialog" aria-modal="true" aria-label="Bagikan Twibbon">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.6)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/90"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-bold tracking-tight text-primary">Bagikan</h2>
          <button type="button" onClick={() => closeRef.current()} aria-label="Tutup" className={`${TOOL_BTN} h-9 w-9`}>
            <X size={17} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[20px] bg-zinc-900/[0.04] p-3 dark:bg-white/[0.06]">
          {resultUrl && <img src={resultUrl} alt="Hasil Twibbon kamu" className="h-16 w-16 shrink-0 rounded-[14px] object-cover" />}
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-primary [overflow-wrap:anywhere]">{title}</p>
            <p className="mt-0.5 truncate text-[12px] text-secondary">{url.replace(/^https?:\/\//, '')}</p>
          </div>
        </div>

        {canShareFile && (
          <button type="button" onClick={onShareFile} className={`${PRIMARY_PILL} mt-4`}>
            <Share2 size={17} strokeWidth={2} aria-hidden="true" /> Bagikan fotonya
          </button>
        )}

        <p className="mb-2 mt-4 text-[12px] font-medium text-secondary">Bagikan link Twibbon ke</p>
        <div className="grid grid-cols-4 gap-2">
          {targets.map((target) => (
            <a key={target.name} href={target.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 rounded-[18px] p-2 transition-colors duration-150 hover:bg-zinc-900/[0.05] dark:hover:bg-white/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: target.color }}>
                <target.icon size={22} />
              </span>
              <span className="text-[11px] text-primary">{target.name}</span>
            </a>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCopy} className={`${GLASS_PILL} w-full bg-zinc-900/[0.05] dark:bg-white/10`}>
            {copied ? <CheckCheck size={15} strokeWidth={2} aria-hidden="true" /> : <Copy size={15} strokeWidth={1.75} aria-hidden="true" />}
            {copied ? 'Disalin' : 'Salin link'}
          </button>
          <button type="button" onClick={onDownload} className={`${GLASS_PILL} w-full bg-zinc-900/[0.05] dark:bg-white/10`}>
            <Download size={15} strokeWidth={1.75} aria-hidden="true" /> Unduh foto
          </button>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-tertiary">
          {canShareFile
            ? 'Tombol Bagikan fotonya membuka menu bagikan perangkatmu, jadi fotonya bisa langsung dikirim ke aplikasi lain.'
            : 'Media sosial tidak bisa menerima foto lewat tautan. Unduh fotonya dulu, lalu lampirkan saat membuat postingan.'}
        </p>
      </div>
    </div>,
    document.body
  );
}

// Halaman pakai Twibbon: pilih foto, atur posisi dan ukurannya di dalam bingkai, lalu unduh atau bagikan hasilnya.
export default function TwibbonViewPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const { addToast: toast } = useToast();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [frameOpaque, setFrameOpaque] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoLoad, setPhotoLoad] = useState(null); // { percent, label } selama foto dimuat
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // pecahan dari lebar bingkai
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [processing, setProcessing] = useState(''); // '' | 'download' | 'share'
  const [copied, setCopied] = useState(false);
  const [share, setShare] = useState(null); // { blob, url } hasil yang sedang dibagikan
  const fileRef = useRef(null);
  const stageRef = useRef(null);
  const drag = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFrameOpaque(false);
    getCampaignBySlug(slug)
      .then((data) => {
        if (!alive) return;
        setCampaign(data);
        document.title = `${data.title} | OpenTools`;
        // Bingkai tanpa area transparan menutupi foto. Diberi tahu sejak awal supaya tidak membingungkan.
        frameHasHole(data.frameBase64)
          .then((ok) => alive && setFrameOpaque(!ok))
          .catch(() => {});
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

  // Alamat sementara untuk pratinjau hasil dilepas saat lembar bagikan ditutup.
  useEffect(() => () => {
    if (share?.url) URL.revokeObjectURL(share.url);
  }, [share]);

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setFlipH(false);
    setFlipV(false);
  };

  // Muat foto: periksa jenis dan ukurannya, baca dengan penanda kemajuan, lalu perkecil foto yang sangat besar.
  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const ext = (file.name.split('.').pop() || '').toUpperCase();
    if (!file.type.startsWith('image/')) {
      toast({
        type: 'error',
        title: 'File ini bukan foto',
        message: `File ${ext || 'ini'} tidak bisa dipasang di Twibbon. Pilih foto berformat JPG, PNG, atau WebP.`,
      });
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      toast({ type: 'error', title: 'Foto terlalu besar', message: 'Ukuran foto maksimal 30 MB. Pilih foto lain atau perkecil dulu.' });
      return;
    }
    setPhotoLoad({ percent: 0, label: 'Membaca foto...' });
    try {
      const raw = await readFile(file, (p) => setPhotoLoad({ percent: Math.round(p * 70), label: 'Membaca foto...' }));
      setPhotoLoad({ percent: 75, label: 'Menyiapkan foto...' });
      await nextFrame();
      let img;
      try {
        img = await loadImage(raw);
      } catch {
        throw new Error(
          `Foto ${ext || ''} ini tidak bisa dibuka browser. Format seperti HEIC belum didukung. Ubah dulu ke JPG atau PNG, lalu coba lagi.`.replace('  ', ' ')
        );
      }
      // Foto dari kamera bisa sangat besar. Diperkecil supaya geser dan zoom tetap lancar.
      const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(img.width, img.height));
      let prepared = raw;
      if (scale < 1) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        prepared = canvas.toDataURL('image/jpeg', 0.92);
      }
      setPhotoLoad({ percent: 100, label: 'Foto siap' });
      await nextFrame();
      setPhoto(prepared);
      reset();
      toast({ type: 'success', title: 'Foto terpasang', message: 'Geser dan perbesar sampai pas di bingkai.' });
    } catch (err) {
      toast({ type: 'error', title: 'Foto gagal dimuat', message: err.message || 'Coba pilih foto lain.' });
    } finally {
      setPhotoLoad(null);
    }
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
  const renderResult = async () => {
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

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    if (!blob) throw new Error('Gambar tidak bisa dibuat.');
    return blob;
  };

  const fileName = () => `twibbon-${campaign.slug}.jpg`;

  const saveBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName();
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // "Dipakai" dihitung sekali per kunjungan, saat hasilnya pertama kali diunduh atau dibagikan.
  const countUsage = () => {
    if (counted.current) return;
    counted.current = true;
    trackCampaignUsage(campaign.id).catch(() => {});
  };

  const download = async () => {
    if (!photo || processing) return;
    setProcessing('download');
    try {
      await nextFrame();
      saveBlob(await renderResult());
      countUsage();
      toast({ type: 'success', title: 'Foto diunduh', message: 'Cek folder unduhan kamu.' });
    } catch {
      toast({ type: 'error', title: 'Gagal membuat foto', message: 'Coba pilih foto lain.' });
    } finally {
      setProcessing('');
    }
  };

  const openShare = async () => {
    if (!photo || processing) return;
    setProcessing('share');
    try {
      await nextFrame();
      const blob = await renderResult();
      setShare({ blob, url: URL.createObjectURL(blob) });
    } catch {
      toast({ type: 'error', title: 'Gagal menyiapkan foto', message: 'Coba pilih foto lain.' });
    } finally {
      setProcessing('');
    }
  };

  const pageUrl = () => `${window.location.origin}/c/${campaign.slug}`;
  const shareFile = () => (share ? new File([share.blob], fileName(), { type: 'image/jpeg' }) : null);
  const canShareFile = Boolean(share) && typeof navigator.canShare === 'function' && navigator.canShare({ files: [shareFile()] });

  const shareNative = async () => {
    try {
      await navigator.share({ files: [shareFile()], title: campaign.title, text: `Twibbon "${campaign.title}" ${pageUrl()}` });
      countUsage();
    } catch (err) {
      // Dibatalkan pengguna bukan kesalahan.
      if (err?.name !== 'AbortError') toast({ type: 'error', title: 'Gagal membagikan', message: 'Unduh fotonya, lalu bagikan dari galeri.' });
    }
  };

  const copyLink = async () => {
    const url = pageUrl();
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

  const adjusted = zoom !== 1 || offset.x !== 0 || offset.y !== 0 || flipH || flipV;
  const busy = Boolean(processing) || Boolean(photoLoad);
  const steps = [
    ['Pilih foto', 'Ambil dari galeri atau kamera perangkatmu.', Boolean(photo)],
    ['Atur posisinya', 'Geser foto dan perbesar sampai pas di bingkai.', Boolean(photo) && adjusted],
    ['Unduh atau bagikan', 'Hasilnya berukuran 1080 x 1080 piksel.', false],
  ];
  // Lingkaran kemajuan: keliling lingkaran berjari-jari 26.
  const RING = 2 * Math.PI * 26;

  return (
    <main className="relative isolate w-full overflow-hidden px-4 pb-28 pt-5 sm:px-6 sm:pt-8 md:px-8">
      {/* Latar: bingkai yang dibesarkan dan diburamkan, memberi warna ke kaca di atasnya */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <img src={campaign.frameBase64} alt="" className="absolute left-1/2 top-0 h-[720px] w-[720px] max-w-none -translate-x-1/2 -translate-y-1/4 scale-150 opacity-50 blur-[90px] saturate-150 dark:opacity-40" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to bottom, transparent, var(--bg-page) 78%)' }} />
      </div>

      <div className="mx-auto w-full max-w-[980px]">
        <Link to="/campaigns" className={`${GLASS_PILL} mb-4 h-9 px-3.5 text-[13px] text-blue-600 dark:text-blue-400 sm:mb-5`}>
          <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" /> {t('twibbon.back_to_campaigns', 'Semua Twibbon')}
        </Link>

        <div className="grid gap-4 md:grid-cols-[minmax(0,460px)_minmax(0,1fr)] md:gap-6">
          {/* Bingkai dan foto */}
          <div className={`${GLASS} self-start p-3 sm:p-4`}>
            <div
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={`relative aspect-square w-full select-none overflow-hidden rounded-[20px] bg-gradient-to-br from-zinc-200 to-zinc-400 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:from-zinc-600 dark:to-zinc-800 ${
                photo && !busy ? 'cursor-grab touch-none active:cursor-grabbing' : ''
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

              {/* Tanda memuat: foto sedang dibaca, atau hasil sedang dibuat */}
              {busy && (
                <div role="status" aria-live="polite" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 text-white backdrop-blur-sm">
                  {photoLoad ? (
                    <>
                      <span className="relative flex h-16 w-16 items-center justify-center">
                        <svg viewBox="0 0 60 60" className="h-16 w-16 -rotate-90" aria-hidden="true">
                          <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="5" />
                          <circle
                            cx="30"
                            cy="30"
                            r="26"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={RING}
                            strokeDashoffset={RING * (1 - photoLoad.percent / 100)}
                            className="transition-[stroke-dashoffset] duration-200 motion-reduce:transition-none"
                          />
                        </svg>
                        <span className="absolute text-[13px] font-semibold tabular-nums">{photoLoad.percent}%</span>
                      </span>
                      <span className="text-[13px] font-medium">{photoLoad.label}</span>
                    </>
                  ) : (
                    <>
                      <Loader2 size={34} strokeWidth={2} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                      <span className="text-[13px] font-medium">{processing === 'share' ? 'Menyiapkan foto untuk dibagikan...' : 'Membuat foto...'}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {frameOpaque && (
              <p className="mt-3 flex items-start gap-2 rounded-[18px] bg-amber-500/15 px-3.5 py-3 text-[12px] leading-relaxed text-amber-800 dark:text-amber-300">
                <AlertTriangle size={15} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span>
                  Bingkai ini belum punya area transparan, jadi foto tertutup bingkainya. Pembuatnya bisa memperbaikinya di menu Twibbon, lewat tombol Buat area foto.
                </span>
              </p>
            )}

            {photo ? (
              <div className="mt-3 rounded-[20px] bg-zinc-900/[0.04] p-3 dark:bg-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <ZoomOut size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-secondary" />
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
                  <ZoomIn size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-secondary" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-1.5 text-[12px] text-secondary">
                    <Move size={13} strokeWidth={1.75} aria-hidden="true" className="shrink-0" /> Geser foto untuk mengatur posisinya
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button type="button" onClick={() => setFlipH((v) => !v)} aria-pressed={flipH} title={t('twibbon.flip_horizontal', 'Balik kiri-kanan')} aria-label={t('twibbon.flip_horizontal', 'Balik kiri-kanan')} className={TOOL_BTN}>
                      <FlipHorizontal size={17} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => setFlipV((v) => !v)} aria-pressed={flipV} title={t('twibbon.flip_vertical', 'Balik atas-bawah')} aria-label={t('twibbon.flip_vertical', 'Balik atas-bawah')} className={TOOL_BTN}>
                      <FlipVertical size={17} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={reset} disabled={!adjusted} title="Kembalikan posisi awal" aria-label="Kembalikan posisi awal" className={TOOL_BTN}>
                      <RotateCcw size={17} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[20px] bg-zinc-900/[0.04] px-4 py-3 text-[13px] font-medium text-blue-600 transition-colors duration-150 hover:bg-zinc-900/[0.08] disabled:opacity-60 dark:bg-white/[0.06] dark:text-blue-400 dark:hover:bg-white/[0.12]"
              >
                <Camera size={16} strokeWidth={1.75} aria-hidden="true" /> Ketuk untuk memasang fotomu di bingkai ini
              </button>
            )}
          </div>

          {/* Keterangan dan langkah */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className={`${GLASS} p-5 sm:p-6`}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-blue-600 dark:text-blue-400">Twibbon</p>
              <h1 className="mt-1 text-[26px] font-bold leading-[1.15] tracking-tight text-primary [overflow-wrap:anywhere] sm:text-[32px]">{campaign.title}</h1>
              <div className="mt-3 flex items-center gap-2.5">
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[13px] font-semibold text-white">
                  {(campaign.creatorName || 'A').slice(0, 1).toUpperCase()}
                </span>
                <p className="min-w-0 text-[13px] leading-tight text-secondary">
                  {t('twibbon.by', 'oleh')}{' '}
                  <span className="font-medium text-primary [overflow-wrap:anywhere]">{campaign.creatorName || t('twibbon.anonymous', 'Anonim')}</span>
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-[18px] bg-zinc-900/[0.04] px-3.5 py-2.5 dark:bg-white/[0.06]">
                  <p className="flex items-center gap-1.5 text-[11px] text-secondary"><Eye size={13} strokeWidth={1.75} aria-hidden="true" /> {t('twibbon.views', 'Dilihat')}</p>
                  <p className="mt-0.5 text-[18px] font-semibold leading-tight text-primary">{angka(campaign.views)}</p>
                </div>
                <div className="rounded-[18px] bg-zinc-900/[0.04] px-3.5 py-2.5 dark:bg-white/[0.06]">
                  <p className="flex items-center gap-1.5 text-[11px] text-secondary"><Download size={13} strokeWidth={1.75} aria-hidden="true" /> {t('twibbon.downloads', 'Dipakai')}</p>
                  <p className="mt-0.5 text-[18px] font-semibold leading-tight text-primary">{angka(campaign.usage)}</p>
                </div>
              </div>
              {campaign.description && <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-secondary [overflow-wrap:anywhere]">{campaign.description}</p>}
            </div>

            <div className={`${GLASS} p-4 sm:p-5`}>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
              {/* Daftar berkelompok: tiap langkah satu baris, dipisah garis tipis */}
              <ol className="divide-y divide-zinc-900/[0.08] overflow-hidden rounded-[20px] bg-zinc-900/[0.04] dark:divide-white/10 dark:bg-white/[0.06]">
                {steps.map(([title, text, done], i) => (
                  <li key={title} className="flex items-center gap-3 px-3.5 py-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white ${done ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                      {done ? <CheckCheck size={14} strokeWidth={2.25} aria-hidden="true" /> : i + 1}
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block text-[14px] font-medium text-primary">{title}{done && <span className="sr-only"> (selesai)</span>}</span>
                      <span className="mt-0.5 block text-[12px] text-secondary">{text}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-4 grid gap-2">
                {photo ? (
                  <>
                    <button type="button" onClick={download} disabled={busy} className={PRIMARY_PILL}>
                      {processing === 'download' ? <Loader2 size={18} strokeWidth={2} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Download size={18} strokeWidth={2} aria-hidden="true" />}
                      {processing === 'download' ? t('twibbon.processing', 'Memproses...') : t('twibbon.download', 'Unduh hasil')}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={openShare} disabled={busy} className={`${GLASS_PILL} h-11 w-full`}>
                        {processing === 'share' ? <Loader2 size={16} strokeWidth={2} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Share2 size={16} strokeWidth={1.75} aria-hidden="true" />}
                        Bagikan
                      </button>
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={`${GLASS_PILL} h-11 w-full`}>
                        <Camera size={16} strokeWidth={1.75} aria-hidden="true" /> {t('twibbon.change_photo', 'Ganti foto')}
                      </button>
                    </div>
                  </>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={PRIMARY_PILL}>
                    {photoLoad ? <Loader2 size={18} strokeWidth={2} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Camera size={18} strokeWidth={2} aria-hidden="true" />}
                    {photoLoad ? 'Memuat foto...' : t('twibbon.choose_photo', 'Pilih foto kamu')}
                  </button>
                )}
              </div>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-tertiary">Fotomu diproses di perangkat ini saja dan tidak diunggah ke server.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={copyLink} className={GLASS_PILL}>
                {copied ? <CheckCheck size={15} strokeWidth={2} aria-hidden="true" /> : <Copy size={15} strokeWidth={1.75} aria-hidden="true" />}
                {copied ? 'Link disalin' : 'Salin link Twibbon'}
              </button>
              <Link to="/dashboard/twibbon/baru" className={GLASS_PILL}>
                <ImagePlus size={15} strokeWidth={1.75} aria-hidden="true" /> Buat Twibbon sendiri
              </Link>
            </div>
          </div>
        </div>
      </div>

      {share && (
        <ShareSheet
          title={campaign.title}
          url={pageUrl()}
          resultUrl={share.url}
          canShareFile={canShareFile}
          onShareFile={shareNative}
          onDownload={() => {
            saveBlob(share.blob);
            countUsage();
            toast({ type: 'success', title: 'Foto diunduh', message: 'Cek folder unduhan kamu.' });
          }}
          onCopy={copyLink}
          copied={copied}
          onClose={() => setShare(null)}
        />
      )}
    </main>
  );
}
