import React, { useMemo } from 'react';
import {
  Activity,
  ArrowRight,
  Check,
  Crown,
  Download,
  FileArchive,
  Film,
  Globe,
  Image as ImageIcon,
  Link2,
  Mail,
  Minimize2,
  Music,
  Play,
  Plus,
  QrCode,
  ShoppingBag,
  Upload,
  Users,
} from 'lucide-react';
import { buildQrSvg } from '../../lib/qrCode';

// Ilustrasi kartu beranda. Semuanya dibuat dari kode dan token warna, jadi tajam di semua ukuran
// dan otomatis mengikuti mode terang dan gelap. Aturan kit:
// - bagian putus-putus = yang kamu bawa (masukan)
// - kotak netral berbingkai = alatnya
// - satu bagian "tinta" (INK) = hasilnya. Hanya bagian ini yang berubah biru saat kartu di-hover.
// Ilustrasi bersifat dekoratif: pembungkusnya (panggung di FeatureCard) sudah aria-hidden.

const ICON = { size: 16, strokeWidth: 1.75, 'aria-hidden': true };
const INK = 'bg-accent-black text-card transition-all duration-200 ease-out group-hover:bg-blue-500';
const LEAD = 'flex-1 border-t border-dashed border-border-hover';

function Line({ tone = 'paper', className = '' }) {
  return (
    <span className={`block h-1.5 rounded-full ${tone === 'ink' ? 'bg-card opacity-40' : 'bg-border-hover'} ${className}`} />
  );
}

function Tag({ tone = 'paper', className = '', children }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-semibold leading-none ${
        tone === 'ink' ? 'bg-card text-primary' : 'border border-border bg-card-muted text-primary'
      } ${className}`}
    >
      {children}
    </span>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full border border-border bg-card px-2 text-[10px] font-medium leading-none text-secondary">
      {children}
    </span>
  );
}

function Connector() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-1">
      <ArrowRight {...ICON} />
    </span>
  );
}

// Strip "taruh file di sini". Pemanggil menentukan kapan tampil, mis. "hidden sm:flex".
function DropStrip({ display }) {
  return (
    <div className={`${display} h-9 w-[248px] items-center justify-center gap-2 rounded-md border border-dashed border-border-hover`}>
      <Upload {...ICON} className="text-secondary" />
      <Line className="w-16" />
    </div>
  );
}

/* ── Konverter: MP4 jadi MP3 ─────────────────────────────────────────────── */
const WAVE = [10, 18, 26, 14, 32, 20, 28, 12, 18];
const FORMATS = ['MOV', 'WAV', 'HEIC', 'WEBP', 'GIF'];

export function IllusConvert() {
  return (
    <div className="flex flex-col items-center gap-2.5 lg:gap-3">
      <DropStrip display="hidden sm:flex" />

      <div className="flex items-center gap-2">
        <div className="flex h-24 w-[84px] flex-col justify-between rounded-md border border-border bg-card p-2.5 lg:h-[108px] lg:w-[92px]">
          <div className="flex h-9 w-full items-center justify-center rounded-sm border border-border bg-card-muted lg:h-11">
            <Play {...ICON} className="text-secondary" />
          </div>
          <Line className="w-10" />
          <Tag className="self-start">MP4</Tag>
        </div>

        <div className="flex w-14 items-center">
          <span className={LEAD} />
          <Connector />
          <span className={LEAD} />
        </div>

        <div className={`flex h-24 w-[84px] flex-col justify-between rounded-md p-2.5 lg:h-[108px] lg:w-[92px] ${INK}`}>
          <div className="flex h-9 w-full items-center justify-between lg:h-11">
            {WAVE.map((height, i) => (
              <span key={i} className="w-[3px] rounded-full bg-card" style={{ height }} />
            ))}
          </div>
          <Line tone="ink" className="w-10" />
          <Tag tone="ink" className="self-start">MP3</Tag>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {FORMATS.map((f) => (
          <Pill key={f}>{f}</Pill>
        ))}
      </div>
    </div>
  );
}

/* ── Kompresor: file yang sama, lebih kecil ──────────────────────────────── */
export function IllusCompress() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-[112px] w-24 flex-col justify-between rounded-md border border-dashed border-border-hover p-2.5">
        <ImageIcon size={18} strokeWidth={1.75} aria-hidden="true" className="text-secondary" />
        <div className="flex flex-col gap-1.5">
          <Line className="w-14" />
          <Line className="w-9" />
          <span className="block h-2 w-full rounded-full bg-border-hover" />
        </div>
      </div>

      <div className="mb-[22px] flex w-12 items-center">
        <span className={LEAD} />
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary">
          <Minimize2 {...ICON} />
        </span>
        <span className={LEAD} />
      </div>

      <div className={`flex h-[72px] w-[60px] origin-bottom flex-col justify-between rounded-md p-2 motion-safe:group-hover:scale-90 ${INK}`}>
        <ImageIcon {...ICON} />
        <div className="flex flex-col gap-1.5">
          <Line tone="ink" className="w-8" />
          <span className="block h-2 w-4 rounded-full bg-card" />
        </div>
      </div>
    </div>
  );
}

/* ── Twibbon: foto di dalam frame, dibagikan lewat link ──────────────────── */
export function IllusTwibbon() {
  const face = 'h-6 w-6 rounded-full border-2 border-card-muted bg-border-hover';
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[108px] w-[108px] shrink-0 overflow-hidden rounded-md bg-card">
        <div className="absolute inset-0 transition-transform duration-200 ease-out motion-safe:group-hover:scale-110">
          <span className="absolute left-1/2 top-5 h-8 w-8 -translate-x-1/2 rounded-full bg-border-hover" />
          <span className="absolute bottom-0 left-1/2 h-11 w-[72px] -translate-x-1/2 rounded-t-full bg-border-hover" />
        </div>
        <span className="absolute inset-0 rounded-md border-[6px] border-accent-black transition-all duration-200 ease-out group-hover:border-blue-500" />
        <span className="absolute inset-x-0 bottom-0 flex h-6 items-center justify-center bg-accent-black transition-all duration-200 ease-out group-hover:bg-blue-500">
          <span className="block h-1.5 w-12 rounded-full bg-card" />
        </span>
      </div>

      <div className="flex w-[100px] flex-col gap-3">
        <span className="flex h-6 items-center gap-1.5 rounded-full border border-border bg-card px-2">
          <Link2 {...ICON} className="shrink-0 text-secondary" />
          <Line className="min-w-0 flex-1" />
        </span>
        <span className="flex items-center">
          <span className={face} />
          <span className={`-ml-2 ${face}`} />
          <span className={`-ml-2 ${face}`} />
          <Plus {...ICON} className="ml-1.5 text-secondary" />
        </span>
        <span className="flex h-6 items-center gap-1.5 rounded-full border border-border bg-card px-2">
          <Download {...ICON} className="shrink-0 text-secondary" />
          <Line className="w-8" />
        </span>
      </div>
    </div>
  );
}

/* ── QR Generator: link jadi QR sungguhan ────────────────────────────────── */
const BRACKET = 'absolute h-3.5 w-3.5 border-border-hover';

export function IllusQr() {
  // QR asli dari alamat halaman QR. Warnanya mengikuti warna teks kotak, jadi ikut tema dan hover.
  const qr = useMemo(() => {
    try {
      return buildQrSvg({ text: `${window.location.origin}/qr`, fg: 'currentColor', bg: 'none', size: 96 });
    } catch {
      return '';
    }
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="flex w-[92px] flex-col gap-2.5">
        <span className="flex h-7 items-center gap-1.5 rounded-sm border border-dashed border-border-hover bg-card px-2">
          <Link2 {...ICON} className="shrink-0 text-secondary" />
          <Line className="min-w-0 flex-1" />
        </span>
        <span className="flex items-center gap-1.5">
          <Crown {...ICON} className="text-secondary" />
          <Line className="w-10" />
        </span>
        <span className="flex items-center gap-1.5">
          <Tag>PNG</Tag>
          <Tag>SVG</Tag>
        </span>
      </div>

      <div className="relative flex h-[116px] w-[116px] shrink-0 items-center justify-center">
        <div className="relative h-[100px] w-[100px] rounded-md border border-border bg-card p-0.5 text-accent-black transition-all duration-200 ease-out group-hover:text-blue-500">
          {qr ? (
            <>
              <div className="h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
              <span className="absolute left-1/2 top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border border-border bg-card">
                <span className="block h-1.5 w-1.5 rounded-full bg-current" />
              </span>
            </>
          ) : (
            <span className="flex h-full w-full items-center justify-center text-secondary">
              <QrCode size={18} strokeWidth={1.75} aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="absolute inset-0 transition-transform duration-200 ease-out motion-safe:group-hover:scale-95">
          <span className={`${BRACKET} left-0 top-0 rounded-tl border-l-2 border-t-2`} />
          <span className={`${BRACKET} right-0 top-0 rounded-tr border-r-2 border-t-2`} />
          <span className={`${BRACKET} bottom-0 left-0 rounded-bl border-b-2 border-l-2`} />
          <span className={`${BRACKET} bottom-0 right-0 rounded-br border-b-2 border-r-2`} />
        </div>
      </div>
    </div>
  );
}

/* ── Linktree: link yang berserakan ngumpul di satu halaman ──────────────── */
function LinkChip({ icon: Icon, align, slide }) {
  return (
    <span className={`flex h-6 items-center gap-1 rounded-full border border-border bg-card px-1.5 transition-transform duration-200 ease-out ${slide} ${align}`}>
      <Icon {...ICON} className="shrink-0 text-secondary" />
      <Line className="w-4" />
    </span>
  );
}

export function IllusLinktree() {
  const toRight = 'motion-safe:group-hover:translate-x-1';
  const toLeft = 'motion-safe:group-hover:-translate-x-1';
  return (
    <div className="flex h-full items-stretch gap-3">
      <div className="flex w-[60px] flex-col justify-center gap-4">
        <LinkChip icon={ShoppingBag} align="self-start" slide={toRight} />
        <LinkChip icon={Play} align="self-end" slide={toRight} />
      </div>

      <div className="flex h-[128px] w-[104px] shrink-0 flex-col items-center self-end overflow-hidden rounded-t-xl border border-b-0 border-border-hover bg-card px-2.5 pt-3 sm:h-[144px]">
        <span className="block h-6 w-6 shrink-0 rounded-full bg-border-hover" />
        <span className="mt-1.5 block h-1.5 w-12 shrink-0 rounded-full bg-border-hover" />
        <span className="mt-1 block h-1 w-16 shrink-0 rounded-full bg-border" />
        <div className="mt-2.5 flex w-full shrink-0 flex-col gap-1.5">
          <span className={`flex h-[18px] shrink-0 items-center justify-center rounded-full ${INK}`}>
            <span className="block h-1 w-8 rounded-full bg-card" />
          </span>
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex h-[18px] shrink-0 items-center justify-center rounded-full border border-border bg-card-muted">
              <span className="block h-1 w-8 rounded-full bg-border-hover" />
            </span>
          ))}
        </div>
      </div>

      <div className="flex w-[60px] flex-col justify-center gap-4">
        <LinkChip icon={Mail} align="self-start" slide={toLeft} />
        <LinkChip icon={Globe} align="self-end" slide={toLeft} />
      </div>
    </div>
  );
}

/* ── Konversi Massal: antrean file jadi satu ZIP ─────────────────────────── */
function QueueRow({ icon: Icon, done = false, display = 'flex' }) {
  return (
    <span className={`${display} h-7 items-center gap-1.5 rounded-sm border border-border bg-card px-2`}>
      <Icon {...ICON} className="shrink-0 text-secondary" />
      <Line className="min-w-0 flex-1" />
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-primary">
        {done ? <Check {...ICON} /> : <span className="block h-3.5 w-3.5 rounded-full border-2 border-border-hover" />}
      </span>
    </span>
  );
}

export function IllusBatch() {
  return (
    <div className="flex flex-col items-center gap-3">
      <DropStrip display="hidden lg:flex" />

      <div className="flex items-center gap-2">
        <div className="flex w-[132px] flex-col gap-1.5">
          <QueueRow icon={ImageIcon} done />
          <QueueRow icon={Film} done />
          <QueueRow icon={Music} />
          <QueueRow icon={ImageIcon} display="hidden lg:flex" />
        </div>

        <div className="flex w-11 flex-col items-center gap-1.5">
          <Tag>WEBP</Tag>
          <Connector />
        </div>

        <div className={`flex h-[72px] w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-md ${INK}`}>
          <FileArchive size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="text-[10px] font-semibold leading-none tracking-wider">ZIP</span>
        </div>
      </div>
    </div>
  );
}

/* ── Statistik: dashboard live tanpa angka ───────────────────────────────── */
// Tinggi batang sengaja tidak naik terus, supaya grafik tidak mengklaim pertumbuhan.
const BARS = [24, 38, 28, 50, 34, 60, 42, 46];
const PEAK = 5;

export function IllusStats() {
  return (
    <div className="flex h-[120px] w-[240px] flex-col rounded-md border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-5 items-center gap-1.5 rounded-full border border-border bg-card-muted px-2 text-[10px] font-semibold leading-none text-primary">
          <span className="block h-1.5 w-1.5 rounded-full bg-success motion-safe:animate-pulse" />
          Live
        </span>
        <span className="flex items-center gap-1.5 text-secondary">
          <Users {...ICON} />
          <Activity {...ICON} />
        </span>
      </div>

      <div className="relative mt-2.5 flex-1">
        <span className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
        <span className="absolute inset-x-0 top-1/3 border-t border-dashed border-border" />
        <span className="absolute inset-x-0 top-2/3 border-t border-dashed border-border" />
        <span className="absolute inset-x-0 bottom-0 border-t border-border-hover" />
        <div className="absolute inset-0 flex items-end justify-between px-1">
          {BARS.map((height, i) => (
            <span
              key={i}
              className={`w-4 rounded-t ${
                i === PEAK
                  ? 'origin-bottom bg-accent-black transition-all duration-200 ease-out group-hover:bg-blue-500 motion-safe:group-hover:scale-y-105'
                  : 'bg-border-hover'
              }`}
              style={{ height }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
