import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Copy, Eye, MessageCircle } from 'lucide-react';
import Button from '../ui/Button';
import Countdown from '../ui/Countdown';
import LicenseQr from './LicenseQr';
import { ProofSection, rupiah } from './OrderParts';

const CARD = 'rounded-2xl border border-border bg-card p-5';

// Instruksi pembayaran untuk satu pesanan. Pesanan lunas menampilkan kode lisensi dan barcode.
export default function PaymentInstruction({ order, payment, expiresAt, onUpdated, onProof }) {
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const copyText = (text, setDone) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  if (order.status === 'cancelled') {
    return (
      <div className={CARD}>
        <p className="text-[15px] font-semibold text-primary">Pesanan dibatalkan</p>
        <p className="mt-1 text-[13px] text-secondary">Pesanan {order.code} sudah dibatalkan. Silakan pilih paket lagi.</p>
        <Link to="/dashboard/qr?view=pilih" className="mt-4 inline-block">
          <Button variant="secondary">Buat QR baru</Button>
        </Link>
      </div>
    );
  }

  if (order.status === 'paid') {
    return (
      <div className="premium-gold rounded-2xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[16px] font-semibold">Premium Gold {order.planLabel} aktif</p>
          <span className="rounded-full border border-current px-2.5 py-1 text-[12px] font-medium">Lunas</span>
        </div>
        <p className="mt-1 text-[13px] opacity-80">
          Pesanan {order.code} sudah lunas. QR di menu ini bisa memakai fitur Premium Gold.
        </p>

        <p className="mt-4 text-[12px] opacity-80">Kode lisensi</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="break-all text-[16px] font-semibold tracking-wider">{order.licenseKey}</p>
          <Button variant="secondary" size="sm" icon={copiedKey ? CheckCheck : Copy} onClick={() => copyText(order.licenseKey, setCopiedKey)}>
            {copiedKey ? 'Disalin' : 'Salin'}
          </Button>
        </div>
        {expiresAt && (
          <p className="mt-3 text-[13px]">
            Sisa waktu: <Countdown expiresAt={expiresAt} className="font-semibold" />
          </p>
        )}

        <div className="mt-4 rounded-xl border border-border bg-card p-4 text-primary">
          <LicenseQr licenseKey={order.licenseKey} />
        </div>
      </div>
    );
  }

  const whatsappLink = payment
    ? `https://wa.me/${payment.whatsapp}?text=${encodeURIComponent(
        `Halo, saya sudah transfer untuk pesanan QR Generator ${order.code} (${order.planLabel}) sebesar ${rupiah(order.amount)}. Mohon dicek. Terima kasih.`
      )}`
    : '#';

  return (
    <div className="space-y-4">
      <div className="premium-gold rounded-2xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">Premium Gold</p>
            <p className="text-[18px] font-semibold">{order.planLabel}</p>
            {order.qrLink && <p className="mt-1 truncate text-[12px] opacity-80">QR: {order.qrLink}</p>}
          </div>
          <span className="rounded-full border border-current px-2.5 py-1 text-[12px] font-medium">Menunggu pembayaran</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#FFF9E0]/70 p-4">
            <p className="text-[12px] opacity-80">Kode pesanan</p>
            <p className="text-[18px] font-semibold tracking-wider">{order.code}</p>
          </div>
          <div className="rounded-xl bg-[#FFF9E0]/70 p-4">
            <p className="text-[12px] opacity-80">Jumlah yang ditransfer</p>
            <p className="text-[22px] font-semibold">{rupiah(order.amount)}</p>
            <p className="text-[12px] opacity-80">Harus tepat sampai digit terakhir</p>
          </div>
        </div>
      </div>

      <div className={CARD}>
        {payment && (
          <div className="rounded-xl border border-border p-4">
            <p className="text-[12px] text-secondary">{payment.method}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-[18px] font-semibold tracking-wide text-primary">{payment.number}</p>
              <Button variant="secondary" size="sm" icon={copied ? CheckCheck : Copy} onClick={() => copyText(payment.number, setCopied)}>
                {copied ? 'Disalin' : 'Salin'}
              </Button>
            </div>
          </div>
        )}

        <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-[13px] text-secondary">
          <li>Transfer tepat <span className="font-medium text-primary">{rupiah(order.amount)}</span> ke nomor di atas.</li>
          <li>Unggah screenshot atau struk bukti transfer di bawah. Jika cocok, lisensi langsung aktif.</li>
          <li>
            Jika belum aktif, kirim bukti ke WhatsApp dengan kode pesanan{' '}
            <span className="font-medium text-primary">{order.code}</span>.
          </li>
        </ol>

        <div className="mt-4 flex flex-wrap gap-2">
          {payment && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" icon={MessageCircle}>Konfirmasi via WhatsApp</Button>
            </a>
          )}
          {order.hasProof && (
            <Button variant="ghost" icon={Eye} onClick={() => onProof(order.code)}>Lihat bukti</Button>
          )}
        </div>

        <ProofSection order={order} onUpdated={onUpdated} />
      </div>
    </div>
  );
}
