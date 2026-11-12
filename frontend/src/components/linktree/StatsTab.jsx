import React from 'react';
import { SOCIAL_BY_ID } from './constants';

// Statistik: kunjungan halaman dan klik tiap tautan. Angka diambil saat Linktree terakhir dimuat atau disimpan.
export default function StatsTab({ tree }) {
  const rows = tree.items.filter((i) => i.type !== 'header');
  const totalClicks = rows.reduce((sum, i) => sum + (i.clicks || 0), 0);
  const max = Math.max(1, ...rows.map((i) => i.clicks || 0));
  const active = rows.filter((i) => i.enabled).length;

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card label="Kunjungan halaman" value={tree.views} />
        <Card label="Total klik" value={totalClicks} />
        <Card label="Tautan aktif" value={active} />
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold text-primary">Klik per tautan</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-[13px] text-secondary">Belum ada tautan. Tambahkan tautan di tab Tautan.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {rows.map((i) => (
              <li key={i.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-[13px] text-primary">
                    {i.type === 'social' ? SOCIAL_BY_ID[i.platform]?.label || 'Ikon sosial' : i.title}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-primary">{i.clicks || 0}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-card-muted">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${Math.round(((i.clicks || 0) / max) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 text-[12px] text-tertiary">Muat ulang halaman untuk melihat angka terbaru.</p>
      </section>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <p className="truncate text-[11px] text-secondary sm:text-[12px]">{label}</p>
      <p className="mt-1 text-[18px] font-semibold tabular-nums text-primary sm:mt-2 sm:text-[24px]">{value}</p>
    </div>
  );
}
