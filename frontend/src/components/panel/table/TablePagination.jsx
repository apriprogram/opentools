import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PER_PAGE_OPTIONS } from './useTableControls';
import { SelectField } from './TableToolbar';

const PAGE_BTN =
  'flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[12px] font-medium tabular-nums transition-smooth disabled:cursor-not-allowed disabled:opacity-40';
const PAGE_IDLE = 'border-border text-secondary hover:border-border-hover hover:text-primary';
const PAGE_ACTIVE = 'border-accent-black bg-accent-black text-card';

// Nomor halaman ringkas: 1 … 4 5 6 … 12
const pageList = (current, count) => {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const pages = new Set([1, count, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
};

// Baris bawah tabel: jumlah data, pilihan jumlah per halaman, dan tombol halaman.
export default function TablePagination({ table, label = 'data' }) {
  const from = table.total === 0 ? 0 : table.start + 1;
  const to = Math.min(table.start + table.perPage, table.total);
  const perPageOptions = PER_PAGE_OPTIONS.map((n) => ({ id: String(n), label: `${n} per halaman` }));

  return (
    <div className="flex flex-col gap-3 border-t border-border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <p className="text-[12px] text-secondary sm:text-[13px]">
          {table.total === 0 ? `Tidak ada ${label}` : `Menampilkan ${from}–${to} dari ${table.total} ${label}`}
        </p>
        <SelectField
          label="Jumlah per halaman"
          value={String(table.perPage)}
          onChange={(v) => table.setPerPage(Number(v))}
          options={perPageOptions}
          className="w-[150px] shrink-0"
        />
      </div>

      <nav aria-label="Halaman tabel" className="flex items-center justify-between gap-1.5 sm:justify-end">
        <button
          type="button"
          aria-label="Halaman sebelumnya"
          disabled={table.page <= 1}
          onClick={() => table.setPage(table.page - 1)}
          className={`${PAGE_BTN} ${PAGE_IDLE}`}
        >
          <ChevronLeft size={15} strokeWidth={1.75} />
        </button>

        {/* Ponsel: cukup "Hal 2 / 5". Layar lebih besar: nomor halaman. */}
        <span className="text-[12px] tabular-nums text-secondary sm:hidden">Hal {table.page} / {table.pageCount}</span>
        <div className="hidden items-center gap-1.5 sm:flex">
          {pageList(table.page, table.pageCount).map((p) =>
            typeof p === 'string' ? (
              <span key={p} className="px-1 text-[12px] text-tertiary">…</span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === table.page ? 'page' : undefined}
                onClick={() => table.setPage(p)}
                className={`${PAGE_BTN} ${p === table.page ? PAGE_ACTIVE : PAGE_IDLE}`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          aria-label="Halaman berikutnya"
          disabled={table.page >= table.pageCount}
          onClick={() => table.setPage(table.page + 1)}
          className={`${PAGE_BTN} ${PAGE_IDLE}`}
        >
          <ChevronRight size={15} strokeWidth={1.75} />
        </button>
      </nav>
    </div>
  );
}
