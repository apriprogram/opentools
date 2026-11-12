import React, { useEffect, useMemo, useRef, useState } from 'react';

// Grafik kolom satu seri (misalnya pemasukan per hari). Satu warna, karena hanya ada satu seri.
// data: [{ key, label, title, value }]  label = teks sumbu bawah, title = keterangan lengkap di tooltip.
// format: angka -> teks untuk tooltip.  formatTick: angka -> teks ringkas untuk sumbu kiri.
// Arahkan kursor atau pakai tombol panah kiri dan kanan untuk membaca tiap kolom; semua nilai juga ada di tampilan tabel.
const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 24, left: 52 };
const MAX_BAR = 24;

// Batas atas sumbu yang "bulat" (1, 2, 5 dikali pangkat sepuluh) dengan empat ruas.
function niceScale(max) {
  if (!(max > 0)) return { top: 4, step: 1 };
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const unit = [1, 2, 2.5, 5, 10].find((u) => u * pow >= rough) * pow;
  return { top: unit * 4, step: unit };
}

// Kolom dengan ujung atas membulat dan dasar rata di garis nol.
function barPath(x, y, w, h) {
  const r = Math.min(4, w / 2, h);
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}

export default function ColumnChart({ data, format, formatTick = format, ariaLabel, wholeNumbers = false }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const max = useMemo(() => data.reduce((m, d) => Math.max(m, d.value), 0), [data]);
  const scale = useMemo(() => {
    const s = niceScale(max);
    // Hitungan (jumlah pesanan) tidak punya pecahan: jangan beri label 0,5.
    if (wholeNumbers && s.step < 1) return { top: 4, step: 1 };
    return s;
  }, [max, wholeNumbers]);

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.max(1, Math.min(MAX_BAR, band - 2));
  const y = (v) => PAD.top + plotH - (v / scale.top) * plotH;
  const ticks = [0, 1, 2, 3, 4].map((i) => i * scale.step);
  // Label sumbu bawah dijarangkan supaya tidak bertabrakan.
  const every = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 64))));

  const onKeyDown = (e) => {
    if (!data.length) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const step = e.key === 'ArrowRight' ? 1 : -1;
      setActive((i) => Math.min(data.length - 1, Math.max(0, (i ?? (step > 0 ? -1 : data.length)) + step)));
    } else if (e.key === 'Escape') {
      setActive(null);
    }
  };

  const current = active !== null ? data[active] : null;
  const tipX = current ? PAD.left + band * active + band / 2 : 0;
  const tipLeft = Math.min(Math.max(tipX, 76), Math.max(76, width - 76));

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
      onPointerLeave={() => setActive(null)}
      className="relative w-full rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      style={{ height: HEIGHT }}
    >
      {width > 0 && (
        <svg width={width} height={HEIGHT} aria-hidden="true" className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-tertiary text-[10px] tabular-nums">
                {formatTick(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const x = PAD.left + band * i + (band - barW) / 2;
            const h = d.value > 0 ? Math.max(2, (d.value / scale.top) * plotH) : 0;
            return (
              <g key={d.key}>
                {h > 0 && (
                  <path
                    d={barPath(x, PAD.top + plotH - h, barW, h)}
                    className={`transition-colors duration-100 ${active === i ? 'fill-blue-600 dark:fill-blue-400' : 'fill-blue-500'}`}
                  />
                )}
                {(i % every === 0 || i === data.length - 1) && (i === data.length - 1 || data.length - 1 - i >= every * 0.6) && (
                  <text x={PAD.left + band * i + band / 2} y={HEIGHT - 7} textAnchor="middle" className="fill-tertiary text-[10px]">
                    {d.label}
                  </text>
                )}
                {/* Area sentuh selebar satu pita penuh, lebih besar dari kolomnya */}
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={plotH + PAD.bottom}
                  fill="transparent"
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={() => setActive(i)}
                />
              </g>
            );
          })}
        </svg>
      )}

      {current && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 w-max max-w-[150px] -translate-x-1/2 rounded-md border border-border bg-card px-2.5 py-1.5 text-center shadow-menu dark:shadow-menu-dark"
          style={{ left: tipLeft }}
        >
          <p className="text-[13px] font-semibold leading-tight text-primary">{format(current.value)}</p>
          <p className="mt-0.5 text-[11px] leading-tight text-secondary">{current.title}</p>
        </div>
      )}
    </div>
  );
}
