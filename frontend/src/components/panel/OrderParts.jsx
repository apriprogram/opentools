import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, CheckCheck, Upload } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { uploadQrProof } from '../../services/qrApi';

export const rupiah = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;
export const tanggal = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const PROOF_TEXT = {
  approved: 'Terverifikasi otomatis',
  review: 'Menunggu pemeriksaan admin',
  rejected: 'Ditolak',
  checking: 'Sedang diperiksa',
};

// Keterangan status bukti transfer pada pesanan.
export const proofLabel = (o) => {
  if (o.verifyStatus && PROOF_TEXT[o.verifyStatus]) return `Bukti: ${PROOF_TEXT[o.verifyStatus]}`;
  return o.hasProof ? 'Bukti: sudah diunggah' : 'Bukti: belum diunggah';
};

// Rincian bukti transfer untuk modal bukti.
export const proofDetails = (o) => {
  if (!o) return null;
  return [
    ['Diunggah', o.proofUploadedAt ? new Date(o.proofUploadedAt).toLocaleString('id-ID') : '-'],
    ['Nominal terbaca', o.verifyAmount != null ? rupiah(o.verifyAmount) : '-'],
    ['Nominal pesanan', rupiah(o.amount)],
    ['Status bukti', proofLabel(o).replace('Bukti: ', '')],
    ['Catatan', o.verifyNote || '-'],
  ];
};

const PROOF_NOTICE = {
  checking: 'Bukti sedang diperiksa...',
  review: 'Bukti sudah diterima dan menunggu pemeriksaan admin.',
  rejected: 'Bukti belum bisa diterima.',
};
const MAX_PROOF_BYTES = 4 * 1024 * 1024;

// Kode lisensi untuk pesanan yang sudah lunas.
export function LicenseBox({ order }) {
  const [copied, setCopied] = useState(false);
  const copyKey = () => {
    navigator.clipboard?.writeText(order.licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card-muted p-4">
      <p className="text-[13px] text-secondary">Pesanan {order.code} ({order.planLabel}) sudah lunas.</p>
      <p className="mt-3 text-[12px] text-secondary">Kode lisensi Anda</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="break-all text-[16px] font-semibold tracking-wider text-primary">{order.licenseKey}</p>
        <Button variant="secondary" size="sm" icon={copied ? CheckCheck : Copy} onClick={copyKey}>
          {copied ? 'Disalin' : 'Salin'}
        </Button>
      </div>
      <p className="mt-3 text-[12px] text-tertiary">
        Lisensi ini aktif di <Link to="/dashboard/qr" className="underline hover:text-primary">QR Generator</Link>.
      </p>
    </div>
  );
}

// Unggah bukti transfer. Hasil analisa langsung tampil; jika lolos, lisensi aktif tanpa menunggu admin.
export function ProofSection({ order, onUpdated }) {
  const { addToast: toast } = useToast();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (order.status !== 'pending') return null;

  const attemptsLeft = Math.max(0, (order.maxProofAttempts || 5) - (order.proofAttempts || 0));
  const notice = PROOF_NOTICE[order.verifyStatus];

  const pick = (e) => {
    const picked = e.target.files?.[0] || null;
    if (picked && picked.size > MAX_PROOF_BYTES) {
      toast({ type: 'error', title: 'File terlalu besar', message: 'Ukuran bukti maksimal 4 MB.' });
      setInputKey((k) => k + 1);
      setFile(null);
      return;
    }
    setFile(picked);
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadQrProof({ code: order.code, email: order.email, file });
      onUpdated(res.order);
      if (res.approved) {
        toast({ type: 'success', title: 'Pembayaran terverifikasi', message: 'Lisensi Anda sudah aktif.' });
      } else {
        toast({ type: 'info', title: 'Bukti diterima', message: res.order.verifyNote || 'Bukti sedang diperiksa.' });
      }
    } catch (err) {
      toast({ type: 'error', title: 'Unggah gagal', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setFile(null);
      setInputKey((k) => k + 1);
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-border p-4">
      <p className="text-[14px] font-semibold text-primary">Unggah bukti transfer</p>
      <p className="mb-3 mt-1 text-[12px] text-secondary">
        Nominal harus tepat {rupiah(order.amount)}. Jika bukti asli dan nominal, tujuan, serta waktunya cocok, lisensi langsung aktif.
      </p>

      {order.verifyStatus !== 'none' && notice && (
        <div className="mb-3 rounded-lg border border-border bg-card-muted p-3">
          <p className="text-[13px] font-medium text-primary">{notice}</p>
          {order.verifyNote && <p className="mt-1 text-[12px] text-secondary">{order.verifyNote}</p>}
        </div>
      )}

      <input
        key={inputKey}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={pick}
        disabled={attemptsLeft <= 0 || busy}
        className="block w-full text-[13px] text-secondary file:mr-3 file:h-[36px] file:rounded-md file:border file:border-border file:bg-card file:px-3 file:text-[13px] file:text-primary"
      />

      {preview && <img src={preview} alt="Pratinjau bukti transfer" className="mt-3 max-h-[220px] rounded-lg border border-border" />}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[12px] text-tertiary">Sisa unggahan: {attemptsLeft}</p>
        <Button variant="primary" icon={Upload} disabled={!file || busy || attemptsLeft <= 0} onClick={submit}>
          {busy ? 'Memeriksa bukti...' : 'Unggah & periksa'}
        </Button>
      </div>
      {attemptsLeft <= 0 && <p className="mt-2 text-[12px] text-danger">Batas unggahan tercapai. Hubungi admin lewat WhatsApp.</p>}
    </div>
  );
}
