import React from 'react';
import { ArrowUpDown, ChevronDown, Filter, Search, X } from 'lucide-react';

// Kolom isian: 16px di ponsel supaya iOS tidak memperbesar layar saat difokus.
const FIELD =
  'h-10 w-full rounded-md border border-border bg-card text-primary transition-smooth placeholder:text-tertiary focus:border-border-focus focus:outline-none max-sm:text-[16px] sm:h-9 sm:text-[13px]';
const FIELD_ICON = 'pointer-events-none absolute top-1/2 -translate-y-1/2 text-tertiary';

export function SelectField({ icon: Icon, label, value, onChange, options, className = '' }) {
  return (
    <label className={`relative block min-w-0 ${className}`}>
      <span className="sr-only">{label}</span>
      {Icon && <Icon size={14} strokeWidth={1.75} aria-hidden="true" className={`${FIELD_ICON} left-2.5`} />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD} cursor-pointer appearance-none pr-7 ${Icon ? 'pl-8' : 'pl-2.5'}`}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" className={`${FIELD_ICON} right-2`} />
    </label>
  );
}

// Baris kontrol di atas tabel: cari, filter, dan urutkan.
export default function TableToolbar({ table, filters = [], sorts = [], searchPlaceholder = 'Cari...' }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
      <label className="relative block min-w-0 flex-1">
        <span className="sr-only">Cari</span>
        <Search size={14} strokeWidth={1.75} aria-hidden="true" className={`${FIELD_ICON} left-2.5`} />
        <input
          type="search"
          value={table.search}
          onChange={(e) => table.setSearch(e.target.value)}
          placeholder={searchPlaceholder}
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

      {(filters.length > 0 || sorts.length > 0) && (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          {filters.length > 0 && (
            <SelectField icon={Filter} label="Filter" value={table.filter} onChange={table.setFilter} options={filters} className="sm:w-[190px]" />
          )}
          {sorts.length > 0 && (
            <SelectField icon={ArrowUpDown} label="Urutkan" value={table.sort} onChange={table.setSort} options={sorts} className="sm:w-[180px]" />
          )}
        </div>
      )}
    </div>
  );
}
