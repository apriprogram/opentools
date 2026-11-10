import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, CheckCheck, QrCode, Crown, Search, MessageCircle, ArrowLeft, Upload } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { fetchQrPlans, createQrOrder, lookupQrOrder, uploadQrProof, storeLicenseKey } from '../services/qrApi';

const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const FREE_FEATURES = ['QR Code tanpa batas jumlah', 'Logo OpenTools di tengah', 'Warna hitam-putih', 'Unduh PNG & SVG'];
const PAID_FEATURES = ['Semua fitur gratis', 'Ganti warna QR dan latar', 'Logo bisa dihilangkan', 'Berlaku sesuai masa paket'];
const MAX_PROOF_BYTES = 4 * 1024 * 1024;
const PROOF_NOTICE = {
  checking: 'Bukti sedang diperiksa...',
  review: 'Bukti sudah diterima dan menunggu pemeriksaan admin.',
  rejected: 'Bukti belum bisa diterima.',
};

export default function QrPricingPage() {
  const { addToast: toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [payment, setPayment] = useState(null);
  const [selected, setSelected] = useState(null); // 'monthly' | 'yearly'
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  const [lookup, setLookup] = useState({ code: '', email: '' });
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    fetchQrPlans()
      .then((res) => {
        setPlans(res.plans || []);
        setPayment(res.payment || null);
      })
      .catch(() => toast({ type: 'error', title: 'Gagal memuat paket', message: 'Coba muat ulang halaman.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPlan = plans.find((p) => p.id === selected);

  const createOrder = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const res = await createQrOrder({
        plan: selectedPlan.id,
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp,
      });
      setOrder(res.order);
      if (res.payment) setPayment(res.payment);
      setLookup({ code: res.order.code, email: form.email });
    } catch (err) {
      toast({ type: 'error', title: 'Pesanan gagal', message: err?.response?.data?.message || 'Periksa data Anda lalu coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  const applyOrderUpdate = (updated) => {
    setOrder(updated);
    if (updated.status === 'paid' && updated.licenseKey) storeLicenseKey(updated.licenseKey);
  };

  const applyLookupUpdate = (updated) => {
    setLookupResult({ ok: true, order: updated });
    if (updated.status === 'paid' && updated.licenseKey) storeLicenseKey(updated.licenseKey);
  };

  const copyNumber = () => {
    if (!payment?.number) return;
    navigator.clipboard?.writeText(payment.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkStatus = async (e) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const res = await lookupQrOrder({ code: lookup.code.trim(), email: lookup.email.trim() });
      applyLookupUpdate(res.order);
    } catch (err) {
      setLookupResult({ ok: false, message: err?.response?.data?.message || 'Pesanan tidak ditemukan.' });
    } finally {
      setLookupLoading(false);
    }
  };

  const whatsappLink = order && payment
    ? `https://wa.me/${payment.whatsapp}?text=${encodeURIComponent(
        `Halo, saya sudah transfer untuk pesanan QR Generator ${order.code} (${order.planLabel}) sebesar ${rupiah(order.amount)}. Mohon dicek. Terima kasih.`
      )}`
    : '#';

  return (
    <PageContainer>
      <section className="max-w-5xl mx-auto pt-4">
        <Link to="/qr" className="inline-flex items-center gap-1.5 text-[13px] text-secondary hover:text-primary transition-colors mb-4">
          <ArrowLeft size={14} /> Kembali ke QR Generator
        </Link>

        <div className="mb-6">
          <h1 className="text-[24px] sm:text-[28px] font-semibold text-primary tracking-tight leading-[32px]">Paket QR Generator</h1>
          <p className="text-[14px] text-secondary leading-[22px] mt-1">
            Pembayaran via transfer DANA. Unggah bukti transfer, lalu lisensi aktif otomatis jika bukti valid.
          </p>
        </div>

        {/* Kartu paket */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlanCard
            title="Gratis"
            price="Rp0"
            period="selamanya"
            features={FREE_FEATURES}
            cta={null}
          />
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              title={p.label}
              price={rupiah(p.price)}
              period={p.id === 'monthly' ? '/ bulan' : '/ tahun'}
              note={p.note}
              highlight={p.id === 'yearly'}
              features={PAID_FEATURES}
              active={selected === p.id}
              onSelect={() => { setSelected(p.id); setOrder(null); }}
            />
          ))}
        </div>

        {/* Form pesanan */}
        {selectedPlan && !order && (
          <form onSubmit={createOrder} className="mt-6 rounded-2xl border border-border bg-card p-5 max-w-xl">
            <h2 className="text-[15px] font-semibold text-primary mb-1">Pesan paket {selectedPlan.label}</h2>
            <p className="text-[13px] text-secondary mb-4">Isi data Anda untuk mendapatkan nomor pesanan dan instruksi transfer.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                minLength={2}
                placeholder="Nama lengkap"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-[40px] px-3 rounded-md border border-border bg-card text-primary text-[14px] placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth"
              />
              <input
                type="email"
                required
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-[40px] px-3 rounded-md border border-border bg-card text-primary text-[14px] placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth"
              />
              <input
                type="tel"
                required
                inputMode="tel"
                placeholder="Nomor WhatsApp (08xxxx)"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="h-[40px] px-3 rounded-md border border-border bg-card text-primary text-[14px] placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth"
              />
            </div>
            <p className="text-[12px] text-tertiary mt-2">Nomor WhatsApp dipakai admin untuk mengirim kode lisensi dan menghubungi Anda.</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[13px] text-secondary">Total {selectedPlan.label}: <span className="text-primary font-semibold">{rupiah(selectedPlan.price)}</span> + kode unik</p>
              <Button type="submit" variant="primary" disabled={submitting} icon={Crown}>
                {submitting ? 'Membuat pesanan...' : 'Buat pesanan'}
              </Button>
            </div>
          </form>
        )}

        {/* Instruksi transfer dan unggah bukti */}
        {order && payment && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 max-w-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-[15px] font-semibold text-primary">
                {order.status === 'paid' ? 'Pembayaran terverifikasi' : 'Instruksi pembayaran'}
              </h2>
              <span className="text-[12px] font-medium text-secondary border border-border rounded-full px-2.5 py-1">
                {order.status === 'paid' ? 'Lunas' : 'Menunggu pembayaran'}
              </span>
            </div>

            {order.status === 'paid' ? (
              <LicenseBox order={order} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl border border-border bg-card-muted p-4">
                    <p className="text-[12px] text-secondary">Kode pesanan</p>
                    <p className="text-[18px] font-semibold text-primary tracking-wider">{order.code}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card-muted p-4">
                    <p className="text-[12px] text-secondary">Jumlah yang ditransfer</p>
                    <p className="text-[18px] font-semibold text-primary">{rupiah(order.amount)}</p>
                    <p className="text-[12px] text-tertiary">Harus tepat sampai digit terakhir</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4 mb-4">
                  <p className="text-[12px] text-secondary">{payment.method}</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-[18px] font-semibold text-primary tracking-wide">{payment.number}</p>
                    <Button variant="secondary" size="sm" icon={copied ? CheckCheck : Copy} onClick={copyNumber}>
                      {copied ? 'Disalin' : 'Salin'}
                    </Button>
                  </div>
                  {payment.name && <p className="text-[13px] text-secondary mt-1">a.n. {payment.name}</p>}
                </div>

                <ol className="text-[13px] text-secondary space-y-1.5 list-decimal pl-5 mb-4">
                  <li>Transfer tepat <span className="text-primary font-medium">{rupiah(order.amount)}</span> ke nomor di atas.</li>
                  <li>Unggah screenshot atau struk bukti transfer di bawah. Jika nominal, tujuan, dan waktu cocok, lisensi langsung aktif.</li>
                  <li>Jika belum aktif, kirim bukti ke WhatsApp dengan kode pesanan <span className="text-primary font-medium">{order.code}</span>.</li>
                </ol>

                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <Button variant="secondary" icon={MessageCircle}>Konfirmasi via WhatsApp</Button>
                </a>

                <ProofSection order={order} onUpdated={applyOrderUpdate} />
              </>
            )}
          </div>
        )}

        {/* Cek status */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 max-w-xl">
          <h2 className="text-[15px] font-semibold text-primary mb-1">Cek status pesanan</h2>
          <p className="text-[13px] text-secondary mb-4">Masukkan kode pesanan dan email yang dipakai saat memesan.</p>
          <form onSubmit={checkStatus} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
            <input
              type="text"
              required
              placeholder="Kode pesanan (OT...)"
              value={lookup.code}
              onChange={(e) => setLookup({ ...lookup, code: e.target.value })}
              className="h-[40px] px-3 rounded-md border border-border bg-card text-primary text-[14px] uppercase placeholder:normal-case placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth"
            />
            <input
              type="email"
              required
              placeholder="Email"
              value={lookup.email}
              onChange={(e) => setLookup({ ...lookup, email: e.target.value })}
              className="h-[40px] px-3 rounded-md border border-border bg-card text-primary text-[14px] placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth"
            />
            <Button type="submit" variant="secondary" icon={Search} disabled={lookupLoading}>
              {lookupLoading ? 'Mengecek...' : 'Cek'}
            </Button>
          </form>

          {lookupResult && !lookupResult.ok && (
            <p className="text-[13px] text-danger mt-3">{lookupResult.message}</p>
          )}

          {lookupResult?.ok && <LookupResult order={lookupResult.order} onUpdated={applyLookupUpdate} />}
        </div>
      </section>
    </PageContainer>
  );
}

function PlanCard({ title, price, period, note, features, highlight, active, onSelect, cta = true }) {
  return (
    <div
      className={`rounded-2xl border bg-card p-5 flex flex-col transition-smooth ${
        active ? 'border-blue-500' : highlight ? 'border-primary/40' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-primary">{title}</h2>
        {highlight && (
          <span className="text-[11px] font-medium text-primary border border-border rounded-full px-2 py-0.5">Hemat</span>
        )}
      </div>
      <p className="text-[26px] font-semibold text-primary leading-[30px]">
        {price} <span className="text-[13px] font-normal text-secondary">{period}</span>
      </p>
      {note && <p className="text-[12px] text-secondary mt-1">{note}</p>}
      <ul className="mt-4 space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px] text-secondary">
            <Check size={15} strokeWidth={2} className="mt-[2px] shrink-0 text-primary" /> {f}
          </li>
        ))}
      </ul>
      {cta && onSelect ? (
        <Button variant={active ? 'secondary' : 'primary'} className="w-full mt-5" onClick={onSelect}>
          {active ? 'Dipilih' : `Pilih ${title}`}
        </Button>
      ) : (
        <Link to="/qr" className="mt-5">
          <Button variant="secondary" className="w-full"><QrCode size={15} /> Mulai gratis</Button>
        </Link>
      )}
    </div>
  );
}

function LicenseBox({ order }) {
  const [copied, setCopied] = useState(false);
  const copyKey = () => {
    navigator.clipboard?.writeText(order.licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card-muted p-4">
      <p className="text-[13px] text-secondary">Pesanan {order.code} ({order.planLabel}) sudah lunas.</p>
      <p className="text-[12px] text-secondary mt-3">Kode lisensi Anda</p>
      <div className="flex items-center justify-between gap-2 mt-1">
        <p className="text-[16px] font-semibold text-primary tracking-wider break-all">{order.licenseKey}</p>
        <Button variant="secondary" size="sm" icon={copied ? CheckCheck : Copy} onClick={copyKey}>
          {copied ? 'Disalin' : 'Salin'}
        </Button>
      </div>
      <p className="text-[12px] text-tertiary mt-3">
        Masukkan kode ini di <Link to="/qr" className="underline hover:text-primary">QR Generator</Link>.
      </p>
    </div>
  );
}

// Unggah bukti transfer. Hasil analisa langsung tampil; jika lolos, lisensi aktif tanpa menunggu admin.
function ProofSection({ order, onUpdated }) {
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
      <p className="text-[12px] text-secondary mt-1 mb-3">
        Nominal harus tepat {rupiah(order.amount)}. Jika bukti asli dan nominal, tujuan, serta waktunya cocok, lisensi langsung aktif.
      </p>

      {order.verifyStatus !== 'none' && notice && (
        <div className="mb-3 rounded-lg border border-border bg-card-muted p-3">
          <p className="text-[13px] font-medium text-primary">{notice}</p>
          {order.verifyNote && <p className="text-[12px] text-secondary mt-1">{order.verifyNote}</p>}
        </div>
      )}

      <input
        key={inputKey}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={pick}
        disabled={attemptsLeft <= 0 || busy}
        className="block w-full text-[13px] text-secondary file:mr-3 file:h-[36px] file:px-3 file:rounded-md file:border file:border-border file:bg-card file:text-primary file:text-[13px]"
      />

      {preview && (
        <img src={preview} alt="Pratinjau bukti transfer" className="mt-3 max-h-[220px] rounded-lg border border-border" />
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[12px] text-tertiary">Sisa unggahan: {attemptsLeft}</p>
        <Button variant="primary" icon={Upload} disabled={!file || busy || attemptsLeft <= 0} onClick={submit}>
          {busy ? 'Memeriksa bukti...' : 'Unggah & periksa'}
        </Button>
      </div>
      {attemptsLeft <= 0 && (
        <p className="text-[12px] text-danger mt-2">Batas unggahan tercapai. Hubungi admin lewat WhatsApp.</p>
      )}
    </div>
  );
}

function LookupResult({ order, onUpdated }) {
  if (order.status === 'paid') {
    return (
      <div className="mt-4">
        <LicenseBox order={order} />
      </div>
    );
  }

  if (order.status === 'cancelled') {
    return <p className="text-[13px] text-secondary mt-4">Pesanan {order.code} dibatalkan. Silakan buat pesanan baru.</p>;
  }

  return (
    <div className="mt-4">
      <p className="text-[13px] text-secondary">
        Pesanan {order.code} ({order.planLabel}) masih menunggu pembayaran atau konfirmasi. Total: {rupiah(order.amount)}.
      </p>
      <ProofSection order={order} onUpdated={onUpdated} />
    </div>
  );
}
