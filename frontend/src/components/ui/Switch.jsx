import React from 'react';

const SIZES = {
  sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', on: 'translate-x-4' },
  md: { track: 'h-6 w-11', thumb: 'h-5 w-5', on: 'translate-x-5' },
};

// Sakelar nyala/mati. tone: warna saat nyala (biru untuk pilihan biasa, hijau untuk status terbit).
export default function Switch({ checked, onChange, label, title, size = 'sm', tone = 'blue', disabled = false }) {
  const s = SIZES[size] || SIZES.sm;
  const onColor = tone === 'green' ? 'bg-emerald-500' : 'bg-blue-500';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 rounded-full transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${s.track} ${
        checked ? onColor : 'bg-border-hover'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-0.5 rounded-full bg-white transition-smooth ${s.thumb} ${checked ? s.on : 'translate-x-0'}`}
      />
    </button>
  );
}
