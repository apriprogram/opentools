import React from 'react';
import { Download, Eye, FileText, PencilLine, Power, PowerOff, Receipt } from 'lucide-react';
import Countdown from '../ui/Countdown';
import LicenseQr from './LicenseQr';
import { ProofThumb } from './ProofModal';
import { proofLabel, rupiah, tanggal } from './OrderParts';
import ActionMenu from './table/ActionMenu';
import TableToolbar from './table/TableToolbar';
import TablePagination from './table/TablePagination';
import { LicenseChip, OrderStatusChip } from './Chips';
import { useTableControls, TH, TD, TD_NUM, TH_ACTION, TD_ACTION } from './table/useTableControls';

// Filter, urutan, dan teks pencarian tabel. Didefinisikan di luar komponen supaya stabil.
const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Menunggu', test: (o) => o.status === 'pending' },
  { id: 'paid', label: 'Lunas', test: (o) => o.status === 'paid' },
  { id: 'cancelled', label: 'Batal', test: (o) => o.status === 'cancelled' },
];
const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
const SORTS = [
  { id: 'newest', label: 'Terbaru', compare: newestFirst },
  { id: 'oldest', label: 'Terlama', compare: (a, b) => newestFirst(b, a) },
  { id: 'amount_desc', label: 'Nominal terbesar', compare: (a, b) => b.amount - a.amount },
  { id: 'amount_asc', label: 'Nominal terkecil', compare: (a, b) => a.amount - b.amount },
];
const searchText = (o) => [o.code, o.planLabel, o.notaNumber, o.qrLink, o.licenseKey].filter(Boolean).join(' ');

// Tabel pesanan: status bayar, bukti, lisensi (barcode dan link), dan nota.
// Dilengkapi cari, filter, urutkan, jumlah per halaman, dan halaman. Aksi tiap baris ada di menu titik tiga.
// qrList dan onEditQr: bila pesanan terikat pada QR Premium yang masih aktif, menu aksinya punya "Edit QR".
// onToggleQr: nonaktifkan atau aktifkan lagi QR yang terikat pada pesanan.
export default function OrderTable({ orders, expiryByKey = {}, qrList = [], onProof, onNota, onPdf, onEditQr, onToggleQr }) {
  const table = useTableControls(orders, { searchText, filters: FILTERS, sorts: SORTS });
  const hasOrders = Boolean(orders && orders.length);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <TableToolbar table={table} filters={FILTERS} sorts={SORTS} searchPlaceholder="Cari kode pesanan, paket, nota, atau link QR" />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead className="bg-card-muted">
            <tr>
              <th className={TH}>No</th>
              <th className={`${TH} min-w-[180px]`}>Pesanan</th>
              <th className={TH}>Nominal</th>
              <th className={`${TH} min-w-[170px]`}>Pembayaran</th>
              <th className={TH}>Lisensi</th>
              <th className={TH_ACTION}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!orders ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[13px] text-tertiary">Memuat...</td>
              </tr>
            ) : table.pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[13px] text-tertiary">
                  {hasOrders
                    ? 'Tidak ada pesanan yang cocok dengan pencarian atau filter.'
                    : 'Belum ada pesanan. Pilih Buat QR baru, lalu pilih paket Premium Gold.'}
                </td>
              </tr>
            ) : (
              table.pageRows.map((o, i) => (
                <OrderRow
                  key={o.code}
                  number={table.start + i + 1}
                  order={o}
                  expiresAt={expiryByKey[o.licenseKey] || null}
                  qr={o.qrId ? (qrList || []).find((q) => q.id === o.qrId) || null : null}
                  onEditQr={onEditQr}
                  onToggleQr={onToggleQr}
                  onProof={onProof}
                  onNota={onNota}
                  onPdf={onPdf}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination table={table} label="pesanan" />
    </div>
  );
}

function OrderRow({ number, order: o, expiresAt, qr, onProof, onNota, onPdf, onEditQr, onToggleQr }) {
  const paid = o.status === 'paid';
  const cancelled = o.status === 'cancelled';
  const uploaded = o.proofUploadedAt
    ? new Date(o.proofUploadedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  // Link, warna, dan logo hanya bisa diedit untuk QR Premium yang masih aktif.
  const canEdit = Boolean(onEditQr) && qr?.status === 'aktif';

  const menuItems = [
    o.status === 'pending' && { label: 'Bayar', icon: Receipt, to: `/dashboard/qr?kode=${o.code}` },
    canEdit && { label: 'Edit QR', icon: PencilLine, onClick: () => onEditQr(qr) },
    Boolean(onToggleQr) && qr && paid && {
      label: qr.disabled ? 'Aktifkan QR' : 'Nonaktifkan QR',
      icon: qr.disabled ? Power : PowerOff,
      onClick: () => onToggleQr(qr),
    },
    o.hasProof && { label: 'Lihat bukti', icon: Eye, onClick: () => onProof(o.code) },
    { label: 'Lihat nota', icon: FileText, onClick: () => onNota(o.code) },
    { label: 'Unduh nota PDF', icon: Download, onClick: () => onPdf(o.code) },
  ];

  return (
    <tr className="group transition-smooth hover:bg-card-muted">
      <td className={TD_NUM}>{number}</td>

      <td className={TD}>
        <span className="block text-[13px] font-semibold text-primary sm:text-[14px]">{o.planLabel}</span>
        <span className="premium-gold mt-1 inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
          Premium Gold
        </span>
        <span className="mt-1 block font-mono text-[11px] text-tertiary sm:text-[12px]">{o.code}</span>
        {o.qrLink && (
          <span className="block max-w-[220px] truncate text-[11px] text-tertiary sm:text-[12px]" title={o.qrLink}>QR: {o.qrLink}</span>
        )}
        <span className="block text-[11px] text-tertiary sm:text-[12px]">Dibuat {tanggal(o.createdAt)}</span>
        {o.notaNumber && <span className="block text-[11px] text-tertiary sm:text-[12px]">Nota {o.notaNumber}</span>}
      </td>

      <td className={TD}>
        <span className="block font-medium text-primary">{rupiah(o.amount)}</span>
        {o.hasProof && (
          <span className="mt-2 block">
            <ProofThumb code={o.code} onOpen={() => onProof(o.code)} />
          </span>
        )}
      </td>

      <td className={TD}>
        <OrderStatusChip status={o.status} />
        <span className="mt-1 block text-[11px] text-tertiary sm:text-[12px]" title={o.verifyNote || ''}>{proofLabel(o)}</span>
        {uploaded && <span className="block text-[11px] text-tertiary">Diunggah {uploaded}</span>}
        {paid && o.paidAt && <span className="block text-[11px] text-tertiary">Dibayar {tanggal(o.paidAt)}</span>}
      </td>

      <td className={TD}>
        {paid && o.licenseKey ? (
          <div className="space-y-2">
            <LicenseChip state={o.licenseState} />
            {o.licenseState === 'aktif' && expiresAt && (
              <Countdown expiresAt={expiresAt} className="block text-[12px] font-medium text-primary sm:text-[13px]" />
            )}
            <LicenseQr licenseKey={o.licenseKey} design={o.qrDesign} code={o.code} />
          </div>
        ) : (
          <span className="text-tertiary">-</span>
        )}
      </td>

      <td className={TD_ACTION}>
        <div className="flex justify-end">
          <ActionMenu items={menuItems} label={`Aksi untuk pesanan ${o.code}`} />
        </div>
      </td>
    </tr>
  );
}
