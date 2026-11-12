import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Landmark, MessageCircle, RotateCcw, Save, Tags, Wallet } from 'lucide-react';
import PanelLayout, { PanelCrumb } from '../../components/panel/PanelLayout';
import Button from '../../components/ui/Button';
import Switch from '../../components/ui/Switch';
import { useToast } from '../../components/ui/Toast';
import PricingSettings from '../../components/panel/PricingSettings';
import { adminFetchPaymentSettings, adminSavePaymentSettings } from '../../services/qrApi';

const INPUT =
  'ios-no-zoom h-10 w-full rounded-md border border-border bg-card px-3 text-[13px] text-primary placeholder:text-tertiary transition-smooth hover:border-border-hover focus:border-border-focus focus:outline-none disabled:cursor-not-allowed disabled:bg-card-muted disabled:text-tertiary sm:text-[14px]';

function Field({ id, label, hint, className = '', ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-medium text-secondary sm:text-[13px]">{label}</label>
      <input id={id} className={INPUT} {...props} />
      {hint && <p className="mt-1 text-[11px] text-tertiary sm:text-[12px]">{hint}</p>}
    </div>
  );
}

// Satu metode pembayaran: judul, sakelar nyala/mati, dan kolom datanya.
function MethodCard({ icon: Icon, title, description, enabled, onToggle, children }) {
  return (
    <section className={`rounded-2xl border bg-card transition-smooth ${enabled ? 'border-emerald-500/60' : 'border-border'}`}>
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${enabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-card-muted text-tertiary'}`}>
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[14px] font-semibold text-primary sm:text-[15px]">{title}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                enabled ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-card-muted text-tertiary'
              }`}
            >
              {enabled ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-secondary sm:text-[13px]">{description}</p>
        </div>
        <Switch
          size="md"
          tone="green"
          checked={enabled}
          onChange={onToggle}
          label={`${enabled ? 'Matikan' : 'Nyalakan'} ${title}`}
          title={enabled ? 'Klik untuk mematikan' : 'Klik untuk menyalakan'}
        />
      </div>
      <div className={`grid gap-3 border-t border-border p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 ${enabled ? '' : 'opacity-60'}`}>{children}</div>
    </section>
  );
}

// Tab di halaman Pengaturan. Tab yang aktif disimpan di alamat (?tab=harga) supaya bisa dibuka langsung.
const TABS = [
  { id: 'pembayaran', label: 'Metode pembayaran', icon: Wallet, intro: 'Atur metode pembayaran yang tampil saat pengguna memesan paket Premium.' },
  { id: 'harga', label: 'Harga & diskon', icon: Tags, intro: 'Atur harga tiap fitur berbayar dan diskon yang memotong harganya.' },
];

// Pengaturan super admin, dibagi dua tab: metode pembayaran, serta harga dan diskon paket berbayar.
export default function AdminSettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.id === params.get('tab')) || TABS[0];
  const pick = (id) => setParams(id === TABS[0].id ? {} : { tab: id }, { replace: true });

  return (
    <PanelLayout title="Pengaturan">
      <div className="mb-4 sm:mb-5">
        <h1 className="text-[20px] font-semibold text-primary sm:text-[24px]">Pengaturan</h1>
        <PanelCrumb />
        <p className="mt-1 text-[13px] text-secondary sm:text-[14px]">{tab.intro}</p>
      </div>

      <div className="mb-5 overflow-x-auto [scrollbar-width:none] sm:mb-6 [&::-webkit-scrollbar]:hidden">
        <div role="tablist" aria-label="Bagian pengaturan" className="inline-flex gap-1 rounded-lg bg-card-muted p-1">
          {TABS.map((t) => {
            const active = t.id === tab.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={active}
                aria-controls={`panel-${t.id}`}
                onClick={() => pick(t.id)}
                className={`flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3.5 text-[13px] font-medium transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  active ? 'bg-card text-primary shadow-tab dark:bg-zinc-700 dark:shadow-none' : 'text-secondary hover:text-primary'
                }`}
              >
                <t.icon size={15} strokeWidth={1.75} aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`}>
        {tab.id === 'harga' ? <PricingSettings /> : <PaymentSettings />}
      </div>
    </PanelLayout>
  );
}

// Tab "Metode pembayaran": DANA dan transfer bank, masing-masing bisa dinyalakan atau dimatikan.
function PaymentSettings() {
  const { addToast: toast } = useToast();
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError('');
    try {
      const settings = await adminFetchPaymentSettings();
      setSaved(settings);
      setDraft(settings);
    } catch (err) {
      setError(err?.response?.data?.message || 'Pengaturan tidak bisa dimuat. Coba muat ulang halaman.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setDana = (patch) => setDraft((d) => ({ ...d, dana: { ...d.dana, ...patch } }));
  const setBank = (patch) => setDraft((d) => ({ ...d, bank: { ...d.bank, ...patch } }));

  const changed = Boolean(draft && saved) && JSON.stringify(draft) !== JSON.stringify(saved);
  const noneActive = Boolean(draft) && !draft.dana.enabled && !draft.bank.enabled;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const settings = await adminSavePaymentSettings(draft);
      setSaved(settings);
      setDraft(settings);
      toast({ type: 'success', title: 'Pengaturan disimpan', message: 'Halaman pembayaran pengguna langsung memakai pengaturan ini.' });
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menyimpan', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {error ? (
        <div className="max-w-3xl rounded-2xl border border-border bg-card p-5">
          <p className="text-[13px] text-danger">{error}</p>
          <Button size="sm" variant="secondary" icon={RotateCcw} onClick={load} className="mt-3">Muat ulang</Button>
        </div>
      ) : !draft ? (
        <p className="max-w-3xl rounded-2xl border border-border bg-card p-5 text-[13px] text-tertiary">Memuat...</p>
      ) : (
        <form onSubmit={save} className="max-w-3xl space-y-4 pb-24">
          <div>
            <h2 className="text-[14px] font-semibold text-primary sm:text-[15px]">Metode pembayaran</h2>
            <p className="mt-0.5 text-[12px] text-secondary sm:text-[13px]">
              Metode yang aktif muncul sebagai pilihan di halaman pembayaran pengguna. Minimal satu harus aktif.
            </p>
          </div>

          <MethodCard
            icon={Wallet}
            title="DANA"
            description="Pengguna transfer ke nomor DANA ini."
            enabled={draft.dana.enabled}
            onToggle={(next) => setDana({ enabled: next })}
          >
            <Field
              id="dana-number"
              label="Nomor DANA"
              inputMode="numeric"
              autoComplete="off"
              placeholder="085188009152"
              maxLength={20}
              required={draft.dana.enabled}
              value={draft.dana.number}
              onChange={(e) => setDana({ number: e.target.value })}
            />
            <Field
              id="dana-name"
              label="Nama pemilik akun"
              autoComplete="off"
              placeholder="Nama yang tampil di DANA"
              hint="Boleh kosong. Membantu pengguna memastikan tujuan transfernya benar."
              maxLength={120}
              value={draft.dana.name}
              onChange={(e) => setDana({ name: e.target.value })}
            />
          </MethodCard>

          <MethodCard
            icon={Landmark}
            title="Transfer bank"
            description="Pengguna transfer ke rekening bank ini."
            enabled={draft.bank.enabled}
            onToggle={(next) => setBank({ enabled: next })}
          >
            <Field
              id="bank-name"
              label="Nama bank"
              autoComplete="off"
              placeholder="Contoh: BCA"
              maxLength={60}
              required={draft.bank.enabled}
              value={draft.bank.bankName}
              onChange={(e) => setBank({ bankName: e.target.value })}
            />
            <Field
              id="bank-number"
              label="Nomor rekening"
              inputMode="numeric"
              autoComplete="off"
              placeholder="1234567890"
              maxLength={30}
              required={draft.bank.enabled}
              value={draft.bank.accountNumber}
              onChange={(e) => setBank({ accountNumber: e.target.value })}
            />
            <Field
              id="bank-holder"
              label="Nama pemilik rekening"
              autoComplete="off"
              placeholder="Nama sesuai buku tabungan"
              maxLength={120}
              required={draft.bank.enabled}
              className="sm:col-span-2"
              value={draft.bank.accountName}
              onChange={(e) => setBank({ accountName: e.target.value })}
            />
          </MethodCard>

          {noneActive && (
            <p className="rounded-md bg-red-500/10 px-3 py-2.5 text-[12px] text-red-700 dark:text-red-400 sm:text-[13px]">
              Semua metode dimatikan. Nyalakan minimal satu, supaya pengguna bisa membayar pesanannya.
            </p>
          )}

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card-muted text-secondary">
                <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[14px] font-semibold text-primary sm:text-[15px]">WhatsApp konfirmasi</h2>
                <p className="mt-0.5 text-[12px] leading-relaxed text-secondary sm:text-[13px]">
                  Nomor tujuan tombol "Konfirmasi via WhatsApp" di halaman pembayaran.
                </p>
              </div>
            </div>
            <Field
              id="pay-whatsapp"
              label="Nomor WhatsApp"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="085188009152"
              maxLength={20}
              required
              className="mt-4 sm:max-w-xs"
              value={draft.whatsapp}
              onChange={(e) => setDraft((d) => ({ ...d, whatsapp: e.target.value }))}
            />
          </section>

          {/* Baris simpan menempel di bawah selama ada perubahan */}
          <div
            className={`sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 ${
              changed ? 'shadow-menu dark:shadow-menu-dark' : ''
            }`}
          >
            <p className="text-[12px] text-secondary sm:text-[13px]">
              {changed ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan sudah tersimpan.'}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setDraft(saved)} disabled={!changed || saving}>Batalkan</Button>
              <Button size="sm" variant="primary" type="submit" icon={Save} disabled={!changed || saving || noneActive}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
