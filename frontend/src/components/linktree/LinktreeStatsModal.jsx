import React from 'react';
import { BarChart3, ExternalLink, Eye, Link2, MousePointerClick, Percent } from 'lucide-react';
import Button from '../ui/Button';
import DetailModal, { DetailSection } from '../panel/DetailModal';
import { PublishChip } from '../panel/Chips';
import { SOCIAL_BY_ID } from './constants';

const angka = (n) => Number(n || 0).toLocaleString('id-ID');
const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');

const TILE_TONE = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

function Tile({ icon: Icon, tone, label, value, note }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border p-3">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${TILE_TONE[tone]}`}>
        <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="mt-2.5 text-[20px] font-semibold tabular-nums leading-tight tracking-tight text-primary sm:text-[22px]">{value}</p>
      <p className="truncate text-[11px] text-tertiary sm:text-[12px]">{label}</p>
      {note && <p className="mt-1 truncate text-[10px] text-tertiary sm:text-[11px]">{note}</p>}
    </div>
  );
}

// Nama tautan untuk daftar klik: judul tautan, atau nama platform untuk ikon sosial.
const itemLabel = (item) =>
  item.type === 'social' ? SOCIAL_BY_ID[item.platform]?.label || item.platform || 'Ikon sosial' : item.title || item.url || 'Tanpa judul';

/**
 * Statistik satu Linktree: kunjungan, klik, rasio klik, dan klik per tautan.
 * tree: ringkasan dari daftar (views, clicks, linkCount). detail: Linktree lengkap dengan klik per tautan
 * (null selama dimuat). Riwayat per hari tidak dicatat server, jadi semua angka adalah total sejak dibuat.
 */
export default function LinktreeStatsModal({ tree, detail, failed, onClose }) {
  const views = Number(tree.views || 0);
  const clicks = Number(tree.clicks || 0);
  // Rasio klik: jumlah klik dibanding jumlah kunjungan. Bisa lebih dari 100% kalau satu pengunjung mengklik beberapa tautan.
  const ratio = views > 0 ? `${((clicks / views) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%` : '-';

  const rows = (detail?.items || [])
    .filter((item) => item.type === 'link' || item.type === 'social')
    .map((item) => ({ id: item.id, label: itemLabel(item), kind: item.type === 'social' ? 'Ikon sosial' : 'Tautan', clicks: Number(item.clicks || 0), enabled: item.enabled !== false }))
    .sort((a, b) => b.clicks - a.clicks || a.label.localeCompare(b.label));
  const top = Math.max(1, ...rows.map((row) => row.clicks));
  const total = rows.reduce((sum, row) => sum + row.clicks, 0);

  return (
    <DetailModal
      title={`Statistik ${tree.title}`}
      subtitle={`/l/${tree.slug}`}
      icon={BarChart3}
      badges={<PublishChip published={tree.published} />}
      onClose={onClose}
      footer={
        <>
          {tree.published && (
            <a href={`/l/${tree.slug}`} target="_blank" rel="noopener noreferrer" className="mr-auto">
              <Button size="sm" variant="ghost" icon={ExternalLink}>Lihat halaman</Button>
            </a>
          )}
          <Button size="sm" variant="secondary" onClick={onClose}>Tutup</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <Tile icon={Eye} tone="emerald" label="Kunjungan" value={angka(views)} />
        <Tile icon={MousePointerClick} tone="violet" label="Klik" value={angka(clicks)} />
        <Tile icon={Percent} tone="amber" label="Rasio klik" value={ratio} note="Klik dibanding kunjungan" />
        <Tile icon={Link2} tone="blue" label="Tautan" value={angka(tree.linkCount)} />
      </div>

      <DetailSection title="Klik per tautan" icon={MousePointerClick}>
        {!detail ? (
          <p className="text-[13px] text-tertiary">{failed ? 'Rincian tautan tidak bisa dimuat. Tutup lalu buka lagi.' : 'Memuat rincian...'}</p>
        ) : rows.length === 0 ? (
          <p className="text-[13px] text-secondary">Linktree ini belum punya tautan.</p>
        ) : (
          <>
            {total === 0 && <p className="mb-3 text-[12px] text-secondary sm:text-[13px]">Belum ada tautan yang diklik.</p>}
            <ul role="list" className="space-y-3">
              {rows.map((row) => (
                <li key={row.id} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-[13px] font-medium text-primary" title={row.label}>
                      {row.label}
                      <span className="ml-1.5 text-[11px] font-normal text-tertiary">
                        {row.kind}
                        {!row.enabled && ' · disembunyikan'}
                      </span>
                    </p>
                    <p className="shrink-0 text-[13px] font-semibold tabular-nums text-primary">
                      {angka(row.clicks)}
                      {total > 0 && <span className="ml-1.5 text-[11px] font-normal text-tertiary">{Math.round((row.clicks / total) * 100)}%</span>}
                    </p>
                  </div>
                  {/* Batang: panjangnya sebanding dengan tautan yang paling banyak diklik. */}
                  <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-card-muted">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: row.clicks > 0 ? `${Math.max(2, (row.clicks / top) * 100)}%` : 0 }} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </DetailSection>

      <p className="text-[11px] leading-relaxed text-tertiary sm:text-[12px]">
        Angka dihitung sejak Linktree dibuat pada {tanggal(tree.createdAt)}. Riwayat per hari belum dicatat, jadi grafik harian belum tersedia.
      </p>
    </DetailModal>
  );
}
