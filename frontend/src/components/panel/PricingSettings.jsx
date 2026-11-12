import React, { useEffect, useState } from 'react';
import { CalendarClock, CalendarRange, Calendar, RotateCcw, Save, Tag } from 'lucide-react';
import Button from '../ui/Button';
import Switch from '../ui/Switch';
import { DiscountBadge } from '../ui/PlanPrice';
import { useToast } from '../ui/Toast';
import { adminFetchPricingSettings, adminSavePricingSettings } from '../../services/qrApi';
import { PERCENT_MAX, PRICE_MAX, PRICE_MIN, discountCut, rupiah, tanggalPanjang, todayWib } from '../../lib/pricing';

const INPUT =
  'ios-no-zoom h-10 w-full rounded-md border border-border bg-card px-3 text-[13px] text-primary placeholder:text-tertiary transition-smooth hover:border-border-hover focus:border-border-focus focus:outline-none disabled:cursor-not-allowed disabled:bg-card-muted disabled:text-tertiary sm:text-[14px]';
const LABEL = 'mb-1.5 block text-[12px] font-medium text-secondary sm:text-[13px]';

// Paket berbayar yang harganya bisa diatur. Urutan di sini = urutan kartu.
const PLAN_META = [
  { id: 'monthly', title: 'Premium Bulanan', note: 'Untuk 1 QR, aktif 30 hari.', icon: Calendar },
  { id: 'yearly', title: 'Premium Tahunan', note: 'Untuk 1 QR, aktif 365 hari.', icon: CalendarRange },
];

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '').slice(0, 9);
const toNumber = (value) => Number(digitsOnly(value)) || 0;
const groupDigits = (value) => {
  const d = digitsOnly(value);
  return d ? Number(d).toLocaleString('id-ID') : '';
};

// Kolom rupiah: angka dikelompokkan titik saat diketik, disimpan sebagai angka.
function MoneyInput({ id, value, onChange, ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-tertiary sm:text-[14px]">Rp</span>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        className={`${INPUT} pl-9 tabular-nums`}
        value={groupDigits(value)}
        onChange={(e) => onChange(toNumber(e.target.value))}
        {...props}
      />
    </div>
  );
}

// Masalah isian satu paket, untuk ditampilkan di kartunya dan menahan tombol Simpan.
function planProblem(plan) {
  if (plan.price < PRICE_MIN || plan.price > PRICE_MAX) return `Harga harus antara ${rupiah(PRICE_MIN)} dan ${rupiah(PRICE_MAX)}.`;
  const d = plan.discount;
  if (!d.enabled) return '';
  if (d.type === 'percent' && (d.value < 1 || d.value > PERCENT_MAX)) return `Diskon persen harus antara 1% dan ${PERCENT_MAX}%.`;
  if (d.type === 'amount' && (d.value < 1 || plan.price - d.value < PRICE_MIN)) return `Potongan terlalu besar. Harga setelah diskon minimal ${rupiah(PRICE_MIN)}.`;
  if (d.endsAt && d.endsAt < todayWib()) return 'Tanggal berakhir diskon sudah lewat.';
  return '';
}

function PlanCard({ meta, plan, onChange }) {
  const d = plan.discount;
  const setDiscount = (patch) => onChange({ ...plan, discount: { ...d, ...patch } });
  const cut = discountCut(plan.price, d);
  const finalPrice = plan.price - cut;
  const problem = planProblem(plan);
  const Icon = meta.icon;
  const preview = cut > 0 ? { type: d.type, value: d.value, amount: cut } : null;

  return (
    <section className={`rounded-2xl border bg-card transition-smooth ${d.enabled ? 'border-red-500/50' : 'border-border'}`}>
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold text-primary sm:text-[15px]">{meta.title}</h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-secondary sm:text-[13px]">{meta.note}</p>
        </div>
      </div>

      <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2 sm:p-5">
        <div>
          <label htmlFor={`price-${meta.id}`} className={LABEL}>Harga normal</label>
          <MoneyInput id={`price-${meta.id}`} value={plan.price} onChange={(price) => onChange({ ...plan, price })} required />
          <p className="mt-1 text-[11px] text-tertiary sm:text-[12px]">Harga sebelum diskon. Kode unik 1 sampai 99 ditambahkan saat transfer.</p>
        </div>

        {/* Harga yang nanti dilihat dan dibayar pengguna. */}
        <div className="rounded-xl bg-card-muted p-3 sm:p-4" aria-live="polite">
          <p className="text-[11px] font-medium uppercase tracking-wider text-tertiary">Dibayar pengguna</p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[22px] font-semibold tabular-nums leading-tight tracking-tight text-primary">{rupiah(finalPrice)}</span>
            {cut > 0 && <s className="text-[13px] tabular-nums text-tertiary">{rupiah(plan.price)}</s>}
          </div>
          {cut > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DiscountBadge discount={preview} />
              <span className="text-[12px] text-secondary">Potongan {rupiah(cut)}</span>
            </div>
          ) : (
            <p className="mt-1.5 text-[12px] text-secondary">Tanpa diskon.</p>
          )}
        </div>
      </div>

      <div className="border-t border-border p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Tag size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-secondary" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-primary sm:text-[14px]">Diskon</p>
              <p className="text-[12px] text-secondary">Harga yang dibayar otomatis terpotong.</p>
            </div>
          </div>
          <Switch
            size="md"
            tone="green"
            checked={d.enabled}
            onChange={(enabled) => setDiscount({ enabled })}
            label={`${d.enabled ? 'Matikan' : 'Nyalakan'} diskon ${meta.title}`}
          />
        </div>

        {d.enabled && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className={LABEL} id={`dtype-${meta.id}`}>Jenis diskon</p>
              <div role="radiogroup" aria-labelledby={`dtype-${meta.id}`} className="inline-flex gap-1 rounded-lg bg-card-muted p-1">
                {[
                  ['percent', 'Persen (%)'],
                  ['amount', 'Potongan rupiah'],
                ].map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={d.type === type}
                    onClick={() => setDiscount({ type, value: 0 })}
                    className={`h-8 rounded-md px-3 text-[12px] font-medium transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-[13px] ${
                      d.type === type ? 'bg-card text-primary shadow-tab dark:bg-zinc-700 dark:shadow-none' : 'text-secondary hover:text-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor={`dvalue-${meta.id}`} className={LABEL}>{d.type === 'percent' ? 'Besar diskon' : 'Besar potongan'}</label>
              {d.type === 'percent' ? (
                <div className="relative">
                  <input
                    id={`dvalue-${meta.id}`}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="10"
                    className={`${INPUT} pr-9 tabular-nums`}
                    value={d.value || ''}
                    onChange={(e) => setDiscount({ value: Math.min(100, toNumber(e.target.value)) })}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-tertiary sm:text-[14px]">%</span>
                </div>
              ) : (
                <MoneyInput id={`dvalue-${meta.id}`} placeholder="5.000" value={d.value || ''} onChange={(value) => setDiscount({ value })} />
              )}
              <p className="mt-1 text-[11px] text-tertiary sm:text-[12px]">
                {d.type === 'percent' ? `1 sampai ${PERCENT_MAX} persen.` : `Harga setelah potongan minimal ${rupiah(PRICE_MIN)}.`}
              </p>
            </div>

            <div>
              <label htmlFor={`dend-${meta.id}`} className={LABEL}>Berlaku sampai</label>
              <input
                id={`dend-${meta.id}`}
                type="date"
                min={todayWib()}
                className={INPUT}
                value={d.endsAt || ''}
                onChange={(e) => setDiscount({ endsAt: e.target.value || null })}
              />
              <p className="mt-1 flex items-center gap-1 text-[11px] text-tertiary sm:text-[12px]">
                <CalendarClock size={12} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
                {d.endsAt ? `Diskon berhenti setelah ${tanggalPanjang(d.endsAt)} (WIB).` : 'Kosongkan kalau diskon berlaku terus.'}
              </p>
            </div>
          </div>
        )}

        {problem && (
          <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-700 dark:text-red-400 sm:text-[13px]">{problem}</p>
        )}
      </div>
    </section>
  );
}

/**
 * Tab "Harga & diskon" di halaman Pengaturan: harga normal dan diskon tiap paket berbayar (Premium QR).
 * Perubahan berlaku untuk pesanan baru; pesanan yang sudah dibuat tetap memakai harganya sendiri.
 */
export default function PricingSettings() {
  const { addToast: toast } = useToast();
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError('');
    try {
      const { settings } = await adminFetchPricingSettings();
      setSaved(settings);
      setDraft(settings);
    } catch (err) {
      setError(err?.response?.data?.message || 'Harga paket tidak bisa dimuat. Coba muat ulang halaman.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changed = Boolean(draft && saved) && JSON.stringify(draft) !== JSON.stringify(saved);
  const invalid = Boolean(draft) && PLAN_META.some((meta) => planProblem(draft.plans[meta.id]));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { settings } = await adminSavePricingSettings(draft);
      setSaved(settings);
      setDraft(settings);
      toast({ type: 'success', title: 'Harga disimpan', message: 'Halaman paket dan pesanan baru langsung memakai harga ini.' });
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menyimpan', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-3xl rounded-2xl border border-border bg-card p-5">
        <p className="text-[13px] text-danger">{error}</p>
        <Button size="sm" variant="secondary" icon={RotateCcw} onClick={load} className="mt-3">Muat ulang</Button>
      </div>
    );
  }
  if (!draft) return <p className="max-w-3xl rounded-2xl border border-border bg-card p-5 text-[13px] text-tertiary">Memuat...</p>;

  return (
    <form onSubmit={save} className="max-w-3xl space-y-4 pb-24">
      <div>
        <h2 className="text-[14px] font-semibold text-primary sm:text-[15px]">Harga fitur berbayar</h2>
        <p className="mt-0.5 text-[12px] leading-relaxed text-secondary sm:text-[13px]">
          Atur harga Premium QR Code dan diskonnya. Berlaku untuk pesanan baru; pesanan yang sudah dibuat tetap memakai harga saat dipesan.
        </p>
      </div>

      {PLAN_META.map((meta) => (
        <PlanCard
          key={meta.id}
          meta={meta}
          plan={draft.plans[meta.id]}
          onChange={(plan) => setDraft((current) => ({ ...current, plans: { ...current.plans, [meta.id]: plan } }))}
        />
      ))}

      {/* Baris simpan menempel di bawah selama ada perubahan */}
      <div
        className={`sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 ${
          changed ? 'shadow-menu dark:shadow-menu-dark' : ''
        }`}
      >
        <p className="text-[12px] text-secondary sm:text-[13px]">
          {invalid ? 'Perbaiki isian yang ditandai merah dulu.' : changed ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan sudah tersimpan.'}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setDraft(saved)} disabled={!changed || saving}>Batalkan</Button>
          <Button size="sm" variant="primary" type="submit" icon={Save} disabled={!changed || saving || invalid}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>
    </form>
  );
}
