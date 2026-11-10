import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, FileText, Receipt } from 'lucide-react';
import Button from '../ui/Button';
import Countdown from '../ui/Countdown';
import LicenseQr from './LicenseQr';
import { ProofThumb } from './ProofModal';
import { proofLabel, rupiah, tanggal } from './OrderParts';

const TH = 'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-tertiary';
const TD = 'px-3 py-3 align-top text-[13px] text-secondary';

const LICENSE_TEXT = { aktif: 'Aktif', nonaktif: 'Nonaktif', berakhir: 'Berakhir' };
const LICENSE_CLS = { aktif: 'text-success', nonaktif: 'text-danger', berakhir: 'text-danger' };

// Tabel pesanan: status bayar, bukti, lisensi (barcode dan link), dan nota.
export default function OrderTable({ orders, expiryByKey = {}, onProof, onNota, onPdf }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[820px] border-collapse">
        <thead className="bg-card-muted/50">
          <tr>
            <th className={TH}>Pesanan</th>
            <th className={TH}>Nominal</th>
            <th className={TH}>Pembayaran</th>
            <th className={TH}>Lisensi</th>
            <th className={`${TH} text-right`}>Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {!orders ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-[13px] text-tertiary">Memuat...</td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-[13px] text-tertiary">
                Belum ada pesanan. Pilih Buat QR baru, lalu pilih paket Premium Gold.
              </td>
            </tr>
          ) : (
            orders.map((o) => (
              <OrderRow
                key={o.code}
                order={o}
                expiresAt={expiryByKey[o.licenseKey] || null}
                onProof={onProof}
                onNota={onNota}
                onPdf={onPdf}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function OrderRow({ order: o, expiresAt, onProof, onNota, onPdf }) {
  const paid = o.status === 'paid';
  const cancelled = o.status === 'cancelled';
  const uploaded = o.proofUploadedAt
    ? new Date(o.proofUploadedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <tr>
      <td className={TD}>
        <span className="block text-[14px] font-semibold text-primary">{o.planLabel}</span>
        <span className="premium-gold mt-1 inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
          Premium Gold
        </span>
        <span className="mt-1 block font-mono text-[12px] text-tertiary">{o.code}</span>
        {o.qrLink && (
          <span className="block max-w-[220px] truncate text-[12px] text-tertiary" title={o.qrLink}>QR: {o.qrLink}</span>
        )}
        <span className="block text-[12px] text-tertiary">Dibuat {tanggal(o.createdAt)}</span>
        {o.notaNumber && <span className="block text-[12px] text-tertiary">Nota {o.notaNumber}</span>}
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
        {paid ? (
          <span className="font-semibold text-success">Lunas</span>
        ) : cancelled ? (
          <span className="font-semibold text-danger">Batal</span>
        ) : (
          <span className="font-medium text-primary">Menunggu pembayaran</span>
        )}
        <span className="mt-1 block text-[12px] text-tertiary" title={o.verifyNote || ''}>{proofLabel(o)}</span>
        {uploaded && <span className="block text-[11px] text-tertiary">Diunggah {uploaded}</span>}
        {paid && o.paidAt && <span className="block text-[11px] text-tertiary">Dibayar {tanggal(o.paidAt)}</span>}
      </td>

      <td className={TD}>
        {paid && o.licenseKey ? (
          <div className="space-y-2">
            <span className={`block text-[12px] font-semibold ${LICENSE_CLS[o.licenseState] || 'text-secondary'}`}>
              {LICENSE_TEXT[o.licenseState] || 'Lisensi'}
            </span>
            {o.licenseState === 'aktif' && expiresAt && (
              <Countdown expiresAt={expiresAt} className="block text-[13px] font-medium text-primary" />
            )}
            <LicenseQr licenseKey={o.licenseKey} />
          </div>
        ) : (
          <span className="text-tertiary">-</span>
        )}
      </td>

      <td className={`${TD} text-right`}>
        <div className="inline-flex flex-wrap justify-end gap-2">
          {o.status === 'pending' && (
            <Link to={`/dashboard/qr?kode=${o.code}`}>
              <Button size="sm" variant="secondary" icon={Receipt}>Bayar</Button>
            </Link>
          )}
          {o.hasProof && (
            <Button size="sm" variant="ghost" icon={Eye} onClick={() => onProof(o.code)}>Lihat bukti</Button>
          )}
          <Button size="sm" variant="secondary" icon={FileText} onClick={() => onNota(o.code)}>Nota</Button>
          <Button size="sm" variant="ghost" icon={Download} onClick={() => onPdf(o.code)}>PDF</Button>
        </div>
      </td>
    </tr>
  );
}
