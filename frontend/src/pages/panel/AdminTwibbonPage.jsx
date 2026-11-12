import React, { useCallback, useEffect, useState } from 'react';
import { Copy, ExternalLink, Eye, Images, MousePointerClick, RefreshCw, Trash2, User, Users } from 'lucide-react';
import PanelLayout, { PanelCrumb } from '../../components/panel/PanelLayout';
import DetailModal, { DetailSection } from '../../components/panel/DetailModal';
import { Chip, WhatsappPill } from '../../components/panel/Chips';
import StatCards from '../../components/panel/table/StatCards';
import FramePreview from '../../components/twibbon/FramePreview';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import ActionMenu, { IconAction } from '../../components/panel/table/ActionMenu';
import TableToolbar from '../../components/panel/table/TableToolbar';
import TablePagination from '../../components/panel/table/TablePagination';
import { useTableControls, TH, TD, TD_NUM, TH_ACTION, TD_ACTION } from '../../components/panel/table/useTableControls';
import { adminFetchTwibbons, deleteTwibbon, getCampaignBySlug } from '../../services/twibbonApi';

// Super admin melihat semua Twibbon yang dibuat pengguna, dan bisa menghapus yang tidak pantas.
const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const waktu = (d) => (d ? new Date(d).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : null);
const angka = (n) => Number(n || 0).toLocaleString('id-ID');
const pageUrl = (slug) => `${window.location.origin}/c/${slug}`;

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'used', label: 'Sudah dipakai', test: (t) => t.usage > 0 },
  { id: 'unused', label: 'Belum dipakai', test: (t) => t.usage === 0 },
];
const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
const SORTS = [
  { id: 'newest', label: 'Terbaru', compare: newestFirst },
  { id: 'oldest', label: 'Terlama', compare: (a, b) => newestFirst(b, a) },
  { id: 'usage', label: 'Dipakai terbanyak', compare: (a, b) => b.usage - a.usage },
  { id: 'views', label: 'Dilihat terbanyak', compare: (a, b) => b.views - a.views },
  { id: 'title', label: 'Judul A–Z', compare: (a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'id') },
];
const searchText = (t) => [t.title, t.slug, t.description, t.owner?.name, t.owner?.email, t.owner?.whatsapp].filter(Boolean).join(' ');

// Detail satu Twibbon. Gambar bingkainya dimuat saat modal dibuka, supaya daftar tetap ringan.
function TwibbonDetailModal({ twibbon: t, onClose, onDelete }) {
  const [frame, setFrame] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    getCampaignBySlug(t.slug)
      .then((data) => alive && setFrame(data?.frameBase64 || ''))
      .catch(() => alive && setError('Gambar bingkai tidak bisa dimuat.'));
    return () => {
      alive = false;
    };
  }, [t.slug]);

  return (
    <DetailModal
      title={t.title}
      subtitle={`/c/${t.slug}`}
      icon={Images}
      summary={[
        { label: 'Dilihat', value: angka(t.views) },
        { label: 'Dipakai', value: angka(t.usage) },
      ]}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="danger" icon={Trash2} onClick={() => onDelete(t)} className="mr-auto">Hapus</Button>
          <a href={`/c/${t.slug}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="primary" icon={ExternalLink}>Buka halaman</Button>
          </a>
        </>
      }
    >
      <DetailSection title="Bingkai" icon={Images}>
        {error ? (
          <p className="text-[12px] text-danger sm:text-[13px]">{error}</p>
        ) : (
          <div className="mx-auto w-full max-w-[260px]">
            <FramePreview src={frame} alt={`Bingkai Twibbon ${t.title}`} />
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Twibbon"
        icon={Images}
        rows={[
          ['Judul', t.title],
          ['Alamat halaman', <span className="font-mono">/c/{t.slug}</span>],
          ['Dibuat', waktu(t.createdAt)],
          ['Deskripsi', t.description, { wide: true }],
        ]}
      />

      <DetailSection
        title="Pembuat"
        icon={User}
        rows={[
          ['Nama', t.owner?.name],
          ['Email', t.owner?.email && <a href={`mailto:${t.owner.email}`} className="underline hover:text-blue-500">{t.owner.email}</a>, { wide: true }],
          ['WhatsApp', t.owner?.whatsapp && <WhatsappPill number={t.owner.whatsapp} />],
          ['Jenis', t.owner?.legacy ? 'Dibuat sebelum ada akun' : 'Akun terdaftar'],
        ]}
      />
    </DetailModal>
  );
}

export default function AdminTwibbonPage() {
  const { addToast: toast } = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const table = useTableControls(list, { searchText, filters: FILTERS, sorts: SORTS });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await adminFetchTwibbons());
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

  const remove = async (t) => {
    if (!window.confirm(`Hapus Twibbon "${t.title}"?\n\nHalaman /c/${t.slug} tidak bisa dibuka lagi, dan penghapusan ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteTwibbon(t.id);
      toast({ type: 'success', title: 'Twibbon dihapus', message: t.title });
      setDetailId(null);
      load();
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menghapus', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    }
  };

  const all = list || [];
  const stats = [
    { label: 'Total Twibbon', value: angka(all.length), icon: Images },
    { label: 'Pembuat', value: angka(new Set(all.map((t) => t.owner?.email || t.owner?.name)).size), icon: Users },
    { label: 'Total dilihat', value: angka(all.reduce((sum, t) => sum + t.views, 0)), icon: Eye },
    { label: 'Total dipakai', value: angka(all.reduce((sum, t) => sum + t.usage, 0)), icon: MousePointerClick },
  ];

  const detail = all.find((t) => t.id === detailId) || null;

  const menuItems = (t) => [
    { label: 'Buka halaman', icon: ExternalLink, href: `/c/${t.slug}` },
    { label: 'Salin alamat halaman', icon: Copy, onClick: () => copy(pageUrl(t.slug)) },
    { label: 'Hapus', icon: Trash2, danger: true, onClick: () => remove(t) },
  ];

  return (
    <PanelLayout title="Data Twibbon">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-primary sm:text-[24px]">Data Twibbon</h1>
          <PanelCrumb />
          <p className="mt-1 text-[13px] text-secondary sm:text-[14px]">Semua Twibbon yang dibuat pengguna, beserta pembuat dan statistiknya.</p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading} className="self-start sm:self-auto">
          Muat ulang
        </Button>
      </div>

      <StatCards items={stats} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <TableToolbar table={table} filters={FILTERS} sorts={SORTS} searchPlaceholder="Cari judul, alamat, atau pembuat" />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-card-muted">
              <tr>
                <th className={TH}>No</th>
                <th className={`${TH} min-w-[190px]`}>Twibbon</th>
                <th className={`${TH} min-w-[190px]`}>Pembuat</th>
                <th className={TH}>Dilihat</th>
                <th className={TH}>Dipakai</th>
                <th className={TH}>Dibuat</th>
                <th className={TH_ACTION}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {table.pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[13px] text-tertiary">
                    {list === null || loading ? 'Memuat...' : list.length === 0 ? 'Belum ada Twibbon yang dibuat pengguna.' : 'Tidak ada Twibbon yang cocok.'}
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
                      title="Lihat detail Twibbon"
                      className="block max-w-[230px] truncate text-left font-medium text-primary transition-smooth hover:text-blue-500"
                    >
                      {t.title}
                    </button>
                    <div className="max-w-[230px] truncate font-mono text-[11px] text-tertiary">/c/{t.slug}</div>
                  </td>
                  <td className={TD}>
                    <span className="text-primary">{t.owner?.name || '-'}</span>
                    {t.owner?.email && <div className="text-[11px] text-tertiary [overflow-wrap:anywhere] sm:text-[12px]">{t.owner.email}</div>}
                    {t.owner?.whatsapp && <div className="mt-1.5"><WhatsappPill number={t.owner.whatsapp} /></div>}
                    {t.owner?.legacy && <div className="mt-1.5"><Chip tone="muted">Sebelum ada akun</Chip></div>}
                  </td>
                  <td className={`${TD} tabular-nums`}>{angka(t.views)}</td>
                  <td className={`${TD} tabular-nums`}>{angka(t.usage)}</td>
                  <td className={`${TD} whitespace-nowrap`}>{tanggal(t.createdAt)}</td>
                  <td className={TD_ACTION}>
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                      <IconAction icon={Eye} label={`Lihat detail Twibbon ${t.title}`} onClick={() => setDetailId(t.id)} />
                      <ActionMenu items={menuItems(t)} label={`Aksi untuk Twibbon ${t.title}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination table={table} label="Twibbon" />
      </div>

      {detail && <TwibbonDetailModal twibbon={detail} onClose={() => setDetailId(null)} onDelete={remove} />}
    </PanelLayout>
  );
}
