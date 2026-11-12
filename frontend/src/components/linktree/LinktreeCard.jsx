import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Copy, Eye, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { PublishChip } from '../panel/Chips';
import LinktreeView, { pageBackground } from './LinktreeView';
import PhoneMockup from './PhoneMockup';
import { fetchLinktree } from '../../services/linktreeApi';

// Isi layar mockup dikecilkan supaya halaman tergambar selebar ponsel sungguhan (sekitar 360px).
const SCREEN_ZOOM = 0.76;

const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

// Pratinjau halaman Linktree di dalam ponsel 3D: tema, foto, dan tautan aslinya, hanya untuk dilihat.
// Ponsel miring mengikuti kursor; isinya tidak bisa diklik karena seluruh ponsel adalah tautan ke editor.
function LinktreePhone({ id, title }) {
  const [tree, setTree] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchLinktree(id)
      .then((data) => alive && setTree(data))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [id]);

  const theme = tree?.theme || {};

  return (
    <PhoneMockup
      ink={tree ? theme.text || '#111111' : '#FFFFFF'}
      label={`Pratinjau ${title}`}
      float={false}
      className="shrink-0 px-5 pb-9 pt-5 [zoom:0.46] sm:[zoom:0.56]"
    >
      {tree ? (
        <div className="pointer-events-none min-h-full select-none pt-8" style={{ ...pageBackground(theme), zoom: SCREEN_ZOOM }}>
          <LinktreeView tree={tree} preview plain />
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

function Stat({ label, value }) {
  return (
    <div className="min-w-0 rounded-md bg-card-muted px-1 py-2 sm:rounded-lg sm:py-3">
      <p className="text-[14px] font-semibold tabular-nums leading-tight text-primary sm:text-[18px]">{Number(value || 0).toLocaleString('id-ID')}</p>
      <p className="mt-0.5 truncate text-[10px] text-tertiary sm:text-[12px]">{label}</p>
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

// Kartu satu Linktree di panel user: pratinjau di ponsel 3D, status, statistik, dan aksi.
export default function LinktreeCard({ tree, onDelete }) {
  const { addToast: toast } = useToast();
  const [copied, setCopied] = useState(false);
  const editPath = `/dashboard/linktree/${tree.id}`;
  const publicUrl = `${window.location.origin}/l/${tree.slug}`;

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
    <div className="flex items-stretch gap-2 rounded-2xl border border-border bg-card p-3 sm:gap-5 sm:p-6">
      <Link
        to={editPath}
        title={`Edit ${tree.title}`}
        aria-label={`Edit ${tree.title}`}
        className="flex shrink-0 items-center rounded-2xl bg-card-muted transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <LinktreePhone id={tree.id} title={tree.title} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col py-1 sm:py-2">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight text-primary sm:text-[19px]" title={tree.title}>{tree.title}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-tertiary sm:text-[12px]">/l/{tree.slug}</p>
          </div>
          <PublishChip published={tree.published} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center sm:mt-5 sm:gap-2.5">
          <Stat label="Tautan" value={tree.linkCount} />
          <Stat label="Klik" value={tree.clicks} />
          <Stat label="Kunjungan" value={tree.views} />
        </div>

        <p className="mt-2.5 text-[11px] text-tertiary sm:mt-4 sm:text-[12px]">Diubah {tanggal(tree.updatedAt || tree.createdAt)}</p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3 sm:gap-2 sm:pt-5">
          <Link
            to={editPath}
            aria-label={`Edit ${tree.title}`}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-accent-black px-3 text-[12px] font-medium text-card shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition-smooth hover:bg-accent-black-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-10 sm:gap-2 sm:px-4 sm:text-[13px]"
          >
            <Pencil size={14} strokeWidth={1.75} aria-hidden="true" /> Edit
          </Link>
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
    </div>
  );
}
