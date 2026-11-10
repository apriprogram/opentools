import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, QrCode, Receipt } from 'lucide-react';
import Button from '../ui/Button';
import { rupiah } from './OrderParts';

const FREE_FEATURES = ['QR tanpa batas jumlah', 'Logo OpenTools di tengah', 'Warna hitam-putih', 'Unduh PNG dan SVG'];
const PREMIUM_FEATURES = ['Semua fitur gratis', 'Ganti warna QR dan latar', 'Logo bisa dihilangkan', 'Untuk 1 QR code'];
const INPUT =
  'h-[42px] w-full rounded-md border border-border bg-card px-3 text-[14px] text-primary placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth';

// Pilihan paket. Tanpa qrContext: buat QR baru (gratis atau Premium).
// Dengan qrContext: pilih paket untuk satu QR yang sudah ada (jadikan Premium atau perpanjang).
export default function PlanPicker({ plans, busy, unknownPlan, pendingOrders, qrContext, onFree, onPaid }) {
  const renewing = Boolean(qrContext) && qrContext.status !== 'gratis';
  const cta = qrContext ? (renewing ? 'Perpanjang' : 'Jadikan Premium') : 'Pesan';

  return (
    <div>
      {unknownPlan && <p className="mb-4 text-[13px] text-tertiary">Paket tidak dikenal. Pilih salah satu paket di bawah.</p>}

      <div className={`grid gap-4 ${qrContext ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {!qrContext && <FreeCard onFree={onFree} />}
        {plans.map((p) => (
          <PremiumCard key={p.id} plan={p} cta={cta} busy={busy === p.id} onPaid={onPaid} />
        ))}
      </div>

      {pendingOrders.length > 0 && (
        <section className="mt-6 max-w-2xl rounded-2xl border border-border bg-card p-5">
          <p className="text-[15px] font-semibold text-primary">Pesanan menunggu pembayaran</p>
          <ul className="mt-3 divide-y divide-border">
            {pendingOrders.map((o) => (
              <li key={o.code} className="flex items-center justify-between gap-3 py-3">
                <div className="text-[13px]">
                  <p className="font-medium text-primary">{o.planLabel} · {o.code}</p>
                  <p className="text-tertiary">{rupiah(o.amount)}</p>
                </div>
                <Link to={`/dashboard/qr?kode=${o.code}`}>
                  <Button size="sm" variant="secondary" icon={Receipt}>Lanjutkan</Button>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// Langkah nomor WhatsApp untuk akun lama yang belum punya nomor. Diminta sekali sebelum memesan paket.
export function WhatsappStep({ value, onChange, onSubmit, busy }) {
  return (
    <form onSubmit={onSubmit} className="max-w-xl rounded-2xl border border-border bg-card p-5">
      <p className="text-[15px] font-semibold text-primary">Satu langkah lagi</p>
      <p className="mb-4 mt-1 text-[13px] text-secondary">
        Isi nomor WhatsApp akun Anda untuk dihubungi admin. Nomor ini disimpan dan tidak perlu diisi lagi.
      </p>
      <label className="mb-1 block text-[12px] text-secondary" htmlFor="wa">Nomor WhatsApp</label>
      <input
        id="wa"
        type="tel"
        required
        inputMode="tel"
        placeholder="08xxxxxxxxxx"
        className={INPUT}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-5 flex justify-end">
        <Button type="submit" variant="primary" icon={Crown} disabled={busy}>
          {busy ? 'Menyimpan...' : 'Simpan dan lanjut'}
        </Button>
      </div>
    </form>
  );
}

function FreeCard({ onFree }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <p className="text-[15px] font-semibold text-primary">Gratis</p>
      <p className="mt-3 text-[28px] font-semibold leading-[32px] text-primary">
        Rp0 <span className="text-[13px] font-normal text-secondary">selamanya</span>
      </p>
      <ul className="mt-4 flex-1 space-y-2">
        {FREE_FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px] text-secondary">
            <Check size={15} strokeWidth={2} className="mt-[2px] shrink-0 text-primary" /> {f}
          </li>
        ))}
      </ul>
      <Button variant="secondary" icon={QrCode} className="mt-5 w-full" onClick={onFree}>
        Buat QR gratis
      </Button>
    </div>
  );
}

function PremiumCard({ plan, cta, busy, onPaid }) {
  return (
    <div className="premium-gold flex flex-col rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] font-semibold">{plan.label}</p>
        <span className="rounded-full border border-current px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
          Premium Gold
        </span>
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-[32px]">
        {rupiah(plan.price)} <span className="text-[13px] font-normal">{plan.id === 'monthly' ? '/ bulan' : '/ tahun'}</span>
      </p>
      {plan.note && <p className="mt-1 text-[12px] opacity-80">{plan.note}</p>}
      <ul className="mt-4 flex-1 space-y-2 text-[13px]">
        {PREMIUM_FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check size={15} strokeWidth={2} className="mt-[2px] shrink-0" /> {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={busy}
        onClick={() => onPaid(plan.id)}
        className="premium-gold-btn mt-5 inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-md text-[14px] font-medium transition-smooth active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Crown size={16} strokeWidth={1.75} />
        {`${cta} ${plan.label}`}
      </button>
    </div>
  );
}
