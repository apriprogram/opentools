import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { TRANSPARENT_BG, isTransparentBg, qrBackdropStyle } from '../../lib/qrCode';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Apakah warna cukup terang sehingga tanda centang di atasnya perlu berwarna gelap.
const isLight = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.62;
};

const SWATCH =
  'flex aspect-square w-full max-w-[28px] items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)] transition-transform duration-150 hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100';
const SWATCH_ACTIVE = 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent';

// Pemilih warna: bulatan warna (membuka pemilih warna perangkat), kode warna yang bisa diketik,
// dan deretan warna siap pakai. allowTransparent menambah pilihan "tanpa latar" (nilainya 'transparent').
export default function ColorField({ id, label, value, onChange, presets = [], allowTransparent = false }) {
  const clear = allowTransparent && isTransparentBg(value);
  const shown = clear ? '' : value;
  const [text, setText] = useState(shown);

  useEffect(() => {
    setText(shown);
  }, [shown]);

  const onText = (raw) => {
    const next = raw && !raw.startsWith('#') ? `#${raw}` : raw;
    setText(next.slice(0, 7));
    if (HEX_RE.test(next)) onChange(next.toUpperCase());
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <label htmlFor={`${id}-hex`} className="block text-[12px] font-medium text-secondary">{label}</label>

      <div className="mt-2 flex items-center gap-2.5">
        <span
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12),0_4px_10px_-6px_rgba(15,23,42,0.5)]"
          style={clear ? qrBackdropStyle(value, 10) : { backgroundColor: value }}
        >
          <input
            id={id}
            type="color"
            value={HEX_RE.test(value) ? value : '#FFFFFF'}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            aria-label={`${label}: buka pemilih warna`}
            title="Pilih warna lain"
            className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] cursor-pointer opacity-0"
          />
        </span>
        <input
          id={`${id}-hex`}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          value={text}
          placeholder={clear ? 'Transparan' : '#000000'}
          onChange={(e) => onText(e.target.value.trim())}
          onBlur={() => setText(shown)}
          aria-invalid={clear || HEX_RE.test(text) ? undefined : 'true'}
          className="ios-no-zoom h-10 w-full min-w-0 rounded-full border border-border bg-card px-3.5 font-mono text-[13px] uppercase tracking-wide text-primary placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-secondary transition-smooth focus:border-blue-500 focus:outline-none"
        />
      </div>

      {presets.length > 0 && (
        <div role="group" aria-label={`Pilihan cepat ${label}`} className="mt-3 grid grid-cols-8 gap-1">
          {allowTransparent && (
            <button
              type="button"
              onClick={() => onChange(TRANSPARENT_BG)}
              aria-label="Tanpa latar (transparan)"
              aria-pressed={clear}
              title="Transparan"
              className={`${SWATCH} ${clear ? SWATCH_ACTIVE : ''}`}
              style={qrBackdropStyle(TRANSPARENT_BG, 8)}
            >
              {clear && <Check size={14} strokeWidth={2.5} aria-hidden="true" className="text-zinc-900" />}
            </button>
          )}
          {presets.map((color) => {
            const active = color.toLowerCase() === String(value).toLowerCase();
            return (
              <button
                key={color}
                type="button"
                onClick={() => onChange(color)}
                aria-label={`Pakai warna ${color}`}
                aria-pressed={active}
                title={color}
                className={`${SWATCH} ${active ? SWATCH_ACTIVE : ''}`}
                style={{ backgroundColor: color }}
              >
                {active && <Check size={14} strokeWidth={2.5} aria-hidden="true" className={isLight(color) ? 'text-zinc-900' : 'text-white'} />}
              </button>
            );
          })}
        </div>
      )}

      {/* Tanpa deretan warna (misalnya di jendela Edit QR): pilihan transparan tampil sebagai tombol berlabel. */}
      {presets.length === 0 && allowTransparent && (
        <button
          type="button"
          onClick={() => onChange(clear ? '#FFFFFF' : TRANSPARENT_BG)}
          aria-pressed={clear}
          className={`mt-2.5 inline-flex h-8 max-w-full items-center gap-2 rounded-full border px-2.5 text-[12px] font-medium transition-smooth ${
            clear ? 'border-blue-500 text-primary' : 'border-border text-secondary hover:border-border-hover hover:text-primary'
          }`}
        >
          <span
            aria-hidden="true"
            className="h-4 w-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)]"
            style={qrBackdropStyle(TRANSPARENT_BG, 6)}
          />
          <span className="truncate">Transparan</span>
          {clear && <Check size={13} strokeWidth={2.5} aria-hidden="true" className="shrink-0 text-blue-500" />}
        </button>
      )}
    </div>
  );
}
