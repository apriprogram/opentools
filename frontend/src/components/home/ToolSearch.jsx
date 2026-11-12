import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ArrowUpRight, Minimize2, Search, X } from 'lucide-react';
import { fetchCompressors, fetchTools } from '../../services/converterApi';

// Pencarian tools di beranda: fitur utama, semua konverter, dan semua kompresor.
// Daftar konverter dan kompresor baru dimuat saat kolom pencarian pertama kali dipakai.

// Kata sambung yang tidak ikut dicocokkan, supaya "mp4 ke mp3" dicari sebagai "mp4" dan "mp3".
const STOP_WORDS = new Set(['ke', 'to', 'jadi', 'menjadi', 'dari', 'dan', 'file', 'convert', 'konversi', 'ubah']);
const normalize = (text) => String(text || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();

/** Daftar semua tools yang bisa dicari. features: kartu fitur beranda [{ title, desc, chips, to, icon }]. */
export function useToolIndex(features, active) {
  const [tools, setTools] = useState(null);

  useEffect(() => {
    if (!active || tools) return undefined;
    let alive = true;
    Promise.allSettled([fetchTools(), fetchCompressors()]).then(([converters, compressors]) => {
      if (!alive) return;
      const flat = (result, kind, base, icon) =>
        result.status === 'fulfilled'
          ? (result.value?.categories || []).flatMap((category) =>
              (category.tools || []).map((tool) => ({
                key: `${kind}-${tool.id}`,
                label: tool.label,
                desc: tool.description || '',
                to: `${base}/${tool.id}`,
                icon,
                kind,
                from: tool.from || [],
                target: tool.to || [],
                group: category.label,
              }))
            )
          : [];
      setTools([...flat(converters, 'Konverter', '/convert', ArrowLeftRight), ...flat(compressors, 'Kompresor', '/compress', Minimize2)]);
    });
    return () => {
      alive = false;
    };
  }, [active, tools]);

  return useMemo(() => {
    const featureItems = features.map((f) => ({
      key: `fitur-${f.to}`,
      label: f.title,
      desc: f.desc,
      to: f.to,
      icon: f.icon,
      kind: 'Fitur',
      from: [],
      target: [],
      group: (f.chips || []).join(' '),
    }));
    return { items: [...featureItems, ...(tools || [])], loading: active && tools === null };
  }, [features, tools, active]);
}

/** Hasil pencarian, diurutkan dari yang paling cocok. Semua kata harus ditemukan di satu tools. */
export function searchTools(items, query) {
  const words = normalize(query).split(' ').filter((w) => w && !STOP_WORDS.has(w));
  if (!words.length) return [];
  const scored = [];
  for (const item of items) {
    const label = normalize(item.label);
    const formats = [...item.from, ...item.target].map(normalize);
    const rest = normalize(`${item.desc} ${item.group} ${item.kind}`);
    let score = 0;
    let matched = true;
    words.forEach((word, i) => {
      if (label.includes(word)) score += label.startsWith(word) ? 6 : 4;
      else if (formats.some((f) => f === word)) score += 3;
      else if (formats.some((f) => f.includes(word)) || rest.includes(word)) score += 1;
      else matched = false;
      // "mp4 mp3": kata pertama cocok dengan format asal dan kata terakhir dengan format tujuan.
      if (i === 0 && item.from.map(normalize).includes(word)) score += 1;
      if (i === words.length - 1 && words.length > 1 && item.target.map(normalize).includes(word)) score += 2;
    });
    if (matched) scored.push({ item, score: score + (item.kind === 'Fitur' ? 1 : 0) });
  }
  return scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label)).map((s) => s.item);
}

export function SearchBox({ value, onChange, onFocus, onSubmit }) {
  const inputRef = useRef(null);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="relative mt-3 sm:mt-4 sm:max-w-[420px]"
    >
      <label htmlFor="home-search" className="sr-only">Cari tools</label>
      <Search size={16} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary max-sm:h-3.5 max-sm:w-3.5" />
      <input
        ref={inputRef}
        id="home-search"
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        placeholder="Cari tools, misalnya MP4 ke MP3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            onChange('');
          }
        }}
        className="glass ios-no-zoom h-10 w-full rounded-full pl-9 pr-9 text-[12px] text-primary placeholder:text-secondary transition-smooth focus:border-blue-500 focus:outline-none sm:h-11 sm:text-[13px] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label="Hapus pencarian"
          className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-tertiary transition-smooth hover:bg-card-muted hover:text-primary"
        >
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </form>
  );
}

const MAX_RESULTS = 24;

export function SearchResults({ query, results, loading }) {
  const shown = results.slice(0, MAX_RESULTS);
  return (
    <section aria-labelledby="home-search-heading">
      <h2 id="home-search-heading" aria-live="polite" className="mb-2 text-[12px] text-secondary sm:mb-3 sm:text-[13px]">
        {loading && !results.length
          ? 'Mencari...'
          : results.length
            ? `${results.length} tools cocok dengan "${query.trim()}"`
            : `Tidak ada tools yang cocok dengan "${query.trim()}"`}
      </h2>

      {shown.length > 0 ? (
        <ul role="list" className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {shown.map((item) => (
            <li key={item.key} className="min-w-0">
              <Link
                to={item.to}
                className="glass group flex h-full min-w-0 items-center gap-2.5 rounded-[22px] p-2.5 transition-colors duration-200 ease-out hover:bg-white dark:hover:bg-white/[0.14] sm:gap-3 sm:p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] sm:h-10 sm:w-10">
                  <item.icon size={16} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[13px] font-medium text-primary sm:text-[14px]">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-secondary sm:text-[12px]">
                    {item.kind}
                    {item.from.length > 0 && ` · ${item.from.slice(0, 3).join(', ').toUpperCase()} ke ${item.target.slice(0, 3).join(', ').toUpperCase()}`}
                  </span>
                </span>
                <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-tertiary transition-colors duration-200 group-hover:text-blue-500" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        !loading && (
          <div className="glass rounded-[28px] p-5 text-center sm:p-8">
            <p className="text-[13px] text-primary sm:text-[14px]">Coba kata lain, misalnya nama format seperti JPG atau MP3.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Link to="/converters" className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[12px] font-medium text-primary transition-smooth hover:border-blue-500">Semua konverter</Link>
              <Link to="/compressors" className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[12px] font-medium text-primary transition-smooth hover:border-blue-500">Semua kompresor</Link>
            </div>
          </div>
        )
      )}

      {results.length > MAX_RESULTS && (
        <p className="mt-3 text-center text-[12px] text-tertiary">Menampilkan {MAX_RESULTS} hasil teratas. Tambahkan kata supaya lebih spesifik.</p>
      )}
    </section>
  );
}
