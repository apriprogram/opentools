import React from 'react';
import { ArrowUpDown, Rows3, Search, X } from 'lucide-react';
import Select from '../../ui/Select';
import { PER_PAGE_OPTIONS } from './useTableControls';

// Kolom isian ringkas. Kelas ios-no-zoom (index.css) memakai 16px khusus di iPhone, supaya layar tidak membesar saat kolom difokus.
const FIELD =
  'ios-no-zoom h-8 w-full rounded-md border border-border bg-card text-[12px] text-primary transition-smooth placeholder:text-tertiary focus:border-border-focus focus:outline-none sm:h-9 sm:text-[13px]';
const FIELD_ICON = 'pointer-events-none absolute top-1/2 -translate-y-1/2 text-tertiary';

const PER_PAGE = PER_PAGE_OPTIONS.map((n) => ({ id: String(n), label: `${n} baris` }));

// Dropdown kecil di atas tabel (urutkan, jumlah baris).
export function SelectField({ icon, label, value, onChange, options, className = '' }) {
  return <Select icon={icon} label={label} value={value} onChange={onChange} options={options} className={className} align="right" />;
}

// Tab filter model pil di atas tabel, lengkap dengan total datanya. Bisa digeser ke samping di ponsel.
function FilterTabs({ table, filters }) {
  return (
    <div className="overflow-x-auto px-2.5 pt-2.5 [scrollbar-width:none] sm:px-4 sm:pt-4 [&::-webkit-scrollbar]:hidden">
      <div role="tablist" aria-label="Filter data" className="inline-flex gap-0.5 rounded-md bg-card-muted p-0.5 sm:gap-1 sm:rounded-lg sm:p-1">
        {filters.map((f) => {
          const active = table.filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => table.setFilter(f.id)}
              className={`flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-2 text-[11px] font-medium transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-9 sm:gap-2 sm:rounded-md sm:px-3.5 sm:text-[13px] ${
                active ? 'bg-card text-primary shadow-tab dark:bg-zinc-700 dark:shadow-none' : 'text-secondary hover:text-primary'
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1 py-px text-[9px] font-semibold tabular-nums sm:px-1.5 sm:text-[11px] ${
                  active ? 'bg-accent-black text-card' : 'bg-card text-secondary dark:bg-zinc-800'
                }`}
              >
                {table.filterCounts[f.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Kontrol di atas tabel: tab filter, lalu cari, urutkan, dan jumlah per halaman.
export default function TableToolbar({ table, filters = [], sorts = [], searchPlaceholder = 'Cari...' }) {
  return (
    <div className="border-b border-border">
      {filters.length > 0 && <FilterTabs table={table} filters={filters} />}

      <div className="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4">
        <label className="relative block min-w-0 sm:w-[260px] lg:w-[300px]">
          <span className="sr-only">Cari</span>
          <Search size={14} strokeWidth={1.75} aria-hidden="true" className={`${FIELD_ICON} left-2.5`} />
          <input
            type="search"
            value={table.search}
            onChange={(e) => table.setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            title={searchPlaceholder}
            className={`${FIELD} pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden`}
          />
          {table.search && (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => table.setSearch('')}
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-sm text-tertiary transition-smooth hover:text-primary"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          )}
        </label>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:gap-3">
          {sorts.length > 0 && (
            <SelectField icon={ArrowUpDown} label="Urutkan" value={table.sort} onChange={table.setSort} options={sorts} className="sm:w-[180px]" />
          )}
          <SelectField
            icon={Rows3}
            label="Jumlah per halaman"
            value={String(table.perPage)}
            onChange={(v) => table.setPerPage(Number(v))}
            options={PER_PAGE}
            className="sm:w-[150px]"
          />
        </div>
      </div>
    </div>
  );
}
