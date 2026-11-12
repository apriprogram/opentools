import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const isEmpty = (value) => value === null || value === undefined || value === '' || value === false;

// Satu kelompok data di modal detail, berbentuk kartu dengan judul dan ikon.
// rows: [[label, nilai, { wide }]]. Nilai kosong ditampilkan sebagai "-". wide: memakai lebar penuh.
export function DetailSection({ title, icon: Icon, rows = [], children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border">
      <h3 className="flex items-center gap-2 border-b border-border bg-card-muted px-3 py-2 text-[12px] font-semibold text-primary sm:px-4 sm:py-2.5 sm:text-[13px]">
        {Icon && <Icon size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-secondary" />}
        {title}
      </h3>
      {rows.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 sm:gap-x-6 sm:gap-y-4 sm:p-4">
          {rows.map(([label, value, options]) => (
            <div key={label} className={`min-w-0 ${options?.wide ? 'col-span-2' : ''}`}>
              <dt className="text-[11px] text-tertiary sm:text-[12px]">{label}</dt>
              <dd className="mt-0.5 min-w-0 text-[12px] font-medium text-primary [overflow-wrap:anywhere] sm:text-[13px]">
                {isEmpty(value) ? <span className="font-normal text-tertiary">-</span> : value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {children && <div className={`p-3 sm:p-4 ${rows.length > 0 ? 'border-t border-border' : ''}`}>{children}</div>}
    </section>
  );
}

// Modal detail: kepala (ikon, judul, chip), ringkasan, isi yang bisa digulir, dan baris tombol.
// summary: [{ label, value }] ditampilkan sebagai kotak ringkasan di atas isi.
// wide: modal selebar layar (untuk isi yang butuh ruang besar, misalnya pratinjau desktop).
export default function DetailModal({ title, subtitle, icon: Icon, badges, summary, onClose, children, footer, wide = false }) {
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

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 animate-in fade-in duration-150 motion-reduce:animate-none sm:items-center sm:p-4"
      onClick={() => closeRef.current()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`flex max-h-[92vh] w-full ${wide ? 'max-w-[1180px]' : 'max-w-2xl'} flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-menu animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none dark:shadow-menu-dark sm:rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-card-muted text-primary sm:h-10 sm:w-10">
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-semibold leading-snug text-primary sm:text-[16px]">{title}</h2>
            {subtitle && <p className="truncate text-[12px] text-secondary">{subtitle}</p>}
            {badges && <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div>}
          </div>
          <button
            type="button"
            onClick={() => closeRef.current()}
            aria-label="Tutup"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-secondary transition-smooth hover:bg-card-muted hover:text-primary"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:space-y-4 sm:px-5">
          {summary && summary.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {summary.map(({ label, value }) => (
                <div key={label} className="min-w-0 rounded-sm bg-card-muted px-3 py-2.5">
                  <p className="truncate text-[10px] uppercase tracking-wider text-tertiary sm:text-[11px]">{label}</p>
                  <p className="mt-0.5 truncate text-[14px] font-semibold tabular-nums text-primary sm:text-[15px]">{value}</p>
                </div>
              ))}
            </div>
          )}
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card-muted px-4 py-3 sm:px-5">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
