import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, Copy, ExternalLink, Eye, Globe, Link2, List, MousePointerClick, RefreshCw, User } from 'lucide-react';
import PanelLayout, { PanelCrumb } from '../../components/panel/PanelLayout';
import DetailModal, { DetailSection } from '../../components/panel/DetailModal';
import { PublishChip, WhatsappPill } from '../../components/panel/Chips';
import StatCards from '../../components/panel/table/StatCards';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import ActionMenu, { IconAction } from '../../components/panel/table/ActionMenu';
import TableToolbar from '../../components/panel/table/TableToolbar';
import TablePagination from '../../components/panel/table/TablePagination';
import { useTableControls, TH, TD, TD_NUM, TH_ACTION, TD_ACTION } from '../../components/panel/table/useTableControls';
import { adminFetchLinktree, adminFetchLinktrees } from '../../services/linktreeApi';

// Super admin melihat semua Linktree yang dibuat pengguna. Halaman ini hanya untuk melihat data.
const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const waktu = (d) => (d ? new Date(d).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : null);
const angka = (n) => Number(n || 0).toLocaleString('id-ID');
const pageUrl = (slug) => `${window.location.origin}/l/${slug}`;

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'published', label: 'Diterbitkan', test: (t) => t.published },
  { id: 'draft', label: 'Draf', test: (t) => !t.published },
];
const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
const SORTS = [
  { id: 'newest', label: 'Terbaru', compare: newestFirst },
  { id: 'oldest', label: 'Terlama', compare: (a, b) => newestFirst(b, a) },
  { id: 'views', label: 'Kunjungan terbanyak', compare: (a, b) => b.views - a.views },
  { id: 'clicks', label: 'Klik terbanyak', compare: (a, b) => b.clicks - a.clicks },
  { id: 'title', label: 'Judul A–Z', compare: (a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'id') },
];
const searchText = (t) => [t.title, t.slug, t.bio, t.owner?.name, t.owner?.email, t.owner?.whatsapp].filter(Boolean).join(' ');

const ITEM_TYPE = { link: 'Tautan', header: 'Judul bagian', social: 'Ikon sosial' };

// Detail satu Linktree: profil, pemilik, statistik, dan semua isinya.
function LinktreeDetailModal({ tree, onClose }) {
  const [full, setFull] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    adminFetchLinktree(tree.id)
      .then((data) => alive && setFull(data))
      .catch((err) => alive && setError(err?.response?.data?.message || 'Detail tidak bisa dimuat.'));
    return () => {
      alive = false;
    };
  }, [tree.id]);

  const t = full || tree;

  return (
    <DetailModal
      title={t.title}
      subtitle={`/l/${t.slug}`}
      icon={Link2}
      badges={<PublishChip published={t.published} />}
      summary={[
        { label: 'Tautan', value: angka(t.linkCount) },
        { label: 'Total item', value: angka(t.itemCount) },
        { label: 'Klik', value: angka(t.clicks) },
        { label: 'Kunjungan', value: angka(t.views) },
      ]}
      onClose={onClose}
      footer={
        t.published && (
          <a href={`/l/${t.slug}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="primary" icon={ExternalLink}>Buka halaman</Button>
          </a>
        )
      }
    >
      <DetailSection
        title="Linktree"
        icon={Globe}
        rows={[
          ['Judul', t.title],
          ['Alamat halaman', <span className="font-mono">/l/{t.slug}</span>],
          ['Foto profil', full ? (full.avatar ? <img src={full.avatar} alt="" className="h-12 w-12 rounded-full border border-border object-cover" /> : 'Tidak ada') : 'Memuat...'],
          ['Dibuat', waktu(t.createdAt)],
          ['Terakhir diubah', waktu(t.updatedAt)],
          ['Bio', t.bio, { wide: true }],
        ]}
      />

      <DetailSection
        title="Pemilik"
        icon={User}
        rows={[
          ['Nama', t.owner?.name],
          ['Email', t.owner?.email && <a href={`mailto:${t.owner.email}`} className="underline hover:text-blue-500">{t.owner.email}</a>, { wide: true }],
          ['WhatsApp', t.owner?.whatsapp && <WhatsappPill number={t.owner.whatsapp} />],
        ]}
      />

      <DetailSection title={`Isi halaman${full ? ` (${full.items.length})` : ''}`} icon={List}>
        {error ? (
          <p className="text-[13px] text-danger">{error}</p>
        ) : !full ? (
          <p className="text-[13px] text-tertiary">Memuat...</p>
        ) : full.items.length === 0 ? (
          <p className="text-[13px] text-tertiary">Belum ada isi.</p>
        ) : (
          <ol className="-my-1 divide-y divide-border">
            {full.items.map((item, i) => (
              <li key={item.id} className="flex items-start gap-3 py-2 text-[12px] sm:py-2.5 sm:text-[13px]">
                <span className="w-5 shrink-0 tabular-nums text-tertiary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-primary [overflow-wrap:anywhere]">
                    {item.title || item.platform || '-'}
                    {!item.enabled && <span className="ml-2 text-[11px] font-normal text-tertiary">(disembunyikan)</span>}
                  </p>
                  <p className="text-[11px] text-tertiary">{ITEM_TYPE[item.type] || item.type}</p>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-secondary underline [overflow-wrap:anywhere] hover:text-blue-500 sm:text-[12px]">
                      {item.url}
                    </a>
                  )}
                </div>
                {item.type !== 'header' && <span className="shrink-0 whitespace-nowrap tabular-nums text-secondary">{angka(item.clicks)} klik</span>}
              </li>
            ))}
          </ol>
        )}
      </DetailSection>
    </DetailModal>
  );
}

export default function AdminLinktreePage() {
  const { addToast: toast } = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const table = useTableControls(list, { searchText, filters: FILTERS, sorts: SORTS });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await adminFetchLinktrees());
    } catch (err) {
      toast({ type: 'error', title: 'Gagal memuat', message: err?.response?.data?.message || 'Tidak bisa menghubungi server.' });
      setList((current) => current || []);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ type: 'success', title: 'Disalin', message: text });
    } catch {
      toast({ type: 'error', title: 'Gagal menyalin', message: 'Salin alamatnya secara manual.' });
    }
  };

  // Ringkasan angka di atas tabel.
  const all = list || [];
  const stats = [
    { label: 'Total Linktree', value: angka(all.length), icon: Link2 },
    { label: 'Diterbitkan', value: angka(all.filter((t) => t.published).length), icon: Globe, hint: `${angka(all.filter((t) => !t.published).length)} masih draf` },
    { label: 'Total klik', value: angka(all.reduce((sum, t) => sum + t.clicks, 0)), icon: MousePointerClick },
    { label: 'Total kunjungan', value: angka(all.reduce((sum, t) => sum + t.views, 0)), icon: BarChart3 },
  ];

  const detailTree = (list || []).find((t) => t.id === detailId) || null;

  const menuItems = (t) => [
    t.published && { label: 'Buka halaman', icon: ExternalLink, href: `/l/${t.slug}` },
    { label: 'Salin alamat halaman', icon: Copy, onClick: () => copy(pageUrl(t.slug)) },
  ];

  return (
    <PanelLayout title="Data Linktree">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-primary sm:text-[24px]">Data Linktree</h1>
          <PanelCrumb />
          <p className="mt-1 text-[13px] text-secondary sm:text-[14px]">Semua Linktree yang dibuat pengguna, beserta pemilik dan statistiknya.</p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading} className="self-start sm:self-auto">
          Muat ulang
        </Button>
      </div>

      <StatCards items={stats} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <TableToolbar table={table} filters={FILTERS} sorts={SORTS} searchPlaceholder="Cari judul, alamat, atau pemilik" />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="bg-card-muted">
              <tr>
                <th className={TH}>No</th>
                <th className={`${TH} min-w-[180px]`}>Linktree</th>
                <th className={`${TH} min-w-[190px]`}>Pemilik</th>
                <th className={TH}>Status</th>
                <th className={TH}>Tautan</th>
                <th className={TH}>Klik</th>
                <th className={TH}>Kunjungan</th>
                <th className={TH}>Dibuat</th>
                <th className={TH_ACTION}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {table.pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-[13px] text-tertiary">
                    {list === null || loading
                      ? 'Memuat...'
                      : list.length === 0
                        ? 'Belum ada Linktree yang dibuat pengguna.'
                        : 'Tidak ada Linktree yang cocok.'}
                  </td>
                </tr>
              )}
              {table.pageRows.map((t, i) => (
                <tr key={t.id} className="group transition-smooth hover:bg-card-muted">
                  <td className={TD_NUM}>{table.start + i + 1}</td>
                  <td className={TD}>
                    <button
                      type="button"
                      onClick={() => setDetailId(t.id)}
                      title="Lihat detail Linktree"
                      className="max-w-[220px] truncate text-left font-medium text-primary transition-smooth hover:text-blue-500"
                    >
                      {t.title}
                    </button>
                    <div className="max-w-[220px] truncate font-mono text-[11px] text-tertiary">/l/{t.slug}</div>
                  </td>
                  <td className={TD}>
                    <span className="text-primary">{t.owner.name || '-'}</span>
                    <div className="text-[11px] text-tertiary [overflow-wrap:anywhere] sm:text-[12px]">{t.owner.email}</div>
                    {t.owner.whatsapp && <div className="mt-1.5"><WhatsappPill number={t.owner.whatsapp} /></div>}
                  </td>
                  <td className={TD}>
                    <PublishChip published={t.published} />
                  </td>
                  <td className={`${TD} tabular-nums`}>{angka(t.linkCount)}</td>
                  <td className={`${TD} tabular-nums`}>{angka(t.clicks)}</td>
                  <td className={`${TD} tabular-nums`}>{angka(t.views)}</td>
                  <td className={`${TD} whitespace-nowrap`}>
                    {tanggal(t.createdAt)}
                    <div className="text-[11px] text-tertiary">Diubah {tanggal(t.updatedAt)}</div>
                  </td>
                  <td className={TD_ACTION}>
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                      <IconAction icon={Eye} label={`Lihat detail Linktree ${t.title}`} onClick={() => setDetailId(t.id)} />
                      <ActionMenu items={menuItems(t)} label={`Aksi untuk Linktree ${t.title}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination table={table} label="Linktree" />
      </div>

      {detailTree && <LinktreeDetailModal tree={detailTree} onClose={() => setDetailId(null)} />}
    </PanelLayout>
  );
}
