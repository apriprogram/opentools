import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PanelLayout, { PanelCrumb } from '../../components/panel/PanelLayout';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import LinktreeCard from '../../components/linktree/LinktreeCard';
import { slugify, SLUG_RE } from '../../components/linktree/constants';
import { fetchLinktrees, createLinktree, deleteLinktree } from '../../services/linktreeApi';

// Daftar Linktree milik akun. Satu akun bisa membuat banyak Linktree.
export default function UserLinktreePage() {
  const { addToast: toast } = useToast();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '' });
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetchLinktrees()
      .then(setList)
      .catch(() => toast({ type: 'error', title: 'Gagal memuat', message: 'Daftar Linktree tidak bisa dimuat.' }));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTitle = (value) => {
    setForm((f) => ({ ...f, title: value, slug: slugEdited ? f.slug : slugify(value) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!SLUG_RE.test(form.slug)) {
      toast({ type: 'error', title: 'Alamat tidak valid', message: 'Gunakan huruf kecil, angka, - dan _ (3 sampai 30 karakter).' });
      return;
    }
    setBusy(true);
    try {
      const tree = await createLinktree({ title: form.title.trim(), slug: form.slug });
      toast({ type: 'success', title: 'Linktree dibuat', message: 'Sekarang tambahkan tautan Anda.' });
      navigate(`/dashboard/linktree/${tree.id}`);
    } catch (err) {
      toast({ type: 'error', title: 'Gagal membuat', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (tree) => {
    if (!window.confirm(`Hapus Linktree "${tree.title}"? Semua tautan dan statistiknya ikut terhapus.`)) return;
    try {
      await deleteLinktree(tree.id);
      toast({ type: 'success', title: 'Linktree dihapus' });
      load();
    } catch {
      toast({ type: 'error', title: 'Gagal menghapus', message: 'Coba lagi beberapa saat.' });
    }
  };

  return (
    <PanelLayout title="Linktree">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-primary sm:text-[24px]">Linktree</h1>
          <PanelCrumb />
          <p className="mt-1 max-w-2xl text-[13px] text-secondary sm:text-[14px]">
            Buat halaman berisi semua tautan Anda. Satu akun bisa membuat banyak Linktree.
          </p>
        </div>
        <Button variant="primary" icon={Plus} className="self-start whitespace-nowrap sm:self-auto" onClick={() => setShowForm((v) => !v)}>
          Buat Linktree baru
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-6 max-w-xl rounded-2xl border border-border bg-card p-4 sm:mb-8 sm:p-5">
          <p className="text-[15px] font-semibold text-primary">Linktree baru</p>
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="lt-title" className="mb-1 block text-[13px] text-secondary">Nama Linktree</label>
              <input
                id="lt-title"
                type="text"
                required
                maxLength={120}
                value={form.title}
                onChange={(e) => onTitle(e.target.value)}
                placeholder="Contoh: Nama Anda atau Toko Saya"
                className="h-[42px] w-full rounded-md border border-border bg-card px-3 text-[14px] text-primary placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth"
              />
            </div>
            <div>
              <label htmlFor="lt-slug" className="mb-1 block text-[13px] text-secondary">Alamat halaman</label>
              <div className="flex items-center overflow-hidden rounded-md border border-border bg-card focus-within:border-border-focus">
                <span className="shrink-0 border-r border-border px-3 text-[13px] text-tertiary">/l/</span>
                <input
                  id="lt-slug"
                  type="text"
                  required
                  maxLength={30}
                  value={form.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }));
                  }}
                  className="h-[42px] w-full bg-transparent px-3 text-[14px] text-primary focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[12px] text-tertiary">Huruf kecil, angka, - dan _. Alamat harus unik.</p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
            <Button type="submit" variant="primary" disabled={busy || !form.title.trim()}>
              {busy ? 'Membuat...' : 'Buat dan edit'}
            </Button>
          </div>
        </form>
      )}

      {!list ? (
        <p className="text-[13px] text-tertiary">Memuat...</p>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-[14px] text-primary">Belum ada Linktree.</p>
          <p className="mt-1 text-[13px] text-secondary">Buat Linktree pertama Anda untuk mengumpulkan semua tautan.</p>
          <Button variant="primary" icon={Plus} className="mt-4" onClick={() => setShowForm(true)}>
            Buat Linktree baru
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 xl:grid-cols-2">
          {list.map((tree) => (
            <LinktreeCard key={tree.id} tree={tree} onDelete={remove} />
          ))}
        </div>
      )}
    </PanelLayout>
  );
}
