import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CheckCheck, Copy, Eye, Link2, MousePointerClick, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { PublishChip } from '../panel/Chips';
import LinktreeView, { pageBackground } from './LinktreeView';
import LinktreeStatsModal from './LinktreeStatsModal';
import PhoneMockup from './PhoneMockup';
import { fetchLinktree } from '../../services/linktreeApi';

// Isi layar mockup dikecilkan supaya halaman tergambar selebar ponsel sungguhan (sekitar 360px).
const SCREEN_ZOOM = 0.76;

const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const angka = (n) => Number(n || 0).toLocaleString('id-ID');

// Pratinjau halaman Linktree di dalam ponsel 3D: tema, foto, dan tautan aslinya, hanya untuk dilihat.
// Ponsel miring mengikuti kursor; isinya tidak bisa diklik karena seluruh ponsel adalah tautan ke editor.
// detail: Linktree lengkap (null selama dimuat). failed: gagal dimuat.
function LinktreePhone({ detail, failed, title }) {
  const theme = detail?.theme || {};

  return (
    <PhoneMockup
      ink={detail ? theme.text || '#111111' : '#FFFFFF'}
      label={`Pratinjau ${title}`}
      className="shrink-0 px-4 pb-8 pt-3 [zoom:0.46] sm:[zoom:0.56]"
    >
      {detail ? (
        <div className="pointer-events-none min-h-full select-none pt-8" style={{ ...pageBackground(theme), zoom: SCREEN_ZOOM }}>
          <LinktreeView tree={detail} preview plain />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-900 px-6 text-center text-white">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 text-[24px] font-semibold">
            {(title || '?').trim().slice(0, 1).toUpperCase() || '?'}
          </span>
          <span className="text-[18px] text-white/70">{failed ? 'Pratinjau tidak bisa dimuat' : 'Memuat pratinjau...'}</span>
        </div>
      )}
    </PhoneMockup>
  );
}

// Warna ikon tiap angka. Angkanya sendiri tetap memakai warna teks utama.
const STAT_TONE = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

function Stat({ icon: Icon, tone, label, value }) {
  return (
    <div className="min-w-0 rounded-md border border-border px-1.5 py-2 sm:rounded-2xl sm:px-3 sm:py-3">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full sm:h-8 sm:w-8 ${STAT_TONE[tone]}`}>
        <Icon size={15} strokeWidth={1.75} aria-hidden="true" className="max-sm:h-3 max-sm:w-3" />
      </span>
      <p className="mt-1.5 text-[15px] font-semibold tabular-nums leading-tight tracking-tight text-primary sm:mt-2.5 sm:text-[22px]">{angka(value)}</p>
      <p className="truncate text-[10px] text-tertiary sm:text-[12px]">{label}</p>
    </div>
  );
}

// Tombol ikon di kartu. Keterangannya tampil saat disorot (title) dan dibaca pembaca layar (aria-label).
const ICON_BTN = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-10 sm:w-10';
const ICON_TONE = {
  neutral: 'border-border text-secondary hover:border-blue-500 hover:text-blue-500',
  danger: 'border-border text-secondary hover:border-red-500 hover:text-red-500',
};
const iconBtn = (tone) => `${ICON_BTN} ${ICON_TONE[tone]}`;
const PILL_BTN =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-10 sm:gap-2 sm:px-4 sm:text-[13px]';

// Kartu satu Linktree di panel user: pratinjau di ponsel 3D, status, angka ringkas, dan aksi.
export default function LinktreeCard({ tree, onDelete }) {
  const { addToast: toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [detail, setDetail] = useState(null);
  const [failed, setFailed] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const editPath = `/dashboard/linktree/${tree.id}`;
  const publicUrl = `${window.location.origin}/l/${tree.slug}`;

  // Linktree lengkap (tema dan tautan) dimuat sekali: dipakai pratinjau ponsel dan modal statistik.
  useEffect(() => {
    let alive = true;
    fetchLinktree(tree.id)
      .then((data) => alive && setDetail(data))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [tree.id]);

  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  // Salin alamat publik. Untuk draf, alamatnya baru bisa dibuka orang lain setelah diterbitkan.
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        type: 'success',
        title: 'Link disalin',
        message: tree.published ? publicUrl : `${publicUrl} (baru bisa dibuka orang lain setelah diterbitkan)`,
      });
    } catch {
      toast({ type: 'error', title: 'Gagal menyalin', message: `Salin manual: ${publicUrl}` });
    }
  };

  return (
    <div className="flex items-stretch gap-1 rounded-2xl border border-border bg-card p-3 sm:gap-4 sm:p-6">
      <Link
        to={editPath}
        title={`Edit ${tree.title}`}
        aria-label={`Edit ${tree.title}`}
        className="flex shrink-0 items-center rounded-2xl transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <LinktreePhone detail={detail} failed={failed} title={tree.title} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col py-1 sm:py-2">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight text-primary sm:text-[19px]" title={tree.title}>{tree.title}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-tertiary sm:text-[12px]">/l/{tree.slug}</p>
          </div>
          <PublishChip published={tree.published} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-5 sm:gap-2.5">
          <Stat icon={Eye} tone="emerald" label="Kunjungan" value={tree.views} />
          <Stat icon={MousePointerClick} tone="violet" label="Klik" value={tree.clicks} />
          <Stat icon={Link2} tone="blue" label="Tautan" value={tree.linkCount} />
        </div>

        <p className="mt-2.5 text-[11px] text-tertiary sm:mt-4 sm:text-[12px]">Diubah {tanggal(tree.updatedAt || tree.createdAt)}</p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3 sm:gap-2 sm:pt-5">
          <Link
            to={editPath}
            aria-label={`Edit ${tree.title}`}
            className={`${PILL_BTN} bg-accent-black text-card shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-accent-black-hover`}
          >
            <Pencil size={14} strokeWidth={1.75} aria-hidden="true" /> Edit
          </Link>
          <button
            type="button"
            onClick={() => setShowStats(true)}
            aria-label={`Statistik ${tree.title}`}
            aria-haspopup="dialog"
            className={`${PILL_BTN} border border-border text-primary hover:border-blue-500 hover:text-blue-500`}
          >
            <BarChart3 size={14} strokeWidth={1.75} aria-hidden="true" /> Statistik
          </button>
          {/* Lihat halaman Linktree. Draf belum publik, jadi dibuka sebagai pratinjau khusus pemilik. */}
          <a
            href={tree.published ? `/l/${tree.slug}` : `/l/${tree.slug}?pratinjau=${encodeURIComponent(tree.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            title={tree.published ? 'Lihat link' : 'Lihat pratinjau draf (hanya kamu yang bisa melihat)'}
            aria-label={`Lihat halaman ${tree.title}`}
            className={iconBtn('neutral')}
          >
            <Eye size={15} strokeWidth={1.75} aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={copyLink}
            title={copied ? 'Link disalin' : 'Salin link'}
            aria-label={`Salin link ${tree.title}`}
            className={iconBtn('neutral')}
          >
            {copied ? <CheckCheck size={15} strokeWidth={1.75} aria-hidden="true" className="text-success" /> : <Copy size={15} strokeWidth={1.75} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(tree)}
            title="Hapus Linktree"
            aria-label={`Hapus ${tree.title}`}
            className={`${iconBtn('danger')} ml-auto`}
          >
            <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      {showStats && <LinktreeStatsModal tree={tree} detail={detail} failed={failed} onClose={() => setShowStats(false)} />}
    </div>
  );
}
