import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Copy, Eye, Landmark, MessageCircle, Wallet } from 'lucide-react';
import Button from '../ui/Button';
import Countdown from '../ui/Countdown';
import LicenseQr from './LicenseQr';
import { ProofSection, rupiah } from './OrderParts';

const CARD = 'rounded-2xl border border-border bg-card p-5';

// Instruksi pembayaran untuk satu pesanan: pilihan metode (DANA atau transfer bank, sesuai yang diaktifkan admin)
// dan langkah-langkahnya. Pesanan lunas menampilkan kode lisensi dan QR.
export default function PaymentInstruction({ order, payment, expiresAt, onUpdated, onProof }) {
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [methodId, setMethodId] = useState(null);

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
          <LicenseQr licenseKey={order.licenseKey} design={order.qrDesign} code={order.code} />
        </div>
      </div>
    );
  }

  const whatsappLink = payment
    ? `https://wa.me/${payment.whatsapp}?text=${encodeURIComponent(
        `Halo, saya sudah transfer untuk pesanan QR Generator ${order.code} (${order.planLabel}) sebesar ${rupiah(order.amount)}. Mohon dicek. Terima kasih.`
      )}`
    : '#';

  // Metode yang diaktifkan admin (DANA, transfer bank, atau keduanya). Server lama hanya mengirim satu metode.
  const methods = payment?.methods?.length
    ? payment.methods
    : payment?.number
      ? [{ id: 'dana', label: 'DANA', title: payment.method, number: payment.number, name: payment.name }]
      : [];
  const method = methods.find((m) => m.id === methodId) || methods[0] || null;
  const isBank = method?.id === 'bank';

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
        <h2 className="text-[15px] font-semibold text-primary">Cara pembayaran</h2>
        <p className="mt-0.5 text-[12px] text-secondary sm:text-[13px]">
          {methods.length > 1 ? 'Pilih salah satu metode, lalu ikuti langkahnya.' : 'Ikuti langkah di bawah ini.'}
        </p>

        {/* Pilihan metode, hanya tampil bila admin mengaktifkan lebih dari satu */}
        {methods.length > 1 && (
          <div role="tablist" aria-label="Metode pembayaran" className="mt-4 inline-flex max-w-full gap-1 overflow-x-auto rounded-md bg-card-muted p-1">
            {methods.map((m) => {
              const active = m.id === method?.id;
              const Icon = m.id === 'bank' ? Landmark : Wallet;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMethodId(m.id)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-[13px] transition-smooth ${
                    active ? 'bg-card font-medium text-primary shadow-tab dark:bg-zinc-700' : 'text-secondary hover:text-primary'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.75} aria-hidden="true" /> {m.label}
                </button>
              );
            })}
          </div>
        )}

        {method ? (
          <div className="mt-4 rounded-xl border border-border p-4">
            <p className="text-[12px] text-secondary">{method.title}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="break-all text-[18px] font-semibold tracking-wide text-primary">{method.number}</p>
              <Button variant="secondary" size="sm" icon={copied ? CheckCheck : Copy} onClick={() => copyText(method.number, setCopied)}>
                {copied ? 'Disalin' : 'Salin'}
              </Button>
            </div>
            {method.name && <p className="mt-1 text-[12px] text-secondary sm:text-[13px]">a.n. <span className="font-medium text-primary">{method.name}</span></p>}

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
              <div>
                <p className="text-[12px] text-secondary">Nominal transfer</p>
                <p className="text-[16px] font-semibold text-primary">{rupiah(order.amount)}</p>
              </div>
              <Button variant="secondary" size="sm" icon={copiedAmount ? CheckCheck : Copy} onClick={() => copyText(String(order.amount), setCopiedAmount)}>
                {copiedAmount ? 'Disalin' : 'Salin nominal'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-amber-500/10 px-3 py-2.5 text-[12px] text-amber-700 dark:text-amber-400 sm:text-[13px]">
            Metode pembayaran belum tersedia. Hubungi admin lewat WhatsApp untuk menyelesaikan pembayaran.
          </p>
        )}

        {method && (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-secondary">
            <li>
              {isBank ? (
                <>Buka aplikasi mobile banking atau ATM, pilih transfer ke <span className="font-medium text-primary">{method.bankName ? `bank ${method.bankName}` : 'rekening bank'}</span>, lalu masukkan nomor rekening di atas.</>
              ) : (
                <>Buka aplikasi DANA, pilih <span className="font-medium text-primary">Kirim</span>, lalu masukkan nomor DANA di atas.</>
              )}
              {method.name && <> Pastikan nama penerimanya <span className="font-medium text-primary">{method.name}</span>.</>}
            </li>
            <li>
              Isi nominal tepat <span className="font-medium text-primary">{rupiah(order.amount)}</span>, jangan dibulatkan.
              {order.uniqueCode ? <> Angka {order.uniqueCode} di belakangnya adalah kode unik supaya pembayaranmu mudah dikenali.</> : null}
              {isBank && <> Biaya transfer antarbank, bila ada, tidak termasuk dalam nominal ini.</>}
            </li>
            <li>Selesaikan transfer, lalu simpan screenshot atau struk buktinya.</li>
            <li>Unggah bukti itu di bagian bawah halaman ini. Kalau cocok, Premium langsung aktif tanpa menunggu admin.</li>
            <li>
              Belum aktif setelah beberapa menit? Tekan Konfirmasi via WhatsApp dan sebutkan kode pesanan{' '}
              <span className="font-medium text-primary">{order.code}</span>.
            </li>
          </ol>
        )}

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
