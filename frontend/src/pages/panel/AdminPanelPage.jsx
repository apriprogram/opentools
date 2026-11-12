import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, RefreshCw, Copy, Eye, Power, PowerOff, Trash2, ClipboardList, Clock, CheckCircle2, Wallet } from 'lucide-react';
import PanelLayout, { PanelCrumb } from '../../components/panel/PanelLayout';
import ProofModal from '../../components/panel/ProofModal';
import OrderDetailModal from '../../components/panel/OrderDetailModal';
import { LicenseChip, OrderStatusChip, PlanChip, ProofChip, WhatsappPill } from '../../components/panel/Chips';
import StatCards from '../../components/panel/table/StatCards';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import ActionMenu, { IconAction } from '../../components/panel/table/ActionMenu';
import TableToolbar from '../../components/panel/table/TableToolbar';
import TablePagination from '../../components/panel/table/TablePagination';
import { useTableControls, TH, TD, TD_NUM, TH_ACTION, TD_ACTION, THEAD, TR } from '../../components/panel/table/useTableControls';
import {
  adminFetchQrOrders,
  adminConfirmQrOrder,
  adminCancelQrOrder,
  adminSetQrLicense,
  adminDeleteQrOrder,
  adminFetchQrProof,
  adminFetchQrNota,
  adminFetchQrNotaPdf,
} from '../../services/qrApi';

// Super admin hanya mengelola konfirmasi pemesanan: lihat bukti, nota, konfirmasi, atau batal.
const rupiah = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;

// Tombol Nonaktifkan/Aktifkan di luar menu titik tiga. Di ponsel dibuat lebih kecil.
const TOGGLE_BTN = 'whitespace-nowrap max-sm:h-7 max-sm:gap-1 max-sm:rounded-sm max-sm:px-2 max-sm:text-[11px]';

// Filter, urutan, dan teks pencarian tabel. Didefinisikan di luar komponen supaya stabil.
const FILTERS = [
  { id: 'pending', label: 'Menunggu', test: (o) => o.status === 'pending' },
  { id: 'review', label: 'Bukti perlu dicek', test: (o) => o.status === 'pending' && o.verifyStatus === 'review' },
  { id: 'paid', label: 'Lunas', test: (o) => o.status === 'paid' },
  { id: 'cancelled', label: 'Batal', test: (o) => o.status === 'cancelled' },
  { id: 'all', label: 'Semua' },
];
const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
const SORTS = [
  { id: 'newest', label: 'Terbaru', compare: newestFirst },
  { id: 'oldest', label: 'Terlama', compare: (a, b) => newestFirst(b, a) },
  { id: 'amount_desc', label: 'Nominal terbesar', compare: (a, b) => b.amount - a.amount },
  { id: 'amount_asc', label: 'Nominal terkecil', compare: (a, b) => a.amount - b.amount },
  { id: 'name', label: 'Nama A–Z', compare: (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'id') },
];
const searchText = (o) =>
  [o.code, o.name, o.email, o.whatsapp, o.notaNumber, o.licenseKey, o.planLabel].filter(Boolean).join(' ');

export default function AdminPanelPage() {
  const { addToast: toast } = useToast();
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [proofCode, setProofCode] = useState(null);
  const [detailCode, setDetailCode] = useState(null);

  const table = useTableControls(orders, { searchText, filters: FILTERS, sorts: SORTS, initialFilter: 'pending' });

  // Semua pesanan dimuat sekali. Filter, urutan, dan halaman dikerjakan di browser.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetchQrOrders('all');
      setOrders(res.orders || []);
    } catch (err) {
      toast({ type: 'error', title: 'Gagal memuat', message: err?.response?.data?.message || 'Tidak bisa menghubungi server.' });
      setOrders((list) => list || []);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const withBusy = async (code, action) => {
    setBusy(code);
    try {
      await action();
    } catch (err) {
      toast({ type: 'error', title: 'Gagal', message: err?.response?.data?.message || 'Permintaan gagal.' });
    } finally {
      setBusy('');
    }
  };

  const confirm = (code) =>
    withBusy(code, async () => {
      const res = await adminConfirmQrOrder(code);
      toast({ type: 'success', title: 'Pesanan dikonfirmasi', message: `Kode lisensi: ${res.order.licenseKey}` });
      load();
    });

  const cancel = (code) => {
    if (!window.confirm(`Batalkan pesanan ${code}?`)) return;
    withBusy(code, async () => {
      await adminCancelQrOrder(code);
      toast({ type: 'info', title: 'Pesanan dibatalkan', message: code });
      load();
    });
  };

  // Nonaktifkan atau aktifkan lisensi (QR dan link ikut nonaktif).
  const toggleLicense = (code, active) => {
    const verb = active ? 'Aktifkan' : 'Nonaktifkan';
    if (!window.confirm(`${verb} lisensi pesanan ${code}?`)) return;
    withBusy(code, async () => {
      await adminSetQrLicense(code, active);
      toast({ type: 'success', title: active ? 'Lisensi diaktifkan' : 'Lisensi dinonaktifkan', message: code });
      load();
    });
  };

  // Hapus pesanan permanen, termasuk bukti dan lisensi. Akun pembeli ikut kehilangan datanya.
  const removeOrder = (code) => {
    if (!window.confirm(`Hapus pesanan ${code} secara permanen? Bukti dan lisensinya ikut dihapus, dan data di akun pembeli juga hilang.`)) return;
    withBusy(code, async () => {
      await adminDeleteQrOrder(code);
      toast({ type: 'info', title: 'Pesanan dihapus', message: code });
      load();
    });
  };

  const viewNota = (code) => withBusy(code, async () => openBlob(await adminFetchQrNota(code)));

  const downloadNotaPdf = (code) =>
    withBusy(code, async () => {
      const url = URL.createObjectURL(await adminFetchQrNotaPdf(code));
      const link = document.createElement('a');
      link.href = url;
      link.download = `nota-${code}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    });

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ type: 'success', title: 'Disalin', message: text });
    } catch {
      toast({ type: 'error', title: 'Gagal menyalin', message: 'Salin kodenya secara manual dari kolom Lisensi.' });
    }
  };

  const proofOrder = (orders || []).find((o) => o.code === proofCode) || null;
  const proofDetailRows = proofOrder && [
    ['Diunggah', proofOrder.proofUploadedAt ? new Date(proofOrder.proofUploadedAt).toLocaleString('id-ID') : '-'],
    ['Nominal terbaca', proofOrder.verifyAmount != null ? rupiah(proofOrder.verifyAmount) : '-'],
    ['Nominal pesanan', rupiah(proofOrder.amount)],
    ['Status bukti', <ProofChip verifyStatus={proofOrder.verifyStatus} hasProof={proofOrder.hasProof} />],
    ['Catatan', proofOrder.verifyNote || '-'],
  ];

  // Ringkasan angka di atas tabel.
  const all = orders || [];
  const paidOrders = all.filter((o) => o.status === 'paid');
  const pendingOrders = all.filter((o) => o.status === 'pending');
  const needReview = pendingOrders.filter((o) => o.verifyStatus === 'review').length;
  const stats = [
    { label: 'Total pesanan', value: all.length.toLocaleString('id-ID'), icon: ClipboardList },
    { label: 'Menunggu', value: pendingOrders.length.toLocaleString('id-ID'), icon: Clock, hint: needReview ? `${needReview} bukti perlu dicek` : 'Tidak ada bukti yang perlu dicek' },
    { label: 'Lunas', value: paidOrders.length.toLocaleString('id-ID'), icon: CheckCircle2 },
    { label: 'Pemasukan', value: rupiah(paidOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0)), icon: Wallet, hint: 'Dari pesanan lunas' },
  ];

  const detailOrder = (orders || []).find((o) => o.code === detailCode) || null;

  // Aksi baris ada di menu titik tiga. Lihat detail dan Nonaktifkan/Aktifkan tetap tampil di luar menu.
  // Tombol nota (lihat dan unduh PDF) ada di modal detail.
  const menuItems = (o) => [
    o.status === 'pending' && { label: 'Konfirmasi lunas', icon: Check, onClick: () => confirm(o.code) },
    o.status === 'pending' && { label: 'Batalkan pesanan', icon: X, onClick: () => cancel(o.code) },
    o.hasProof && { label: 'Lihat bukti', icon: Eye, onClick: () => setProofCode(o.code) },
    o.licenseKey && { label: 'Salin kode lisensi', icon: Copy, onClick: () => copy(o.licenseKey) },
    { label: 'Hapus pesanan', icon: Trash2, danger: true, onClick: () => removeOrder(o.code) },
  ];

  return (
    <PanelLayout title="Data QR">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-primary sm:text-[24px]">Data QR</h1>
          <PanelCrumb />
          <p className="mt-1 text-[13px] text-secondary sm:text-[14px]">Konfirmasi setelah transfer masuk. Kode lisensi dibuat otomatis.</p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading} className="self-start sm:self-auto">
          Muat ulang
        </Button>
      </div>

      <StatCards items={stats} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <TableToolbar table={table} filters={FILTERS} sorts={SORTS} searchPlaceholder="Cari kode, nama, email, WhatsApp, atau nota" />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <thead className={THEAD}>
              <tr>
                <th className={TH}>No</th>
                <th className={`${TH} min-w-[130px]`}>Pesanan</th>
                <th className={TH}>Paket</th>
                <th className={TH}>Transfer</th>
                <th className={`${TH} min-w-[170px]`}>Pemesan</th>
                <th className={`${TH} min-w-[170px]`}>Status dan lisensi</th>
                <th className={TH_ACTION}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {table.pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[13px] text-tertiary">
                    {orders === null || loading ? 'Memuat...' : 'Tidak ada pesanan yang cocok.'}
                  </td>
                </tr>
              )}
              {table.pageRows.map((o, i) => (
                <tr key={o.code} className={TR}>
                  <td className={TD_NUM}>{table.start + i + 1}</td>
                  <td className={TD}>
                    <button
                      type="button"
                      onClick={() => setDetailCode(o.code)}
                      title="Lihat detail pesanan"
                      className="font-medium text-primary transition-smooth hover:text-blue-500"
                    >
                      {o.code}
                    </button>
                    <div className="text-[11px] text-tertiary">{new Date(o.createdAt).toLocaleString('id-ID')}</div>
                    {o.notaNumber && <div className="font-mono text-[11px] text-tertiary">{o.notaNumber}</div>}
                  </td>
                  <td className={TD}>
                    <PlanChip plan={o.plan} label={o.planLabel} />
                    {o.qrLink && (
                      <div className="mt-1 max-w-[96px] truncate text-[11px] text-tertiary" title={o.qrLink}>QR: {o.qrLink}</div>
                    )}
                  </td>
                  <td className={TD}>
                    <span className="font-medium text-primary">{rupiah(o.amount)}</span>
                  </td>
                  <td className={TD}>
                    <span className="text-primary">{o.name}</span>
                    <div className="text-[11px] text-tertiary [overflow-wrap:anywhere] sm:text-[12px]">{o.email}</div>
                    {o.whatsapp && <div className="mt-1.5"><WhatsappPill number={o.whatsapp} /></div>}
                  </td>
                  <td className={TD}>
                    <div className="flex flex-col items-start gap-1">
                      <OrderStatusChip status={o.status} />
                      {o.status === 'paid' && <LicenseChip state={o.licenseState} />}
                      <ProofChip verifyStatus={o.verifyStatus} hasProof={o.hasProof} />
                    </div>
                    {/* Barcode dan link lisensi ada di modal detail, supaya tabel tetap ringkas. */}
                    {o.status === 'paid' && o.licenseKey && (
                      <div className="mt-1.5 whitespace-nowrap font-mono text-[11px] text-secondary" title="Kode lisensi">{o.licenseKey}</div>
                    )}
                    {o.status === 'paid' && o.licenseExpiresAt && (
                      <div className="whitespace-nowrap text-[11px] text-tertiary">
                        Berlaku s.d. {new Date(o.licenseExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    {o.verifyAmount != null && <div className="mt-1 text-[11px] text-tertiary">Terbaca: {rupiah(o.verifyAmount)}</div>}
                    {o.verifyNote && o.status === 'pending' && <div className="max-w-[220px] text-[11px] text-tertiary">{o.verifyNote}</div>}
                  </td>
                  <td className={TD_ACTION}>
                    {/* Ponsel: tombol disusun ke bawah supaya kolom aksi tetap sempit. */}
                    <div className="flex flex-col-reverse items-end gap-1.5 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                      {o.status === 'paid' && o.licenseState === 'aktif' && (
                        <Button size="sm" variant="secondary" icon={PowerOff} disabled={busy === o.code} onClick={() => toggleLicense(o.code, false)} className={TOGGLE_BTN}>
                          Nonaktifkan
                        </Button>
                      )}
                      {o.status === 'paid' && o.licenseState === 'nonaktif' && (
                        <Button size="sm" variant="primary" icon={Power} disabled={busy === o.code} onClick={() => toggleLicense(o.code, true)} className={TOGGLE_BTN}>
                          Aktifkan
                        </Button>
                      )}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <IconAction icon={Eye} label={`Lihat detail pesanan ${o.code}`} onClick={() => setDetailCode(o.code)} />
                        <ActionMenu items={menuItems(o)} label={`Aksi untuk pesanan ${o.code}`} disabled={busy === o.code} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination table={table} label="pesanan" />
      </div>

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          proofFetcher={adminFetchQrProof}
          onClose={() => setDetailCode(null)}
          onProof={setProofCode}
          onNota={viewNota}
          onPdf={downloadNotaPdf}
        />
      )}

      {proofCode && (
        <ProofModal
          code={proofCode}
          fetcher={adminFetchQrProof}
          details={proofDetailRows}
          onClose={() => setProofCode(null)}
        />
      )}
    </PanelLayout>
  );
}
