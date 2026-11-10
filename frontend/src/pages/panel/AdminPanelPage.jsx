import React, { useCallback, useEffect, useState } from 'react';
import { Check, X, RefreshCw, Copy, Eye, FileText, Download, Power, PowerOff, Trash2 } from 'lucide-react';
import PanelLayout from '../../components/panel/PanelLayout';
import ProofModal from '../../components/panel/ProofModal';
import LicenseQr from '../../components/panel/LicenseQr';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
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
const LICENSE_TEXT = {
  aktif: { text: 'Aktif', cls: 'text-success' },
  nonaktif: { text: 'Nonaktif', cls: 'text-danger' },
  berakhir: { text: 'Berakhir', cls: 'text-tertiary' },
  tidak_ada: { text: 'Tidak ada', cls: 'text-tertiary' },
};

const FILTERS = [
  { id: 'pending', label: 'Menunggu' },
  { id: 'paid', label: 'Lunas' },
  { id: 'cancelled', label: 'Batal' },
  { id: 'all', label: 'Semua' },
];
const VERIFY_LABEL = {
  approved: { text: 'Otomatis lunas', cls: 'text-success' },
  review: { text: 'Perlu cek manual', cls: 'text-secondary' },
  rejected: { text: 'Ditolak', cls: 'text-danger' },
  checking: { text: 'Diperiksa', cls: 'text-secondary' },
};

const rupiah = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;
const TH = 'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-tertiary';
const TD = 'px-3 py-3 align-top text-[13px] text-secondary';

export default function AdminPanelPage() {
  const { addToast: toast } = useToast();
  const [filter, setFilter] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [proofCode, setProofCode] = useState(null);

  const load = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await adminFetchQrOrders(status);
      setOrders(res.orders || []);
    } catch (err) {
      toast({ type: 'error', title: 'Gagal memuat', message: err?.response?.data?.message || 'Tidak bisa menghubungi server.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

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
      load(filter);
    });

  const cancel = (code) => {
    if (!window.confirm(`Batalkan pesanan ${code}?`)) return;
    withBusy(code, async () => {
      await adminCancelQrOrder(code);
      toast({ type: 'info', title: 'Pesanan dibatalkan', message: code });
      load(filter);
    });
  };

  // Nonaktifkan atau aktifkan lisensi (QR dan link ikut nonaktif).
  const toggleLicense = (code, active) => {
    const verb = active ? 'Aktifkan' : 'Nonaktifkan';
    if (!window.confirm(`${verb} lisensi pesanan ${code}?`)) return;
    withBusy(code, async () => {
      await adminSetQrLicense(code, active);
      toast({ type: 'success', title: active ? 'Lisensi diaktifkan' : 'Lisensi dinonaktifkan', message: code });
      load(filter);
    });
  };

  // Hapus pesanan permanen, termasuk bukti dan lisensi. Akun pembeli ikut kehilangan datanya.
  const removeOrder = (code) => {
    if (!window.confirm(`Hapus pesanan ${code} secara permanen? Bukti dan lisensinya ikut dihapus, dan data di akun pembeli juga hilang.`)) return;
    withBusy(code, async () => {
      await adminDeleteQrOrder(code);
      toast({ type: 'info', title: 'Pesanan dihapus', message: code });
      load(filter);
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

  // Bukti dibuka di modal, bukan tab baru.
  const viewProof = (code) => setProofCode(code);

  const proofOrder = orders.find((o) => o.code === proofCode) || null;
  const proofDetailRows = proofOrder && [
    ['Diunggah', proofOrder.proofUploadedAt ? new Date(proofOrder.proofUploadedAt).toLocaleString('id-ID') : '-'],
    ['Nominal terbaca', proofOrder.verifyAmount != null ? rupiah(proofOrder.verifyAmount) : '-'],
    ['Nominal pesanan', rupiah(proofOrder.amount)],
    ['Status bukti', VERIFY_LABEL[proofOrder.verifyStatus]?.text || (proofOrder.hasProof ? 'Sudah diunggah' : 'Belum diunggah')],
    ['Catatan', proofOrder.verifyNote || '-'],
  ];

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    toast({ type: 'success', title: 'Disalin', message: text });
  };

  return (
    <PanelLayout title="Konfirmasi Pesanan">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-primary">Konfirmasi Pesanan</h1>
          <p className="mt-1 text-[14px] text-secondary">Konfirmasi setelah transfer masuk. Kode lisensi dibuat otomatis.</p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => load(filter)} disabled={loading}>
          Muat ulang
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`h-[32px] rounded-full border px-3 text-[12px] font-medium transition-smooth ${
              filter === f.id ? 'border-accent-black bg-accent-black text-white dark:border-white dark:bg-white dark:text-black' : 'border-border text-secondary hover:text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="bg-card-muted/50">
            <tr>
              <th className={TH}>Kode</th>
              <th className={TH}>Paket</th>
              <th className={TH}>Transfer</th>
              <th className={TH}>Pemesan</th>
              <th className={TH}>Status</th>
              <th className={TH}>Lisensi</th>
              <th className={`${TH} text-right`}>Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[13px] text-tertiary">
                  {loading ? 'Memuat...' : 'Tidak ada pesanan.'}
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.code}>
                <td className={TD}>
                  <span className="font-medium text-primary">{o.code}</span>
                  <div className="text-[11px] text-tertiary">{new Date(o.createdAt).toLocaleString('id-ID')}</div>
                  {o.notaNumber && <div className="font-mono text-[11px] text-tertiary">{o.notaNumber}</div>}
                </td>
                <td className={`${TD} text-primary`}>{o.planLabel}</td>
                <td className={`${TD} text-primary`}>{rupiah(o.amount)}</td>
                <td className={TD}>
                  {o.name}
                  <div className="break-all text-[12px] text-tertiary">{o.email}</div>
                  {o.whatsapp && (
                    <a href={`https://wa.me/${o.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-primary underline">
                      WA +{o.whatsapp}
                    </a>
                  )}
                </td>
                <td className={TD}>
                  <span className={`font-medium ${o.status === 'paid' ? 'text-success' : o.status === 'cancelled' ? 'text-danger' : 'text-secondary'}`}>
                    {o.status === 'pending' ? 'Menunggu' : o.status === 'paid' ? 'Lunas' : 'Batal'}
                  </span>
                  {o.status === 'paid' && LICENSE_TEXT[o.licenseState] && (
                    <div className={`mt-1 text-[12px] font-medium ${LICENSE_TEXT[o.licenseState].cls}`}>
                      Lisensi: {LICENSE_TEXT[o.licenseState].text}
                    </div>
                  )}
                  {VERIFY_LABEL[o.verifyStatus] ? (
                    <div className={`mt-1 text-[12px] font-medium ${VERIFY_LABEL[o.verifyStatus].cls}`}>Bukti: {VERIFY_LABEL[o.verifyStatus].text}</div>
                  ) : (
                    <div className="mt-1 text-[12px] text-tertiary">Bukti: belum diunggah</div>
                  )}
                  {o.verifyAmount != null && <div className="text-[11px] text-tertiary">Terbaca: {rupiah(o.verifyAmount)}</div>}
                  {o.verifyNote && o.status === 'pending' && <div className="max-w-[220px] text-[11px] text-tertiary">{o.verifyNote}</div>}
                </td>
                <td className={TD}>
                  {o.status === 'paid' && o.licenseKey && (
                    <div className="mb-3">
                      <LicenseQr licenseKey={o.licenseKey} />
                    </div>
                  )}
                  {o.licenseKey ? (
                    <button onClick={() => copy(o.licenseKey)} className="inline-flex items-center gap-1 break-all text-left font-medium text-primary hover:underline">
                      {o.licenseKey} <Copy size={12} />
                    </button>
                  ) : (
                    <span className="text-tertiary">-</span>
                  )}
                </td>
                <td className={`${TD} text-right`}>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="ghost" icon={FileText} disabled={busy === o.code} onClick={() => viewNota(o.code)}>Nota</Button>
                    <Button size="sm" variant="ghost" icon={Download} disabled={busy === o.code} onClick={() => downloadNotaPdf(o.code)}>PDF</Button>
                    {o.hasProof && (
                      <Button size="sm" variant="ghost" icon={Eye} disabled={busy === o.code} onClick={() => viewProof(o.code)}>Bukti</Button>
                    )}
                    {o.status === 'paid' && o.licenseState === 'aktif' && (
                      <Button size="sm" variant="secondary" icon={PowerOff} disabled={busy === o.code} onClick={() => toggleLicense(o.code, false)}>Nonaktifkan</Button>
                    )}
                    {o.status === 'paid' && o.licenseState === 'nonaktif' && (
                      <Button size="sm" variant="primary" icon={Power} disabled={busy === o.code} onClick={() => toggleLicense(o.code, true)}>Aktifkan</Button>
                    )}
                    <Button size="sm" variant="ghost" icon={Trash2} disabled={busy === o.code} onClick={() => removeOrder(o.code)}>Hapus</Button>
                    {o.status === 'pending' && (
                      <>
                        <Button size="sm" variant="primary" icon={Check} disabled={busy === o.code} onClick={() => confirm(o.code)}>Konfirmasi</Button>
                        <Button size="sm" variant="secondary" icon={X} disabled={busy === o.code} onClick={() => cancel(o.code)}>Batal</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
