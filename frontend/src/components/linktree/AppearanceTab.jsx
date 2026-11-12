import React, { useEffect } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { readImageAsDataUrl } from '../../lib/imageUpload';
import { pageBackground, linkButtonStyle, socialIconStyle } from './LinktreeView';
import { FONTS, loadFont } from './fonts';
import {
  THEME_PRESETS,
  BUTTON_STYLE_OPTIONS,
  BUTTON_RADIUS_OPTIONS,
  SOCIAL_STYLE_OPTIONS,
  SOCIAL_BY_ID,
} from './constants';

const BG_TYPES = [
  { id: 'color', label: 'Warna' },
  { id: 'gradient', label: 'Gradien' },
  { id: 'image', label: 'Gambar' },
];

const CARD = 'rounded-2xl border border-border bg-card p-4 sm:p-5';
const SAMPLE_SOCIALS = ['instagram', 'whatsapp', 'tiktok'];

// Tampilan: tema siap pakai, latar, foto profil, teks, gaya ikon sosial, dan gaya tombol tautan.
// Setiap pilihan gaya ditampilkan sebagai contoh kecil di atas latar halaman yang sedang dipakai.
export default function AppearanceTab({ theme, onChange }) {
  const { addToast: toast } = useToast();
  const set = (patch) => onChange({ ...theme, preset: 'custom', ...patch });
  const setBg = (patch) => set({ bg: { ...theme.bg, ...patch } });
  const setBtn = (patch) => set({ button: { ...theme.button, ...patch } });
  // Tema siap pakai hanya mengganti warna dan tombol. Pilihan foto profil dan ikon sosial tetap.
  const applyPreset = (p) =>
    onChange({
      ...theme,
      preset: p.id,
      bg: { ...p.theme.bg, image: null },
      text: p.theme.text,
      button: { ...p.theme.button },
    });

  const avatarOutline = !theme.avatar || theme.avatar.outline !== false;
  const socialStyle = theme.social?.style || 'outline';
  const sampleBg = pageBackground(theme);
  const fontId = theme.font || 'poppins';

  // Semua pilihan huruf dimuat supaya contohnya tampil dengan huruf aslinya.
  useEffect(() => {
    FONTS.forEach((f) => loadFont(f.id));
  }, []);

  const onBgImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const image = await readImageAsDataUrl(file, { maxSide: 1200, maxChars: 800000 });
      setBg({ type: 'image', image });
    } catch (err) {
      toast({ type: 'error', title: 'Gambar tidak bisa dipakai', message: err.message });
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <section className={CARD}>
        <SectionTitle title="Tema" hint="Pilih salah satu sebagai titik awal, lalu ubah sesukamu di bawah." />
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              aria-pressed={theme.preset === p.id}
              className={`rounded-md border p-1.5 text-left transition-smooth ${
                theme.preset === p.id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-border hover:border-blue-500'
              }`}
            >
              <div
                className="h-12 w-full rounded-sm border border-border"
                style={{
                  background:
                    p.theme.bg.type === 'gradient'
                      ? `linear-gradient(160deg, ${p.theme.bg.color}, ${p.theme.bg.color2})`
                      : p.theme.bg.color,
                }}
              />
              <p className="mt-1.5 px-0.5 text-[12px] text-secondary">{p.label}</p>
            </button>
          ))}
        </div>
      </section>

      <section className={CARD}>
        <SectionTitle title="Latar" />
        <div className="mt-3 flex flex-col gap-4">
          <Segmented options={BG_TYPES} value={theme.bg.type} onChange={(type) => setBg({ type })} />

          {theme.bg.type === 'color' && (
            <ColorField label="Warna latar" value={theme.bg.color} onChange={(color) => setBg({ color })} />
          )}

          {theme.bg.type === 'gradient' && (
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              <ColorField label="Warna atas" value={theme.bg.color} onChange={(color) => setBg({ color })} />
              <ColorField label="Warna bawah" value={theme.bg.color2} onChange={(color2) => setBg({ color2 })} />
            </div>
          )}

          {theme.bg.type === 'image' && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex h-[36px] cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-[13px] text-primary transition-smooth hover:border-blue-500 hover:text-blue-500">
                <ImageIcon size={14} strokeWidth={1.75} />
                {theme.bg.image ? 'Ganti gambar' : 'Pilih gambar'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onBgImage} />
              </label>
              {theme.bg.image ? (
                <>
                  <img src={theme.bg.image} alt="" className="h-[36px] w-[56px] rounded-sm object-cover" />
                  <Button size="sm" variant="ghost" icon={X} onClick={() => setBg({ image: null, type: 'color' })}>Hapus</Button>
                </>
              ) : (
                <span className="text-[12px] text-tertiary">JPG, PNG, atau WebP. Gambar diperkecil otomatis.</span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className={CARD}>
        <SectionTitle title="Foto profil dan teks" hint="Foto profil diunggah di tab Pengaturan." />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-[340px] sm:gap-3">
          {[
            { on: true, label: 'Dengan garis tepi' },
            { on: false, label: 'Tanpa garis tepi' },
          ].map((opt) => (
            <OptionTile key={opt.label} active={avatarOutline === opt.on} label={opt.label} bg={sampleBg} onClick={() => set({ avatar: { outline: opt.on } })}>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold"
                style={
                  opt.on
                    ? { border: `2px solid ${theme.text}`, color: theme.text }
                    : { background: `color-mix(in srgb, ${theme.text} 14%, transparent)`, color: theme.text }
                }
              >
                A
              </span>
            </OptionTile>
          ))}
        </div>
        <div className="mt-4">
          <ColorField label="Warna teks" value={theme.text} onChange={(text) => set({ text })} />
        </div>
      </section>

      <section className={CARD}>
        <SectionTitle title="Huruf" hint="Dipakai untuk nama, bio, dan semua tombol di halaman." />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5">
          {FONTS.map((f) => {
            const active = fontId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => set({ font: f.id })}
                aria-pressed={active}
                title={f.note}
                className={`rounded-md border px-2.5 py-2 text-left transition-smooth ${
                  active ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-border hover:border-blue-500'
                }`}
              >
                <span className="block truncate text-[20px] leading-tight text-primary" style={{ fontFamily: f.family }}>Aa Bb 123</span>
                <span className={`mt-1 block truncate text-[11px] sm:text-[12px] ${active ? 'font-medium text-primary' : 'text-secondary'}`}>{f.label}</span>
                <span className="block truncate text-[10px] text-tertiary">{f.note}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={CARD}>
        <SectionTitle title="Ikon sosial" hint="Bentuk ikon mengikuti logo brand masing-masing." />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
          {SOCIAL_STYLE_OPTIONS.map((opt) => (
            <OptionTile key={opt.id} active={socialStyle === opt.id} label={opt.label} bg={sampleBg} onClick={() => set({ social: { style: opt.id } })}>
              <span className="flex gap-1.5">
                {SAMPLE_SOCIALS.map((id) => {
                  const meta = SOCIAL_BY_ID[id];
                  const look = socialIconStyle({ ...theme, social: { style: opt.id } }, meta);
                  return (
                    <span key={id} className={`flex h-7 w-7 items-center justify-center rounded-full ${opt.id === 'liquid' ? 'lt-liquid' : ''}`} style={look.box}>
                      <meta.icon size={Math.round(look.iconSize * 0.66)} />
                    </span>
                  );
                })}
              </span>
            </OptionTile>
          ))}
        </div>
      </section>

      <section className={CARD}>
        <SectionTitle title="Tombol tautan" />
        <p className="mb-2 mt-3 text-[12px] font-medium text-secondary sm:text-[13px]">Gaya</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">
          {BUTTON_STYLE_OPTIONS.map((opt) => (
            <OptionTile key={opt.id} active={theme.button.style === opt.id} label={opt.label} bg={sampleBg} onClick={() => setBtn({ style: opt.id })}>
              <span
                className={`flex h-7 w-[78%] items-center justify-center text-[10px] font-medium ${opt.id === 'liquid' ? 'lt-liquid' : ''}`}
                style={linkButtonStyle({ ...theme, button: { ...theme.button, style: opt.id } })}
              >
                Tautan
              </span>
            </OptionTile>
          ))}
        </div>

        <p className="mb-2 mt-4 text-[12px] font-medium text-secondary sm:text-[13px]">Bentuk sudut</p>
        <div className="grid grid-cols-3 gap-2 sm:max-w-[420px] sm:gap-3">
          {BUTTON_RADIUS_OPTIONS.map((opt) => (
            <OptionTile key={opt.id} active={theme.button.radius === opt.id} label={opt.label} bg={sampleBg} onClick={() => setBtn({ radius: opt.id })}>
              <span
                className={`flex h-7 w-[78%] items-center justify-center text-[10px] font-medium ${theme.button.style === 'liquid' ? 'lt-liquid' : ''}`}
                style={linkButtonStyle({ ...theme, button: { ...theme.button, radius: opt.id } })}
              >
                Tautan
              </span>
            </OptionTile>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
          <ColorField label="Warna tombol" value={theme.button.color} onChange={(color) => setBtn({ color })} />
          <ColorField label="Warna tulisan" value={theme.button.textColor} onChange={(textColor) => setBtn({ textColor })} />
        </div>
        {['outline', 'glass', 'liquid'].includes(theme.button.style) && (
          <p className="mt-2 text-[11px] text-tertiary sm:text-[12px]">
            {theme.button.style === 'outline'
              ? 'Gaya Garis memakai warna tombol untuk garis dan tulisannya.'
              : theme.button.style === 'glass'
                ? 'Gaya Kaca memakai warna tombol yang tembus pandang, dan tulisannya mengikuti warna teks.'
                : 'Liquid glass memburamkan latar di belakang tombol, berkilau, dan bergerak saat ditekan. Paling bagus di atas latar gambar atau gradien. Tulisannya mengikuti warna teks.'}
          </p>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ title, hint }) {
  return (
    <div>
      <h2 className="text-[14px] font-semibold text-primary sm:text-[15px]">{title}</h2>
      {hint && <p className="mt-0.5 text-[11px] text-tertiary sm:text-[12px]">{hint}</p>}
    </div>
  );
}

// Kotak pilihan gaya: contoh kecil di atas latar halaman, dengan nama gaya di bawahnya.
function OptionTile({ active, label, bg, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border p-1.5 text-left transition-smooth ${
        active ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-border hover:border-blue-500'
      }`}
    >
      <span className="flex h-14 w-full items-center justify-center overflow-hidden rounded-sm border border-border" style={bg}>
        {children}
      </span>
      <span className={`mt-1.5 block truncate px-0.5 text-[11px] sm:text-[12px] ${active ? 'font-medium text-primary' : 'text-secondary'}`}>{label}</span>
    </button>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2.5 text-[12px] text-primary sm:text-[13px]">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 shrink-0 cursor-pointer rounded-sm border border-border bg-transparent p-0.5"
      />
      <span className="leading-tight">
        <span className="block">{label}</span>
        <span className="block font-mono text-[11px] uppercase text-tertiary sm:text-[12px]">{value}</span>
      </span>
    </label>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-0.5 self-start rounded-md bg-card-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-[30px] rounded-sm px-3 text-[12px] font-medium transition-smooth ${
            value === o.id ? 'bg-card text-primary shadow-tab dark:bg-zinc-700 dark:shadow-none' : 'text-secondary hover:text-primary'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
