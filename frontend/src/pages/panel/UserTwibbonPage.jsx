import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Copy, Download, Eye, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import PanelLayout, { PanelCrumb } from '../../components/panel/PanelLayout';
import StatCards from '../../components/panel/table/StatCards';
import FramePreview from '../../components/twibbon/FramePreview';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { deleteTwibbon, fetchMyTwibbons } from '../../services/twibbonApi';

const angka = (n) => Number(n || 0).toLocaleString('id-ID');
const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

const ICON_BTN =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-9 sm:w-9';
const TONE = {
  primary: 'border-accent-black bg-accent-black text-card hover:opacity-90',
  neutral: 'border-border text-secondary hover:border-blue-500 hover:text-blue-500',
  danger: 'border-border text-secondary hover:border-red-500 hover:text-red-500',
};

// Kartu satu Twibbon: gambar bingkai, alamat, jumlah dilihat dan dipakai, serta aksi.
function TwibbonCard({ item, onDelete }) {
  const { addToast: toast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/c/${item.slug}`;

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ type: 'success', title: 'Link disalin', message: url });
    } catch {
      toast({ type: 'error', title: 'Gagal menyalin', message: `Salin manual: ${url}` });
    }
  };

  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 transition-smooth hover:border-blue-500 sm:gap-4 sm:p-4">
      <Link to={`/dashboard/twibbon/${item.id}`} title={`Edit ${item.title}`} aria-label={`Edit ${item.title}`} className="w-[104px] shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-[128px]">
        <FramePreview src={item.frameBase64} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-[14px] font-semibold text-primary sm:text-[15px]" title={item.title}>{item.title}</p>
        <p className="truncate font-mono text-[11px] text-tertiary sm:text-[12px]">/c/{item.slug}</p>
        {item.description && <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-secondary">{item.description}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-secondary sm:text-[12px]">
          <span className="inline-flex items-center gap-1" title="Jumlah halaman dibuka"><Eye size={13} strokeWidth={1.75} aria-hidden="true" /> {angka(item.views)} dilihat</span>
          <span className="inline-flex items-center gap-1" title="Jumlah foto yang diunduh"><Download size={13} strokeWidth={1.75} aria-hidden="true" /> {angka(item.usage)} dipakai</span>
        </div>
        <p className="mt-1 text-[11px] text-tertiary">Dibuat {tanggal(item.createdAt)}</p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3 sm:gap-2">
          <Link to={`/dashboard/twibbon/${item.id}`} title="Edit Twibbon" aria-label={`Edit ${item.title}`} className={`${ICON_BTN} ${TONE.primary}`}>
            <Pencil size={15} strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <a href={`/c/${item.slug}`} target="_blank" rel="noopener noreferrer" title="Lihat halaman Twibbon" aria-label={`Lihat halaman ${item.title}`} className={`${ICON_BTN} ${TONE.neutral}`}>
            <Eye size={15} strokeWidth={1.75} aria-hidden="true" />
          </a>
          <button type="button" onClick={copyLink} title={copied ? 'Link disalin' : 'Salin link'} aria-label={`Salin link ${item.title}`} className={`${ICON_BTN} ${TONE.neutral}`}>
            {copied ? <CheckCheck size={15} strokeWidth={1.75} aria-hidden="true" className="text-success" /> : <Copy size={15} strokeWidth={1.75} aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => onDelete(item)} title="Hapus Twibbon" aria-label={`Hapus ${item.title}`} className={`${ICON_BTN} ${TONE.danger} ml-auto`}>
            <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Daftar Twibbon milik akun. Satu akun bisa membuat banyak Twibbon.
export default function UserTwibbonPage() {
  const { addToast: toast } = useToast();
  const [list, setList] = useState(null);

  const load = useCallback(
    () =>
      fetchMyTwibbons()
        .then(setList)
        .catch(() => {
          toast({ type: 'error', title: 'Gagal memuat', message: 'Daftar Twibbon tidak bisa dimuat.' });
          setList((current) => current || []);
        }),
    [toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (item) => {
    if (!window.confirm(`Hapus Twibbon "${item.title}"? Link /c/${item.slug} tidak bisa dibuka lagi.`)) return;
    try {
      await deleteTwibbon(item.id);
      toast({ type: 'success', title: 'Twibbon dihapus' });
      load();
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menghapus', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    }
  };

  const all = list || [];
  const stats = [
    { label: 'Total Twibbon', value: angka(all.length), icon: ImagePlus },
    { label: 'Total dilihat', value: angka(all.reduce((sum, t) => sum + t.views, 0)), icon: Eye },
    { label: 'Total dipakai', value: angka(all.reduce((sum, t) => sum + t.usage, 0)), icon: Download, hint: 'Foto yang diunduh pengunjung' },
  ];

  return (
    <PanelLayout title="Twibbon">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-primary sm:text-[24px]">Twibbon</h1>
          <PanelCrumb />
          <p className="mt-1 max-w-2xl text-[13px] text-secondary sm:text-[14px]">
            Buat bingkai foto untuk acara atau kampanye, lalu bagikan link-nya. Satu akun bisa membuat banyak Twibbon.
          </p>
        </div>
        <Link to="/dashboard/twibbon/baru" className="self-start sm:self-auto">
          <Button variant="primary" icon={Plus} className="whitespace-nowrap">Buat Twibbon baru</Button>
        </Link>
      </div>

      {all.length > 0 && <StatCards items={stats} />}

      {!list ? (
        <p className="text-[13px] text-tertiary">Memuat...</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-card-muted text-secondary">
            <ImagePlus size={22} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="mt-3 text-[14px] font-medium text-primary">Belum ada Twibbon</p>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-secondary">
            Unggah gambar bingkai (PNG dengan area transparan), beri judul, lalu terbitkan. Pengunjung tinggal memasang fotonya.
          </p>
          <Link to="/dashboard/twibbon/baru" className="mt-4 inline-block">
            <Button variant="primary" icon={Plus}>Buat Twibbon baru</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {list.map((item) => (
            <TwibbonCard key={item.id} item={item} onDelete={remove} />
          ))}
        </div>
      )}
    </PanelLayout>
  );
}
