import React from 'react';

// Ringkasan angka di atas tabel. items: [{ label, value, icon, hint? }]
export default function StatCards({ items }) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, hint }) => (
        <div key={label} className="flex min-w-0 items-start gap-2.5 rounded-2xl border border-border bg-card p-3 sm:gap-3 sm:p-4">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-card-muted text-secondary sm:h-9 sm:w-9">
              <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[11px] text-secondary sm:text-[12px]">{label}</p>
            <p className="truncate text-[16px] font-semibold tabular-nums leading-tight text-primary sm:text-[20px]">{value}</p>
            {hint && <p className="mt-0.5 truncate text-[10px] text-tertiary sm:text-[11px]">{hint}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
