import React from 'react';

// Kerangka (skeleton) saat data dimuat: blok abu-abu yang berdenyut pelan, berbentuk seperti isi yang akan tampil.
// Warnanya ditulis langsung (bukan token dengan /opacity) supaya terlihat di mode terang dan gelap.
const BLOCK = 'block animate-pulse rounded-md bg-black/[0.07] motion-reduce:animate-none dark:bg-white/[0.09]';

export default function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`${BLOCK} ${className}`} />;
}

// Lebar baris teks bergantian supaya tidak terlihat seperti pagar.
const WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-2/5', 'w-3/5'];

/** Baris tabel kerangka. cols: jumlah kolom tabel, termasuk kolom nomor dan aksi. */
export function SkeletonRows({ rows = 6, cols = 6 }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r} aria-hidden="true">
      {Array.from({ length: cols }, (_, c) => (
        <td key={c} className="px-3 py-4 align-middle sm:px-4">
          {c === 0 ? (
            <Skeleton className="h-3 w-4" />
          ) : c === cols - 1 ? (
            <span className="flex justify-end gap-1.5">
              <Skeleton className="h-8 w-8 !rounded-full" />
              <Skeleton className="h-8 w-8 !rounded-full" />
            </span>
          ) : (
            <span className="block space-y-2">
              <Skeleton className={`h-3 ${WIDTHS[(r + c) % WIDTHS.length]}`} />
              {c === 1 && <Skeleton className="h-2.5 w-1/3" />}
            </span>
          )}
        </td>
      ))}
    </tr>
  ));
}

/** Kartu ringkasan angka kerangka (sama bentuknya dengan StatCards). */
export function SkeletonStatCards({ count = 4 }) {
  return (
    <div aria-hidden="true" className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:gap-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-start gap-2.5 rounded-2xl border border-border bg-card p-3 sm:gap-3 sm:p-4">
          <Skeleton className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-2.5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Kartu konten kerangka: judul, beberapa baris teks, dan (opsional) area gambar/grafik. */
export function SkeletonCard({ lines = 3, media = false, className = '' }) {
  return (
    <div aria-hidden="true" className={`rounded-2xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={`h-3 ${WIDTHS[i % WIDTHS.length]}`} />
        ))}
      </div>
      {media && <Skeleton className="mt-4 h-40 w-full sm:h-48" />}
    </div>
  );
}

/** Kerangka satu halaman panel: kartu ringkasan lalu dua kartu konten. Dipakai selama data halaman dimuat. */
export function SkeletonPage({ stats = 4, cards = 2 }) {
  return (
    <div role="status" aria-label="Memuat data">
      {stats > 0 && <SkeletonStatCards count={stats} />}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        {Array.from({ length: cards }, (_, i) => (
          <SkeletonCard key={i} lines={2} media />
        ))}
      </div>
    </div>
  );
}

/** Daftar kartu kerangka (misalnya daftar QR, Linktree, Twibbon). */
export function SkeletonList({ count = 2, columns = 'xl:grid-cols-2' }) {
  return (
    <div role="status" aria-label="Memuat data" className={`grid gap-3 sm:gap-4 ${columns}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-hidden="true">
          <Skeleton className="h-24 w-24 shrink-0 !rounded-xl sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1 space-y-2.5 py-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-16 !rounded-full" />
              <Skeleton className="h-8 w-8 !rounded-full" />
              <Skeleton className="h-8 w-8 !rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
