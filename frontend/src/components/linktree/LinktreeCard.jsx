import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Copy, Eye, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { PublishChip } from '../panel/Chips';
import LinktreeView from './LinktreeView';
import { fetchLinktree } from '../../services/linktreeApi';

// Ukuran miniatur. Halaman digambar selebar ponsel (360px) lalu dikecilkan.
const PAGE_WIDTH = 360;
const THUMB_WIDTH = 132;
const THUMB_HEIGHT = 232;
const SCALE = THUMB_WIDTH / PAGE_WIDTH;

const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

// Miniatur halaman Linktree: tema, foto, dan tautan aslinya, hanya untuk dilihat.
function LinktreeThumb({ id, title }) {
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

  return (
    <div
      aria-hidden="true"
      className="relative shrink-0 overflow-hidden rounded-md border border-border bg-card-muted"
      style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
    >
      {tree ? (
        <div
          className="pointer-events-none absolute left-0 top-0 select-none"
          style={{ width: PAGE_WIDTH, height: THUMB_HEIGHT / SCALE, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}
        >
          <LinktreeView tree={tree} preview />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-[15px] font-semibold text-secondary">
            {(title || '?').trim().slice(0, 1).toUpperCase() || '?'}
          </span>
          <span className="text-[11px] text-tertiary">{failed ? 'Pratinjau tidak bisa dimuat' : 'Memuat pratinjau...'}</span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="min-w-0 rounded-sm bg-card-muted px-1 py-1.5 sm:py-2">
      <p className="text-[14px] font-semibold tabular-nums leading-tight text-primary sm:text-[16px]">{Number(value || 0).toLocaleString('id-ID')}</p>
      <p className="truncate text-[10px] text-tertiary sm:text-[11px]">{label}</p>
    </div>
  );
}

// Tombol ikon di kartu. Keterangannya tampil saat disorot (title) dan dibaca pembaca layar (aria-label).
const ICON_BTN = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-9 sm:w-9';
const ICON_TONE = {
  primary: 'border-accent-black bg-accent-black text-card hover:opacity-90',
  neutral: 'border-border text-secondary hover:border-blue-500 hover:text-blue-500',
  danger: 'border-border text-secondary hover:border-red-500 hover:text-red-500',
};
const iconBtn = (tone) => `${ICON_BTN} ${ICON_TONE[tone]}`;

// Kartu satu Linktree di panel user: miniatur halaman, status, statistik, dan aksi.
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
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 transition-smooth hover:border-blue-500 sm:gap-4 sm:p-4">
      <Link to={editPath} title={`Edit ${tree.title}`} aria-label={`Edit ${tree.title}`} className="shrink-0 rounded-md transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <LinktreeThumb id={tree.id} title={tree.title} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-primary sm:text-[15px]" title={tree.title}>{tree.title}</p>
            <p className="truncate font-mono text-[11px] text-tertiary sm:text-[12px]">/l/{tree.slug}</p>
          </div>
          <PublishChip published={tree.published} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
          <Stat label="Tautan" value={tree.linkCount} />
          <Stat label="Klik" value={tree.clicks} />
          <Stat label="Kunjungan" value={tree.views} />
        </div>

        <p className="mt-2 text-[11px] text-tertiary">Diubah {tanggal(tree.updatedAt || tree.createdAt)}</p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3 sm:gap-2">
          <Link to={editPath} title="Edit Linktree" aria-label={`Edit ${tree.title}`} className={iconBtn('primary')}>
            <Pencil size={15} strokeWidth={1.75} aria-hidden="true" />
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
