import React from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { readImageAsDataUrl } from '../../lib/imageUpload';
import { THEME_PRESETS, BUTTON_STYLE_OPTIONS, BUTTON_RADIUS_OPTIONS } from './constants';

const BG_TYPES = [
  { id: 'color', label: 'Warna' },
  { id: 'gradient', label: 'Gradien' },
  { id: 'image', label: 'Gambar' },
];

// Tampilan: tema siap pakai, latar (warna, gradien, atau gambar), warna teks, dan gaya tombol.
export default function AppearanceTab({ theme, onChange }) {
  const { addToast: toast } = useToast();
  const set = (patch) => onChange({ ...theme, preset: 'custom', ...patch });
  const setBg = (patch) => set({ bg: { ...theme.bg, ...patch } });
  const setBtn = (patch) => set({ button: { ...theme.button, ...patch } });
  const applyPreset = (p) =>
    onChange({
      preset: p.id,
      bg: { ...p.theme.bg, image: null },
      text: p.theme.text,
      button: { ...p.theme.button },
    });

  const onBgImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const image = await readImageAsDataUrl(file, { maxSide: 1200, maxChars: 1400000 });
      setBg({ type: 'image', image });
    } catch (err) {
      toast({ type: 'error', title: 'Gambar tidak bisa dipakai', message: err.message });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-[15px] font-semibold text-primary">Tema</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-xl border p-2 text-left transition-smooth ${
                theme.preset === p.id ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-border-hover'
              }`}
            >
              <div
                className="h-12 w-full rounded-lg"
                style={{
                  background:
                    p.theme.bg.type === 'gradient'
                      ? `linear-gradient(160deg, ${p.theme.bg.color}, ${p.theme.bg.color2})`
                      : p.theme.bg.color,
                }}
              />
              <p className="mt-2 text-[12px] text-secondary">{p.label}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-[15px] font-semibold text-primary">Latar</h2>
        <div className="mt-4 flex flex-col gap-4">
          <Segmented options={BG_TYPES} value={theme.bg.type} onChange={(type) => setBg({ type })} />

          {theme.bg.type === 'color' && (
            <ColorField label="Warna latar" value={theme.bg.color} onChange={(color) => setBg({ color })} />
          )}

          {theme.bg.type === 'gradient' && (
            <div className="flex flex-wrap gap-4">
              <ColorField label="Warna atas" value={theme.bg.color} onChange={(color) => setBg({ color })} />
              <ColorField label="Warna bawah" value={theme.bg.color2} onChange={(color2) => setBg({ color2 })} />
            </div>
          )}

          {theme.bg.type === 'image' && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex h-[36px] cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-[13px] text-primary transition-smooth hover:bg-card-muted">
                <ImageIcon size={14} strokeWidth={1.75} />
                {theme.bg.image ? 'Ganti gambar' : 'Pilih gambar'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onBgImage} />
              </label>
              {theme.bg.image ? (
                <>
                  <img src={theme.bg.image} alt="" className="h-[36px] w-[56px] rounded-md object-cover" />
                  <Button size="sm" variant="ghost" icon={X} onClick={() => setBg({ image: null, type: 'color' })}>Hapus</Button>
                </>
              ) : (
                <span className="text-[12px] text-tertiary">JPG, PNG, atau WebP. Gambar diperkecil otomatis.</span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-[15px] font-semibold text-primary">Teks</h2>
        <div className="mt-4">
          <ColorField label="Warna teks" value={theme.text} onChange={(text) => set({ text })} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-[15px] font-semibold text-primary">Tombol</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <p className="mb-2 text-[13px] text-secondary">Gaya</p>
            <Segmented options={BUTTON_STYLE_OPTIONS} value={theme.button.style} onChange={(style) => setBtn({ style })} />
          </div>
          <div>
            <p className="mb-2 text-[13px] text-secondary">Sudut</p>
            <Segmented options={BUTTON_RADIUS_OPTIONS} value={theme.button.radius} onChange={(radius) => setBtn({ radius })} />
          </div>
          <div className="flex flex-wrap gap-4">
            <ColorField label="Warna tombol" value={theme.button.color} onChange={(color) => setBtn({ color })} />
            <ColorField label="Warna tulisan tombol" value={theme.button.textColor} onChange={(textColor) => setBtn({ textColor })} />
          </div>
        </div>
      </section>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-3 text-[13px] text-primary">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 cursor-pointer rounded border border-border bg-transparent"
      />
      <span>{label}</span>
      <span className="font-mono text-[12px] text-tertiary">{value}</span>
    </label>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`h-[30px] rounded-full px-3 text-[12px] font-medium transition-smooth ${
            value === o.id ? 'bg-accent-black text-white dark:bg-white dark:text-black' : 'text-secondary hover:text-primary'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
