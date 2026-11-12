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
  Users,
} from 'lucide-react';
import { buildQrSvg } from '../../lib/qrCode';

// Ilustrasi kartu beranda: benda 3D padat yang dibuat dari kode, jadi tajam di semua ukuran.
// Panggung di FeatureCard memiringkan seluruh ilustrasi, dan saat kursor ada di atas kartu ilustrasinya
// miring mengikuti kursor. Tanpa kursor ilustrasi diam.
//
// Cara membangun kedalaman (kelasnya ada di index.css):
// - <Solid>: benda bertebal. Wajah depannya ditumpuk dengan beberapa lapisan sisi ke belakang.
//   tone "white" = hasil (putih pekat), "glass" = masukan atau alat (kaca), "metal" = bingkai ponsel.
// - "p3d" meneruskan ruang 3D ke anak, "lift-1" sampai "lift-3" memajukan bagian ke arah mata.
// Warna teks dan ikon di wajah putih memakai --tone-ink, warna gelap dari kartu tempat ilustrasi berada.
// Ilustrasi bersifat dekoratif: pembungkusnya (panggung di FeatureCard) sudah aria-hidden.

const ICON = { size: 16, strokeWidth: 1.75, 'aria-hidden': true };
const LEAD = 'flex-1 border-t border-dashed border-white/60';
const INK_TEXT = 'text-[color:var(--tone-ink)]';
const INK_BG = 'bg-[color:var(--tone-ink)]';
const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

function Solid({ tone = 'glass', depth = 8, className = '', face = '', style, children }) {
  return (
    // Posisi bawaan relative, kecuali pemanggil menaruhnya secara absolute (mis. tumpukan file).
    <div className={`p3d shrink-0 ${className.includes('absolute') ? '' : 'relative'} ${className}`} style={style}>
      {range(depth).map((z) => (
        <span key={z} className={`solid-edge solid-edge-${tone}`} style={{ transform: `translateZ(-${z}px)` }} />
      ))}
      <div className={`p3d solid-face solid-face-${tone} relative h-full w-full ${face}`}>{children}</div>
    </div>
  );
}

// Garis teks tiruan. on: wajah tempat garis berada.
function Stroke({ on = 'glass', className = '' }) {
  return <span className={`block h-1.5 rounded-full ${on === 'white' ? `${INK_BG} opacity-25` : 'bg-white/55'} ${className}`} />;
}

// Label format kecil (MP4, ZIP, dan lainnya).
function Badge({ on = 'glass', className = '', children }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-semibold leading-none text-white ${
        on === 'white' ? INK_BG : 'bg-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]'
      } ${className}`}
    >
      {children}
    </span>
  );
}

// Keping kaca kecil yang melayang (link, tombol, format).
function Chip({ className = '', children }) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-full bg-white/25 px-2 text-[10px] font-medium leading-none text-white shadow-[inset_1px_1px_0.5px_rgba(255,255,255,0.6),0_10px_14px_-10px_rgba(0,0,0,0.5)] ${className}`}
    >
      {children}
    </span>
  );
}

function Connector({ icon: Icon = ArrowRight, className = '' }) {
  return (
    <div className={`flex items-center ${className}`}>
      <span className={LEAD} />
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/30 text-white shadow-[inset_1px_1px_0.5px_rgba(255,255,255,0.65),0_10px_14px_-10px_rgba(0,0,0,0.55)] transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-1">
        <Icon {...ICON} />
      </span>
      <span className={LEAD} />
    </div>
  );
}

// File 3D: lembar bertebal dengan sudut kanan atas terlipat.
function File3D({ tone = 'glass', depth = 8, className = 'h-24 w-[76px]', children }) {
  return (
    <Solid tone={tone} depth={depth} className={`rounded-lg ${className}`} face="flex flex-col justify-between p-2.5">
      <span className={`absolute right-0 top-0 h-4 w-4 rounded-bl-md rounded-tr-lg ${tone === 'white' ? `${INK_BG} opacity-20` : 'bg-white/40'}`} />
      {children}
    </Solid>
  );
}

/* ── Konverter: file MP4 jadi file MP3 ───────────────────────────────────── */
const WAVE = [10, 18, 26, 14, 30, 20, 26, 12];
const FORMATS = ['MOV', 'WAV', 'HEIC', 'WEBP', 'GIF'];

export function IllusConvert() {
  return (
    <div className="p3d flex flex-col items-center gap-3">
      <div className="p3d flex items-center gap-2">
        <File3D className="lift-1 h-[100px] w-[78px]">
          <Play size={18} strokeWidth={1.75} aria-hidden="true" className="lift-1 text-white" />
          <div className="p3d flex flex-col gap-1.5">
            <Stroke className="w-10" />
            <Badge className="lift-1 self-start">MP4</Badge>
          </div>
        </File3D>

        <Connector className="lift-2 w-14" />

        <File3D tone="white" depth={10} className="lift-3 h-[100px] w-[78px]">
          <div className={`lift-1 flex h-8 w-full items-center justify-between pr-3 ${INK_TEXT}`}>
            {WAVE.map((height, i) => (
              <span key={i} className="w-[3px] rounded-full bg-current" style={{ height }} />
            ))}
          </div>
          <div className="p3d flex flex-col gap-1.5">
            <Stroke on="white" className="w-10" />
            <Badge on="white" className="lift-1 self-start">MP3</Badge>
          </div>
        </File3D>
      </div>

      <div className="p3d hidden items-center gap-1.5 sm:flex">
        {FORMATS.map((f, i) => (
          <Chip key={f} className={i % 2 ? 'lift-2' : 'lift-1'}>{f}</Chip>
        ))}
      </div>
    </div>
  );
}

/* ── Kompresor: file yang sama, lebih kecil ──────────────────────────────── */
export function IllusCompress() {
  return (
    <div className="p3d flex items-end gap-2">
      <File3D depth={12} className="lift-1 h-[116px] w-[92px]">
        <ImageIcon size={20} strokeWidth={1.75} aria-hidden="true" className="lift-1 text-white" />
        <div className="flex flex-col gap-1.5">
          <Stroke className="w-14" />
          <Stroke className="w-9" />
          <span className="block h-2 w-full rounded-full bg-white/55" />
        </div>
      </File3D>

      <Connector icon={Minimize2} className="lift-2 mb-6 w-12" />

      <File3D
        tone="white"
        depth={6}
        className="lift-3 h-[72px] w-[58px] origin-bottom transition-transform duration-200 ease-out motion-safe:group-hover:scale-90"
      >
        <ImageIcon {...ICON} className={INK_TEXT} />
        <div className="flex flex-col gap-1.5">
          <Stroke on="white" className="w-7" />
          <span className={`block h-2 w-4 rounded-full ${INK_BG}`} />
        </div>
      </File3D>
    </div>
  );
}

/* ── Twibbon: foto di dalam frame, dibagikan lewat link ──────────────────── */
export function IllusTwibbon() {
  const face = 'h-6 w-6 rounded-full border-2 border-white/70 bg-white/35';
  return (
    <div className="p3d flex items-center gap-4">
      {/* Bingkai foto bertebal. Isinya datar karena dipotong oleh bingkai. */}
      <Solid tone="white" depth={10} className="lift-2 h-[112px] w-[112px] rounded-xl" face="overflow-hidden">
        <div className={`absolute inset-0 ${INK_TEXT} transition-transform duration-200 ease-out motion-safe:group-hover:scale-110`}>
          <span className="absolute left-1/2 top-6 h-8 w-8 -translate-x-1/2 rounded-full bg-current opacity-30" />
          <span className="absolute bottom-0 left-1/2 h-11 w-[72px] -translate-x-1/2 rounded-t-full bg-current opacity-30" />
        </div>
        <span className="absolute inset-0 rounded-xl border-[7px] border-[color:var(--tone-ink)]" />
        <span className={`absolute inset-x-0 bottom-0 flex h-7 items-center justify-center ${INK_BG}`}>
          <span className="block h-1.5 w-12 rounded-full bg-white" />
        </span>
      </Solid>

      <div className="p3d flex w-[96px] flex-col gap-3">
        <Chip className="lift-1">
          <Link2 {...ICON} className="shrink-0" />
          <Stroke className="min-w-0 flex-1" />
        </Chip>
        <span className="lift-3 flex items-center text-white">
          <span className={face} />
          <span className={`-ml-2 ${face}`} />
          <span className={`-ml-2 ${face}`} />
          <Plus {...ICON} className="ml-1.5" />
        </span>
        <Chip className="lift-2">
          <Download {...ICON} className="shrink-0" />
          <Stroke className="w-8" />
        </Chip>
      </div>
    </div>
  );
}

/* ── QR Generator: link jadi QR sungguhan ────────────────────────────────── */
const BRACKET = 'absolute h-4 w-4 border-white/80';

export function IllusQr() {
  // QR asli dari alamat halaman QR. Warnanya mengikuti warna teks keping, yaitu warna gelap kartu.
  const qr = useMemo(() => {
    try {
      return buildQrSvg({ text: `${window.location.origin}/qr`, fg: 'currentColor', bg: 'none', size: 96 });
    } catch {
      return '';
    }
  }, []);

  return (
    <div className="p3d flex items-center gap-4">
      <div className="p3d flex w-[88px] flex-col gap-2.5">
        <Chip className="lift-2">
          <Link2 {...ICON} className="shrink-0" />
          <Stroke className="min-w-0 flex-1" />
        </Chip>
        <span className="lift-1 flex items-center gap-1.5 text-white">
          <Crown {...ICON} />
          <Stroke className="w-10" />
        </span>
        <span className="lift-1 flex items-center gap-1.5">
          <Badge>PNG</Badge>
          <Badge>SVG</Badge>
        </span>
      </div>

      <div className="p3d relative flex h-[124px] w-[124px] shrink-0 items-center justify-center">
        {/* Keping QR bertebal. */}
        <Solid tone="white" depth={10} className="lift-1 h-[104px] w-[104px] rounded-xl" face={`p-1.5 ${INK_TEXT}`}>
          {qr ? (
            <>
              <div className="h-full w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
              <span className="lift-2 absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-white shadow-[0_8px_12px_-8px_rgba(0,0,0,0.6)]">
                <span className="block h-2 w-2 rounded-full bg-current" />
              </span>
            </>
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <QrCode size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
          )}
        </Solid>

        {/* Bingkai pemindai melayang di depan keping. */}
        <div className="lift-3 absolute inset-0 transition-transform duration-200 ease-out motion-safe:group-hover:scale-95">
          <span className={`${BRACKET} left-0 top-0 rounded-tl-md border-l-2 border-t-2`} />
          <span className={`${BRACKET} right-0 top-0 rounded-tr-md border-r-2 border-t-2`} />
          <span className={`${BRACKET} bottom-0 left-0 rounded-bl-md border-b-2 border-l-2`} />
          <span className={`${BRACKET} bottom-0 right-0 rounded-br-md border-b-2 border-r-2`} />
        </div>
      </div>
    </div>
  );
}

/* ── Linktree: semua link di satu halaman, di dalam ponsel ───────────────── */
function LinkChip({ icon: Icon, align, slide, lift }) {
  return (
    <Chip className={`transition-transform duration-200 ease-out ${slide} ${align} ${lift}`}>
      <Icon {...ICON} className="shrink-0" />
      <Stroke className="w-4" />
    </Chip>
  );
}

export function IllusLinktree() {
  const toRight = 'motion-safe:group-hover:translate-x-1';
  const toLeft = 'motion-safe:group-hover:-translate-x-1';
  return (
    <div className="p3d flex items-center gap-3">
      <div className="p3d flex w-[58px] flex-col justify-center gap-5">
        <LinkChip icon={ShoppingBag} align="self-start" slide={toRight} lift="lift-3" />
        <LinkChip icon={Play} align="self-end" slide={toRight} lift="lift-2" />
      </div>

      {/* Ponsel 3D: bingkai logam bertebal, layar berisi halaman Linktree kecil. */}
      <Solid tone="metal" depth={9} className="h-[168px] w-[86px] rounded-[22px]" face="p-[3.5px]">
        <div className="mini-screen p3d relative flex h-full w-full flex-col items-center rounded-[18px] px-2 pt-5">
          <span className="absolute left-1/2 top-[5px] h-[9px] w-7 -translate-x-1/2 rounded-full bg-black" />
          <span className="lift-1 block h-7 w-7 shrink-0 rounded-full bg-white/35 shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.75)]" />
          <span className="mt-1.5 block h-1.5 w-10 shrink-0 rounded-full bg-white/80" />
          <span className="mt-1 block h-1 w-14 shrink-0 rounded-full bg-white/40" />
          <div className="p3d mt-2.5 flex w-full shrink-0 flex-col gap-1.5">
            <span className="lift-2 flex h-[17px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_8px_10px_-8px_rgba(0,0,0,0.7)]">
              <span className={`block h-1 w-8 rounded-full ${INK_BG} opacity-60`} />
            </span>
            {[0, 1, 2].map((i) => (
              <span key={i} className="lift-1 flex h-[17px] shrink-0 items-center justify-center rounded-full bg-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]">
                <span className="block h-1 w-8 rounded-full bg-white/70" />
              </span>
            ))}
          </div>
          <span className="absolute bottom-[5px] left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-white/80" />
        </div>
      </Solid>

      <div className="p3d flex w-[58px] flex-col justify-center gap-5">
        <LinkChip icon={Mail} align="self-start" slide={toLeft} lift="lift-2" />
        <LinkChip icon={Globe} align="self-end" slide={toLeft} lift="lift-3" />
      </div>
    </div>
  );
}

/* ── Konversi Massal: tumpukan file jadi satu ZIP ────────────────────────── */
const STACK = [
  { icon: Music, pos: 'left-0 top-0', lift: '' },
  { icon: Film, pos: 'left-[18px] top-[8px]', lift: 'lift-1' },
  { icon: ImageIcon, pos: 'left-[36px] top-[16px]', lift: 'lift-2' },
];

export function IllusBatch() {
  return (
    <div className="p3d flex items-center gap-2">
      {/* Tumpukan file: yang paling depan sudah selesai. */}
      <div className="p3d relative h-[112px] w-[108px] shrink-0">
        {STACK.map(({ icon: Icon, pos, lift }, i) => (
          <File3D key={i} depth={6} className={`absolute h-24 w-[72px] ${pos} ${lift}`}>
            <Icon {...ICON} className="text-white" />
            <div className="flex items-center justify-between gap-1.5">
              <Stroke className="min-w-0 flex-1" />
              {i === STACK.length - 1 && <Check size={14} strokeWidth={2.25} aria-hidden="true" className="shrink-0 text-white" />}
            </div>
          </File3D>
        ))}
      </div>

      <div className="p3d flex w-12 flex-col items-center gap-1.5">
        <Badge className="lift-2">WEBP</Badge>
        <Connector className="lift-2 w-full" />
      </div>

      {/* Kotak ZIP: paling tebal, karena berisi semua file. */}
      <Solid tone="white" depth={18} className="lift-3 h-[76px] w-[60px] rounded-lg" face={`flex flex-col items-center justify-center gap-1 ${INK_TEXT}`}>
        <FileArchive size={20} strokeWidth={1.75} aria-hidden="true" />
        <span className="text-[10px] font-semibold leading-none tracking-wider">ZIP</span>
      </Solid>
    </div>
  );
}

/* ── Statistik: grafik batang 3D ─────────────────────────────────────────── */
// Tinggi batang sengaja tidak naik terus, supaya grafik tidak mengklaim pertumbuhan.
const BARS = [24, 38, 28, 50, 34, 60, 42, 46];
const PEAK = 5;

export function IllusStats() {
  return (
    <Solid depth={6} className="h-[124px] w-[236px] rounded-xl" face="flex flex-col p-3">
      <div className="p3d flex items-center justify-between">
        <Badge className="lift-2 gap-1.5 rounded-full px-2">
          <span className="block h-1.5 w-1.5 rounded-full bg-success" />
          Live
        </Badge>
        <span className="lift-1 flex items-center gap-1.5 text-white">
          <Users {...ICON} />
          <Activity {...ICON} />
        </span>
      </div>

      <div className="p3d relative mt-2.5 flex-1">
        <span className="absolute inset-x-0 top-0 border-t border-dashed border-white/35" />
        <span className="absolute inset-x-0 top-1/3 border-t border-dashed border-white/35" />
        <span className="absolute inset-x-0 top-2/3 border-t border-dashed border-white/35" />
        <span className="absolute inset-x-0 bottom-0 border-t border-white/60" />
        {/* Batang berupa balok yang menonjol dari panel; batang tertinggi berwarna putih. */}
        <div className="p3d absolute inset-0 flex items-end justify-between px-1">
          {BARS.map((height, i) => (
            <Solid
              key={i}
              tone={i === PEAK ? 'white' : 'glass'}
              depth={i === PEAK ? 16 : 10}
              className={`w-4 rounded-t-[4px] ${i === PEAK ? 'lift-2 origin-bottom transition-transform duration-200 ease-out motion-safe:group-hover:scale-y-105' : 'lift-1'}`}
              style={{ height }}
            />
          ))}
        </div>
      </div>
    </Solid>
  );
}
