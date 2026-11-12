import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Crown, ImagePlus, Link2, LogIn, QrCode, RefreshCw, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import PanelLayout, { PanelCrumb } from '../../components/panel/PanelLayout';
import { Chip, WhatsappPill } from '../../components/panel/Chips';
import DetailModal from '../../components/panel/DetailModal';
import { IconAction } from '../../components/panel/table/ActionMenu';
import StatCards from '../../components/panel/table/StatCards';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import TableToolbar from '../../components/panel/table/TableToolbar';
import TablePagination from '../../components/panel/table/TablePagination';
import { useTableControls, TH, TD, TD_NUM, TH_ACTION, TD_ACTION, THEAD, TR } from '../../components/panel/table/useTableControls';
import { useAuth } from '../../contexts/AuthContext';
import { adminDeleteUser, adminFetchUsers, adminImpersonateUser } from '../../services/authApi';

// Super admin melihat semua akun, dan bisa masuk ke dashboard seorang pengguna tanpa password pengguna itu
// (misalnya untuk membantu pengguna yang kesulitan). Sesi itu terpisah, berlaku 2 jam, dan tercatat di server.
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
const angka = (n) => Number(n || 0).toLocaleString('id-ID');
const isAdmin = (u) => u.role === 'superadmin';

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'premium', label: 'Pernah beli Premium', test: (u) => !isAdmin(u) && u.paidCount > 0 },
  { id: 'free', label: 'Belum beli', test: (u) => !isAdmin(u) && u.paidCount === 0 },
  { id: 'admin', label: 'Super admin', test: isAdmin },
];
const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
const SORTS = [
  { id: 'newest', label: 'Terbaru', compare: newestFirst },
  { id: 'oldest', label: 'Terlama', compare: (a, b) => newestFirst(b, a) },
  { id: 'name', label: 'Nama A–Z', compare: (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'id') },
  { id: 'orders', label: 'Pesanan terbanyak', compare: (a, b) => b.orderCount - a.orderCount },
];
const searchText = (u) => [u.name, u.email, u.username, u.whatsapp].filter(Boolean).join(' ');

// Jumlah satu jenis data milik pengguna, dengan ikon.
function Count({ icon: Icon, label, value }) {
  return (
    <span title={`${angka(value)} ${label}`} className={`inline-flex items-center gap-1 tabular-nums ${value ? 'text-primary' : 'text-tertiary'}`}>
      <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
      {angka(value)}
      <span className="sr-only"> {label}</span>
    </span>
  );
}

// Konfirmasi hapus akun. Menghapus akun tidak bisa dibatalkan, jadi isinya dirinci dan admin harus mengetik HAPUS.
function DeleteUserModal({ user, onClose, onDeleted }) {
  const { addToast: toast } = useToast();
  const [deleteOrders, setDeleteOrders] = useState(true);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const label = user.name || user.email || `pengguna #${user.id}`;
  const ready = typed.trim().toUpperCase() === 'HAPUS';

  const remove = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    try {
      const result = await adminDeleteUser(user.id, { deleteOrders });
      const r = result.removed || {};
      toast({
        type: 'success',
        title: 'Akun dihapus',
        message: `${label}: ${angka(r.qrs)} QR, ${angka(r.linktrees)} Linktree, ${angka(r.twibbons)} Twibbon, dan ${angka(r.orders)} pesanan ikut terhapus.`,
      });
      onDeleted();
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menghapus akun', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
      setBusy(false);
    }
  };

  const rows = [
    ['QR code dan lisensinya', user.qrCount],
    ['Linktree beserta isinya', user.linktreeCount],
    ['Twibbon', user.twibbonCount],
  ];

  return (
    <DetailModal
      title="Hapus akun"
      subtitle={user.email || label}
      icon={Trash2}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="secondary" onClick={onClose} disabled={busy}>Batal</Button>
          <Button size="sm" variant="danger" icon={Trash2} type="submit" form="delete-user-form" disabled={!ready || busy}>
            {busy ? 'Menghapus...' : 'Hapus akun'}
          </Button>
        </>
      }
    >
      <form id="delete-user-form" onSubmit={remove} className="space-y-4">
        <p className="flex items-start gap-2 rounded-md bg-red-500/10 px-3 py-2.5 text-[12px] leading-relaxed text-red-700 dark:text-red-400 sm:text-[13px]">
          <AlertTriangle size={15} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            Akun <strong className="font-semibold">{label}</strong> dan semua datanya dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            QR yang sudah dicetak akan menampilkan halaman "QR tidak ditemukan" saat dipindai.
          </span>
        </p>

        <div>
          <p className="mb-1.5 text-[12px] font-medium text-secondary sm:text-[13px]">Yang ikut terhapus</p>
          <ul className="divide-y divide-border rounded-md border border-border text-[12px] sm:text-[13px]">
            {rows.map(([name, count]) => (
              <li key={name} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-primary">{name}</span>
                <span className="tabular-nums text-secondary">{angka(count)}</span>
              </li>
            ))}
          </ul>
        </div>

        <label className="flex cursor-pointer select-none items-start gap-2.5 rounded-md border border-border px-3 py-2.5 text-[12px] text-primary sm:text-[13px]">
          <input type="checkbox" checked={deleteOrders} onChange={(e) => setDeleteOrders(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-black" />
          <span>
            Hapus juga riwayat pesanan ({angka(user.orderCount)} pesanan, {angka(user.paidCount)} lunas)
            <span className="mt-0.5 block text-[11px] leading-relaxed text-tertiary sm:text-[12px]">
              Termasuk bukti bayar dan nota. Pesanan lunas yang dihapus hilang dari angka pemasukan di Statistik. Hilangkan centang untuk menyimpannya sebagai catatan.
            </span>
          </span>
        </label>

        <div>
          <label htmlFor="delete-user-confirm" className="mb-1.5 block text-[12px] font-medium text-secondary sm:text-[13px]">
            Ketik HAPUS untuk melanjutkan
          </label>
          <input
            id="delete-user-confirm"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="ios-no-zoom h-10 w-full rounded-md border border-border bg-card px-3 text-[13px] text-primary transition-smooth hover:border-border-hover focus:border-border-focus focus:outline-none sm:max-w-[220px]"
          />
        </div>
      </form>
    </DetailModal>
  );
}

export default function AdminUsersPage() {
  const { addToast: toast } = useToast();
  const { impersonate } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const table = useTableControls(list, { searchText, filters: FILTERS, sorts: SORTS });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await adminFetchUsers());
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

  // Masuk ke dashboard pengguna. Sesi admin disimpan dulu, lalu dipulihkan lewat tombol "Kembali ke admin".
  const enter = async (u) => {
    const label = u.name || u.email || `pengguna #${u.id}`;
    if (!window.confirm(`Masuk sebagai ${label}?\n\nKamu akan melihat dashboard akun ini, dan perubahan yang kamu buat tersimpan di akun tersebut. Sesi ini berlaku 2 jam.`)) {
      return;
    }
    setBusyId(u.id);
    try {
      const session = await adminImpersonateUser(u.id);
      impersonate(session);
      navigate('/dashboard/qr');
    } catch (err) {
      toast({ type: 'error', title: 'Gagal masuk sebagai pengguna', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
      setBusyId(null);
    }
  };

  const all = list || [];
  const members = all.filter((u) => !isAdmin(u));
  const stats = [
    { label: 'Total pengguna', value: angka(members.length), icon: Users, hint: `${angka(all.length - members.length)} super admin` },
    { label: 'Baru 7 hari terakhir', value: angka(members.filter((u) => Date.now() - new Date(u.createdAt).getTime() < WEEK_MS).length), icon: UserPlus },
    { label: 'Pernah beli Premium', value: angka(members.filter((u) => u.paidCount > 0).length), icon: Crown },
    { label: 'Total QR tersimpan', value: angka(all.reduce((sum, u) => sum + u.qrCount, 0)), icon: QrCode },
  ];

  return (
    <PanelLayout title="Users">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-primary sm:text-[24px]">Users</h1>
          <PanelCrumb />
          <p className="mt-1 max-w-[640px] text-[13px] text-secondary sm:text-[14px]">
            Semua akun yang terdaftar. Tekan Masuk untuk membuka dashboard seorang pengguna tanpa password-nya, atau hapus akun beserta datanya.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading} className="self-start sm:self-auto">
          Muat ulang
        </Button>
      </div>

      <StatCards items={stats} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <TableToolbar table={table} filters={FILTERS} sorts={SORTS} searchPlaceholder="Cari nama, email, atau WhatsApp" />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className={THEAD}>
              <tr>
                <th className={TH}>No</th>
                <th className={`${TH} min-w-[210px]`}>Pengguna</th>
                <th className={TH}>WhatsApp</th>
                <th className={TH}>Isi akun</th>
                <th className={TH}>Pesanan</th>
                <th className={TH}>Bergabung</th>
                <th className={TH_ACTION}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {table.pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[13px] text-tertiary">
                    {list === null || loading ? 'Memuat...' : list.length === 0 ? 'Belum ada akun terdaftar.' : 'Tidak ada pengguna yang cocok.'}
                  </td>
                </tr>
              )}
              {table.pageRows.map((u, i) => (
                <tr key={u.id} className={TR}>
                  <td className={TD_NUM}>{table.start + i + 1}</td>
                  <td className={TD}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-black text-[12px] font-semibold text-white dark:bg-white dark:text-black">
                        {(u.name || u.username || u.email || '?').slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <span className="block max-w-[220px] truncate font-medium text-primary">{u.name || u.username || '-'}</span>
                        <span className="block text-[11px] text-tertiary [overflow-wrap:anywhere] sm:text-[12px]">
                          {u.email || (u.username ? `@${u.username}` : 'Tanpa email')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={TD}>{u.whatsapp ? <WhatsappPill number={u.whatsapp} /> : <span className="text-tertiary">-</span>}</td>
                  <td className={TD}>
                    <div className="flex items-center gap-3 text-[12px] sm:text-[13px]">
                      <Count icon={QrCode} label="QR" value={u.qrCount} />
                      <Count icon={Link2} label="Linktree" value={u.linktreeCount} />
                      <Count icon={ImagePlus} label="Twibbon" value={u.twibbonCount} />
                    </div>
                  </td>
                  <td className={TD}>
                    {u.orderCount ? (
                      <>
                        <span className="tabular-nums text-primary">{angka(u.orderCount)} pesanan</span>
                        <div className="text-[11px] text-tertiary sm:text-[12px]">{angka(u.paidCount)} lunas</div>
                      </>
                    ) : (
                      <span className="text-tertiary">-</span>
                    )}
                  </td>
                  <td className={`${TD} whitespace-nowrap`}>
                    {tanggal(u.createdAt)}
                    <div className="text-[11px] text-tertiary">{u.lastLoginAt ? `Masuk terakhir ${tanggal(u.lastLoginAt)}` : 'Belum pernah masuk'}</div>
                  </td>
                  <td className={TD_ACTION}>
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                      {isAdmin(u) ? (
                        <Chip tone="info" icon={ShieldCheck}>Super admin</Chip>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={LogIn}
                          onClick={() => enter(u)}
                          disabled={busyId !== null}
                          title={`Masuk ke dashboard ${u.name || u.email}`}
                        >
                          {busyId === u.id ? 'Membuka...' : 'Masuk'}
                        </Button>
                      )}
                      {!isAdmin(u) && (
                        <IconAction icon={Trash2} label={`Hapus akun ${u.name || u.email}`} onClick={() => setDeleteId(u.id)} disabled={busyId !== null} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination table={table} label="pengguna" />
      </div>

      {deleteId !== null && all.find((u) => u.id === deleteId) && (
        <DeleteUserModal
          user={all.find((u) => u.id === deleteId)}
          onClose={() => setDeleteId(null)}
          onDeleted={() => {
            setDeleteId(null);
            load();
          }}
        />
      )}
    </PanelLayout>
  );
}
