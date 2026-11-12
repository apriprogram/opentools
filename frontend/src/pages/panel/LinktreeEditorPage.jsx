import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, CheckCheck, Copy, ExternalLink, EyeOff, Link2, Palette, RotateCcw, Rocket, Save, Settings2, Smartphone } from 'lucide-react';
import PanelLayout, { PanelCrumb } from '../../components/panel/PanelLayout';
import DetailModal from '../../components/panel/DetailModal';
import { PublishChip } from '../../components/panel/Chips';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import DevicePreview from '../../components/linktree/DevicePreview';
import LinksTab from '../../components/linktree/LinksTab';
import AppearanceTab from '../../components/linktree/AppearanceTab';
import SettingsTab from '../../components/linktree/SettingsTab';
import StatsTab from '../../components/linktree/StatsTab';
import { toDraft, draftPayload, isDirty } from '../../components/linktree/constants';
import { fetchLinktree, saveLinktree, deleteLinktree } from '../../services/linktreeApi';

const TABS = [
  { id: 'tautan', label: 'Tautan', icon: Link2 },
  { id: 'tampilan', label: 'Tampilan', icon: Palette },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings2 },
  { id: 'statistik', label: 'Statistik', icon: BarChart3 },
];

const ICON_BTN =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-secondary transition-smooth hover:border-blue-500 hover:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-9 sm:w-9';

// Tombol berlabel di kepala halaman. Di ponsel hanya ikon supaya muat; di layar lebih lebar ikon dan teks.
const LABEL_BTN =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card text-[12px] font-medium text-primary transition-smooth hover:border-blue-500 hover:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-9 sm:w-auto sm:px-3 sm:text-[13px]';

// Editor satu Linktree: ubah isi dan tampilan, lalu simpan. Pratinjau selalu mengikuti perubahan.
export default function LinktreeEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast: toast } = useToast();
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState('tautan');
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLinktree(id)
      .then((tree) => {
        setSaved(tree);
        setDraft(toDraft(tree));
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const dirty = Boolean(draft && saved) && isDirty(draft, saved);

  // Peringatan saat menutup tab jika ada perubahan yang belum disimpan.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  // overrides: perubahan yang langsung ikut disimpan (dipakai tombol Terbitkan sekarang).
  const save = async (overrides = null) => {
    if (!draft || (!dirty && !overrides)) return;
    setSaving(true);
    try {
      const body = draftPayload(overrides ? { ...draft, ...overrides } : draft);
      // Foto hanya dikirim bila berubah, supaya permintaan simpan tetap ringan.
      if (draft.avatar !== (saved.avatar || null)) body.avatar = draft.avatar;
      const next = await saveLinktree(saved.id, body);
      setSaved(next);
      setDraft(toDraft(next));
      if (next.published && !saved.published) {
        toast({ type: 'success', title: 'Linktree diterbitkan', message: `Halaman sudah bisa dibuka di ${window.location.origin}/l/${next.slug}` });
      } else {
        toast({ type: 'success', title: 'Tersimpan', message: 'Perubahan Linktree sudah disimpan.' });
      }
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menyimpan', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (!window.confirm('Batalkan semua perubahan yang belum disimpan?')) return;
    setDraft(toDraft(saved));
  };

  const remove = async () => {
    if (!window.confirm(`Hapus Linktree "${saved.title}"? Semua tautan dan statistiknya ikut terhapus.`)) return;
    try {
      await deleteLinktree(saved.id);
      toast({ type: 'success', title: 'Linktree dihapus' });
      navigate('/dashboard/linktree');
    } catch {
      toast({ type: 'error', title: 'Gagal menghapus', message: 'Coba lagi beberapa saat.' });
    }
  };

  if (notFound) {
    return (
      <PanelLayout title="Linktree">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-[14px] text-primary">Linktree ini tidak ditemukan di akun Anda.</p>
          <Link to="/dashboard/linktree" className="mt-3 inline-block text-[13px] underline">Kembali ke daftar Linktree</Link>
        </div>
      </PanelLayout>
    );
  }

  if (!draft || !saved) {
    return (
      <PanelLayout title="Linktree">
        <p className="text-[13px] text-tertiary">Memuat...</p>
      </PanelLayout>
    );
  }

  const publicUrl = `${window.location.origin}/l/${saved.slug}`;
  // Tinggi area pratinjau mengikuti tinggi layar, supaya bingkai perangkat tidak terpotong.
  const previewHeight = Math.max(360, Math.min(640, window.innerHeight - 190));
  const modalHeight = Math.max(320, Math.round(window.innerHeight * 0.92) - 250);
  // Draf belum publik, jadi dibuka sebagai pratinjau khusus pemilik.
  const viewHref = saved.published ? `/l/${saved.slug}` : `/l/${saved.slug}?pratinjau=${encodeURIComponent(saved.id)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        type: 'success',
        title: 'Link disalin',
        message: saved.published ? publicUrl : `${publicUrl} (baru bisa dibuka orang lain setelah diterbitkan)`,
      });
    } catch {
      toast({ type: 'error', title: 'Gagal menyalin', message: `Salin manual: ${publicUrl}` });
    }
  };

  return (
    <PanelLayout title="Linktree">
      <Link to="/dashboard/linktree" className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-secondary transition-smooth hover:text-primary sm:text-[13px]">
        <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" /> Semua Linktree
      </Link>

      {/* Kepala halaman: identitas Linktree, tombol lihat dan salin, lalu tab. */}
      <div className="mb-3 rounded-2xl border border-border bg-card sm:mb-4">
        <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
          {draft.avatar ? (
            <img src={draft.avatar} alt="" className="h-11 w-11 shrink-0 rounded-full border border-border object-cover sm:h-12 sm:w-12" />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card-muted text-[16px] font-semibold text-secondary sm:h-12 sm:w-12">
              {(draft.title || '?').trim().slice(0, 1).toUpperCase() || '?'}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="min-w-0 truncate text-[17px] font-semibold text-primary sm:text-[20px]">{draft.title || 'Tanpa nama'}</h1>
              <PublishChip published={saved.published} />
            </div>
            <PanelCrumb />
            <p className="truncate font-mono text-[11px] text-tertiary sm:text-[12px]">/l/{saved.slug}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => setPreviewOpen(true)} title="Pratinjau" aria-label="Buka pratinjau" className={`${ICON_BTN} lg:hidden`}>
              <Smartphone size={15} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <a
              href={viewHref}
              target="_blank"
              rel="noopener noreferrer"
              title={saved.published ? 'Buka halaman Linktree di tab baru' : 'Buka pratinjau draf (hanya kamu yang bisa melihat)'}
              aria-label={saved.published ? 'Buka halaman Linktree' : 'Buka pratinjau draf'}
              className={LABEL_BTN}
            >
              <ExternalLink size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
              <span className="max-sm:hidden">{saved.published ? 'Buka' : 'Buka pratinjau'}</span>
            </a>
            <button type="button" onClick={copyLink} title={copied ? 'Link disalin' : 'Salin link halaman'} aria-label="Salin link Linktree" className={LABEL_BTN}>
              {copied ? (
                <CheckCheck size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-success" />
              ) : (
                <Copy size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
              )}
              <span className="max-sm:hidden">{copied ? 'Disalin' : 'Salin link'}</span>
            </button>
            <Button size="sm" variant="primary" icon={Save} disabled={!dirty || saving} onClick={() => save()} className="max-sm:hidden">
              {saving ? 'Menyimpan...' : dirty ? 'Simpan' : 'Tersimpan'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-border px-2.5 py-2 [scrollbar-width:none] sm:px-4 sm:py-3 [&::-webkit-scrollbar]:hidden">
          <div role="tablist" aria-label="Bagian editor" className="inline-flex gap-0.5 rounded-md bg-card-muted p-0.5 sm:gap-1 sm:rounded-lg sm:p-1">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 text-[12px] font-medium transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-9 sm:rounded-md sm:px-3.5 sm:text-[13px] ${
                    active ? 'bg-card text-primary shadow-tab dark:bg-zinc-700 dark:shadow-none' : 'text-secondary hover:text-primary'
                  }`}
                >
                  <t.icon size={14} strokeWidth={1.75} aria-hidden="true" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pita draf: tampil terus selama Linktree belum diterbitkan, supaya tidak lupa menerbitkan. */}
      {!saved.published && (
        <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-3 sm:mb-4 sm:flex-row sm:items-center sm:p-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <EyeOff size={17} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-primary sm:text-[14px]">Linktree ini belum diterbitkan</p>
              <p className="text-[11px] text-secondary sm:text-[12px]">
                Halaman masih draf, jadi orang lain belum bisa membukanya. Terbitkan kalau isinya sudah siap.
              </p>
            </div>
          </div>
          <Button size="sm" variant="primary" icon={Rocket} disabled={saving} onClick={() => save({ published: true })} className="shrink-0 self-start whitespace-nowrap sm:self-auto">
            {saving ? 'Menerbitkan...' : dirty ? 'Simpan dan terbitkan' : 'Terbitkan sekarang'}
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="min-w-0 lg:col-span-7">
          {tab === 'tautan' && <LinksTab items={draft.items} onChange={(items) => update({ items })} />}
          {tab === 'tampilan' && <AppearanceTab theme={draft.theme} onChange={(theme) => update({ theme })} />}
          {tab === 'pengaturan' && (
            <SettingsTab
              draft={draft}
              update={update}
              publicSlug={saved.slug}
              published={saved.published}
              onDelete={remove}
            />
          )}
          {tab === 'statistik' && <StatsTab tree={saved} />}

          {/* Baris simpan: menempel di bawah layar selama ada perubahan yang belum disimpan. */}
          {dirty && (
            <div className="sticky bottom-3 z-20 mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 pl-3 shadow-menu dark:shadow-menu-dark sm:gap-3 sm:pl-4">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <p className="min-w-0 flex-1 text-[12px] text-primary sm:text-[13px]">Ada perubahan yang belum disimpan</p>
              <Button size="sm" variant="ghost" icon={RotateCcw} onClick={discard} disabled={saving}>Batalkan</Button>
              <Button size="sm" variant="primary" icon={Save} onClick={() => save()} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          )}
        </div>

        <div className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-20">
            <p className="mb-2 text-[12px] font-medium text-secondary">Pratinjau langsung</p>
            <DevicePreview tree={draft} height={previewHeight} onExpand={() => setPreviewOpen(true)} />
          </div>
        </div>
      </div>

      {previewOpen && (
        <DetailModal wide title="Pratinjau" subtitle="Pilih ukuran ponsel, tablet, atau desktop untuk melihat tampilannya." icon={Smartphone} onClose={() => setPreviewOpen(false)}>
          <DevicePreview tree={draft} height={modalHeight} />
        </DetailModal>
      )}
    </PanelLayout>
  );
}
