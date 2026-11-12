import { useEffect, useMemo, useState } from 'react';

export const PER_PAGE_OPTIONS = [5, 10, 25, 50];

// Gaya sel tabel panel. Di ponsel font dan padding lebih kecil.
const CELL = 'px-2.5 py-2.5 align-top text-[12px] sm:px-3 sm:py-3 sm:text-[13px]';
const HEAD =
  'whitespace-nowrap px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-tertiary sm:px-3 sm:py-2.5 sm:text-[11px]';
export const TH = `${HEAD} text-left`;
export const TD = `${CELL} text-secondary`;
export const TD_NUM = `${CELL} w-10 tabular-nums text-tertiary`;

// Kolom aksi menempel di sisi kanan, jadi tombolnya tetap terlihat saat tabel digulir ke samping.
// Garis kirinya digambar dengan pseudo-element, karena border sel sticky tidak ikut bergeser.
const STICKY = 'sticky right-0 z-[1] before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border';
export const TH_ACTION = `${HEAD} ${STICKY} bg-card-muted text-right`;
export const TD_ACTION = `${CELL} ${STICKY} bg-card transition-smooth group-hover:bg-card-muted`;

// Kontrol tabel di sisi browser: cari, filter, urutkan, jumlah per halaman, dan halaman.
// filters: [{ id, label, test? }]  sorts: [{ id, label, compare }]  searchText: (row) => string
// filters, sorts, dan searchText harus konstanta (didefinisikan di luar komponen).
export function useTableControls(rows, { searchText, filters = [], sorts = [], initialFilter, initialSort, initialPerPage = 10 } = {}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter ?? filters[0]?.id ?? '');
  const [sort, setSort] = useState(initialSort ?? sorts[0]?.id ?? '');
  const [perPage, setPerPage] = useState(initialPerPage);
  const [page, setPage] = useState(1);

  const processed = useMemo(() => {
    let out = rows || [];
    const activeFilter = filters.find((f) => f.id === filter);
    if (activeFilter?.test) out = out.filter(activeFilter.test);
    const q = search.trim().toLowerCase();
    if (q && searchText) out = out.filter((row) => searchText(row).toLowerCase().includes(q));
    const activeSort = sorts.find((s) => s.id === sort);
    if (activeSort?.compare) out = [...out].sort(activeSort.compare);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, filter, sort]);

  // Jumlah data per filter (tanpa pencarian), ditampilkan di tab filter.
  const filterCounts = useMemo(() => {
    const list = rows || [];
    return Object.fromEntries(filters.map((f) => [f.id, f.test ? list.filter(f.test).length : list.length]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  // Ganti pencarian, filter, urutan, atau jumlah per halaman: kembali ke halaman pertama.
  useEffect(() => {
    setPage(1);
  }, [search, filter, sort, perPage]);

  const total = processed.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * perPage;

  return {
    search,
    setSearch,
    filter,
    setFilter,
    filterCounts,
    sort,
    setSort,
    perPage,
    setPerPage,
    page: current,
    setPage,
    pageCount,
    total,
    start,
    pageRows: processed.slice(start, start + perPage),
  };
}
