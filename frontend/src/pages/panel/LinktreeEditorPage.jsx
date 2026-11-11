import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Save } from 'lucide-react';
import PanelLayout from '../../components/panel/PanelLayout';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import LinktreeView from '../../components/linktree/LinktreeView';
import LinksTab from '../../components/linktree/LinksTab';
import AppearanceTab from '../../components/linktree/AppearanceTab';
import SettingsTab from '../../components/linktree/SettingsTab';
import StatsTab from '../../components/linktree/StatsTab';
import { toDraft, draftPayload, isDirty } from '../../components/linktree/constants';
import { fetchLinktree, saveLinktree, deleteLinktree } from '../../services/linktreeApi';

const TABS = [
  { id: 'tautan', label: 'Tautan' },
  { id: 'tampilan', label: 'Tampilan' },
  { id: 'pengaturan', label: 'Pengaturan' },
  { id: 'statistik', label: 'Statistik' },
];

// Editor satu Linktree: ubah item dan tampilan, lalu simpan. Pratinjau di kanan selalu mengikuti perubahan.
export default function LinktreeEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast: toast } = useToast();
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState('tautan');
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

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

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    if (!draft || !dirty) return;
    setSaving(true);
    try {
      const body = draftPayload(draft);
      // Foto hanya dikirim bila berubah, supaya permintaan simpan tetap ringan.
      if (draft.avatar !== (saved.avatar || null)) body.avatar = draft.avatar;
      const next = await saveLinktree(saved.id, body);
      setSaved(next);
      setDraft(toDraft(next));
      toast({ type: 'success', title: 'Tersimpan', message: 'Perubahan Linktree sudah disimpan.' });
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menyimpan', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setSaving(false);
    }
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

  return (
    <PanelLayout title="Linktree">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <Link to="/dashboard/linktree" className="mb-2 inline-flex items-center gap-1.5 text-[13px] text-secondary hover:text-primary">
            <ArrowLeft size={14} /> Semua Linktree
          </Link>
          <h1 className="truncate text-[20px] font-semibold text-primary sm:text-[24px]">{saved.title}</h1>
          <p className="mt-1 text-[12px] text-secondary sm:text-[13px]">/l/{saved.slug} · {saved.published ? 'Diterbitkan' : 'Draf'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {saved.published && (
            <a href={`/l/${saved.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" icon={ExternalLink}>Lihat halaman</Button>
            </a>
          )}
          <Button variant="primary" icon={Save} disabled={!dirty || saving} onClick={save}>
            {saving ? 'Menyimpan...' : dirty ? 'Simpan perubahan' : 'Tersimpan'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <div className="mb-5 inline-flex flex-wrap gap-1 rounded-full border border-border bg-card p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`h-[32px] rounded-full px-4 text-[13px] font-medium transition-smooth ${
                  tab === t.id ? 'bg-accent-black text-white dark:bg-white dark:text-black' : 'text-secondary hover:text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

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
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <p className="mb-3 text-[13px] text-secondary">Pratinjau</p>
            <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[36px] border-[10px] border-zinc-900 bg-black shadow-xl">
              <div className="h-[580px] overflow-y-auto">
                <LinktreeView tree={draft} preview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
