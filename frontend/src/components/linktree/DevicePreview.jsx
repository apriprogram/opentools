import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Monitor, Smartphone, Tablet } from 'lucide-react';
import Select from '../ui/Select';
import LinktreeView from './LinktreeView';

// Ukuran layar (lebar x tinggi, dalam px CSS) yang umum dipakai untuk menguji tampilan.
const DEVICES = [
  { id: 'iphone-se', group: 'phone', label: 'iPhone SE', w: 375, h: 667 },
  { id: 'iphone-15', group: 'phone', label: 'iPhone 14 / 15', w: 390, h: 844 },
  { id: 'iphone-15-pro-max', group: 'phone', label: 'iPhone 15 Pro Max', w: 430, h: 932 },
  { id: 'galaxy-s', group: 'phone', label: 'Samsung Galaxy S', w: 360, h: 800 },
  { id: 'galaxy-s-ultra', group: 'phone', label: 'Samsung Galaxy S Ultra', w: 412, h: 915 },
  { id: 'pixel-7', group: 'phone', label: 'Google Pixel 7', w: 412, h: 915 },
  { id: 'redmi-note', group: 'phone', label: 'Xiaomi Redmi Note', w: 393, h: 873 },
  { id: 'android-kecil', group: 'phone', label: 'Android layar kecil', w: 360, h: 640 },
  { id: 'ipad-mini', group: 'tablet', label: 'iPad Mini', w: 768, h: 1024 },
  { id: 'ipad-air', group: 'tablet', label: 'iPad Air', w: 820, h: 1180 },
  { id: 'ipad-pro', group: 'tablet', label: 'iPad Pro 12,9 inci', w: 1024, h: 1366 },
  { id: 'galaxy-tab', group: 'tablet', label: 'Samsung Galaxy Tab', w: 800, h: 1280 },
  { id: 'laptop', group: 'desktop', label: 'Laptop', w: 1366, h: 768 },
  { id: 'laptop-besar', group: 'desktop', label: 'Laptop besar', w: 1440, h: 900 },
  { id: 'desktop', group: 'desktop', label: 'Monitor desktop', w: 1920, h: 1080 },
];
const GROUPS = [
  { id: 'phone', label: 'Ponsel', icon: Smartphone },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'desktop', label: 'Desktop', icon: Monitor },
];
const CUSTOM_ID = 'custom';

// Pilihan di dropdown: dikelompokkan per jenis perangkat, dengan ukuran layar di sisi kanan.
const DEVICE_OPTIONS = [
  ...GROUPS.flatMap((g) =>
    DEVICES.filter((d) => d.group === g.id).map((d) => ({ id: d.id, label: d.label, hint: `${d.w} × ${d.h}`, group: g.label, icon: g.icon }))
  ),
  { id: CUSTOM_ID, label: 'Ukuran sendiri', group: 'Lainnya' },
];
const STORAGE_KEY = 'lt-preview-device';
const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || min));

// Pilihan terakhir diingat per browser. Kalau penyimpanan diblokir, pakai bawaan.
const loadChoice = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && (saved.id === CUSTOM_ID || DEVICES.some((d) => d.id === saved.id))) return saved;
  } catch {
    /* abaikan */
  }
  return { id: 'iphone-15', w: 390, h: 844 };
};

// Bingkai perangkat. Ukurannya ukuran asli perangkat, lalu seluruhnya dikecilkan agar muat.
const FRAME = {
  phone: { bezel: 10, radius: 44, bar: 0 },
  tablet: { bezel: 14, radius: 30, bar: 0 },
  desktop: { bezel: 1, radius: 12, bar: 36 },
};

const NUMBER =
  'ios-no-zoom h-8 w-full rounded-md border border-border bg-card px-2 text-center text-[12px] tabular-nums text-primary transition-smooth focus:border-border-focus focus:outline-none sm:h-9 sm:text-[13px]';

// Pratinjau Linktree pada ukuran perangkat yang dipilih: berbagai ponsel, tablet, desktop, atau ukuran sendiri.
// height: tinggi maksimal area pratinjau (px). onExpand: tampilkan tombol untuk membuka pratinjau besar.
export default function DevicePreview({ tree, height = 560, onExpand }) {
  const [choice, setChoice] = useState(loadChoice);
  const [availWidth, setAvailWidth] = useState(0);
  const areaRef = useRef(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return undefined;
    const measure = () => setAvailWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch {
      /* abaikan */
    }
  }, [choice]);

  const custom = choice.id === CUSTOM_ID;
  const preset = DEVICES.find((d) => d.id === choice.id);
  const width = custom ? clamp(choice.w, 280, 2560) : preset.w;
  const screenHeight = custom ? clamp(choice.h, 400, 2560) : preset.h;
  const group = custom ? (width >= 1100 ? 'desktop' : width >= 600 ? 'tablet' : 'phone') : preset.group;
  const frame = FRAME[group];

  const outerW = width + frame.bezel * 2;
  const outerH = screenHeight + frame.bezel * 2 + frame.bar;
  const scale = availWidth > 0 ? Math.min(1, availWidth / outerW, height / outerH) : 0;

  const pick = (id) => {
    if (id === CUSTOM_ID) setChoice({ id: CUSTOM_ID, w: width, h: screenHeight });
    else {
      const d = DEVICES.find((x) => x.id === id);
      setChoice({ id, w: d.w, h: d.h });
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 sm:gap-2">
        <Select
          value={choice.id}
          onChange={pick}
          options={DEVICE_OPTIONS}
          label="Ukuran perangkat untuk pratinjau"
          className="flex-1"
        />
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            title="Perbesar pratinjau"
            aria-label="Perbesar pratinjau"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-secondary transition-smooth hover:border-blue-500 hover:text-blue-500 sm:h-9 sm:w-9"
          >
            <Maximize2 size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Pintasan jenis perangkat */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <div className="inline-flex gap-0.5 rounded-md bg-card-muted p-0.5">
          {GROUPS.map((g) => {
            const active = group === g.id;
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={active}
                title={g.label}
                onClick={() => pick(DEVICES.find((d) => d.group === g.id && (g.id !== 'phone' || d.id === 'iphone-15')).id)}
                className={`flex h-7 items-center gap-1.5 rounded-sm px-2 text-[11px] font-medium transition-smooth sm:text-[12px] ${
                  active ? 'bg-card text-primary shadow-tab dark:bg-zinc-700 dark:shadow-none' : 'text-secondary hover:text-primary'
                }`}
              >
                <g.icon size={13} strokeWidth={1.75} aria-hidden="true" />
                {g.label}
              </button>
            );
          })}
        </div>
        {custom && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={280}
              max={2560}
              value={choice.w}
              aria-label="Lebar layar (px)"
              title="Lebar layar (px)"
              onChange={(e) => setChoice((c) => ({ ...c, w: e.target.value }))}
              className={`${NUMBER} w-[68px]`}
            />
            <span className="text-[12px] text-tertiary">×</span>
            <input
              type="number"
              min={400}
              max={2560}
              value={choice.h}
              aria-label="Tinggi layar (px)"
              title="Tinggi layar (px)"
              onChange={(e) => setChoice((c) => ({ ...c, h: e.target.value }))}
              className={`${NUMBER} w-[68px]`}
            />
          </div>
        )}
        <span className="ml-auto text-[11px] tabular-nums text-tertiary">
          {width} × {screenHeight} px{scale > 0 && scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''}
        </span>
      </div>

      <div ref={areaRef} className="flex w-full justify-center">
        {scale > 0 && (
          <div style={{ width: outerW * scale, height: outerH * scale }}>
            <div
              className="overflow-hidden border-zinc-900 bg-zinc-900"
              style={{
                width: outerW,
                height: outerH,
                borderWidth: frame.bezel,
                borderRadius: frame.radius,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              {frame.bar > 0 && (
                <div className="flex items-center gap-3 bg-zinc-800 px-4" style={{ height: frame.bar }}>
                  <span className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-zinc-600" />
                    <span className="h-3 w-3 rounded-full bg-zinc-600" />
                    <span className="h-3 w-3 rounded-full bg-zinc-600" />
                  </span>
                  <span className="mx-auto w-[46%] truncate rounded-full bg-zinc-700 px-4 py-1 text-center text-[13px] text-zinc-300">
                    {typeof window !== 'undefined' ? window.location.host : ''}/l/{tree.slug}
                  </span>
                </div>
              )}
              <div className="overflow-y-auto bg-white" style={{ width, height: screenHeight }}>
                <LinktreeView tree={tree} preview />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
