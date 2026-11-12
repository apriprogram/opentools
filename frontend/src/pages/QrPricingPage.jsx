import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Check, QrCode, ArrowLeft } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { fetchQrPlans } from '../services/qrApi';
import PlanPrice, { DiscountBadge } from '../components/ui/PlanPrice';

const FREE_FEATURES = ['QR Code tanpa batas jumlah', 'Warna QR dan latar bisa dipilih', 'Logo di tengah (wajib)', 'Unduh PNG & SVG'];
const PAID_FEATURES = ['Semua fitur gratis', 'Logo bisa dihilangkan', 'Warna dan link bisa diganti kapan saja', 'Untuk satu QR code'];

// Warna tiap paket berbayar: garis tepi kartu dan tanda centangnya. Bulanan biru, Tahunan emas.
const PLAN_TONE = {
  monthly: { card: 'plan-outline-blue', check: 'text-blue-500' },
  yearly: { card: 'plan-outline-gold', check: 'text-[#B8912A] dark:text-[#E9C35A]' },
};

// Halaman harga hanya menampilkan paket. Pemesanan, pembayaran, dan bukti dilakukan di dashboard akun.
export default function QrPricingPage() {
  const { addToast: toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchQrPlans()
      .then((res) => setPlans(res.plans || []))
      .catch(() => toast({ type: 'error', title: 'Gagal memuat paket', message: 'Coba muat ulang halaman.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pengguna yang sudah masuk tidak dikembalikan ke halaman umum: langsung ke panel.
  if (!loading && user) {
    return <Navigate to={user.role === 'superadmin' ? '/admin' : '/dashboard/qr'} replace />;
  }

  // Label "Hemat" di paket tahunan hanya kalau memang lebih murah dari 12 kali paket bulanan (bisa berubah karena diskon).
  const monthly = plans.find((p) => p.id === 'monthly');
  const yearlySaves = (p) => p.id === 'yearly' && Boolean(monthly) && monthly.price * 12 > p.price;

  // Paket berbayar: tamu diarahkan mendaftar, pengguna langsung ke pemesanan di dashboard.
  const choose = (planId) => {
    if (!user) {
      navigate(`/daftar?paket=${planId}`);
      return;
    }
    if (user.role === 'superadmin') {
      toast({ type: 'info', title: 'Akun admin', message: 'Pemesanan paket dilakukan dari akun pengguna.' });
      return;
    }
    navigate(`/dashboard/qr?paket=${planId}`);
  };

  return (
    <PageContainer>
      <section className="mx-auto max-w-5xl pt-4">
        <Link to="/qr" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-secondary transition-colors hover:text-primary">
          <ArrowLeft size={14} /> Kembali ke QR Generator
        </Link>

        <div className="mb-6">
          <h1 className="text-[24px] font-semibold leading-[32px] tracking-tight text-primary sm:text-[28px]">Paket QR Generator</h1>
          <p className="mt-1 text-[14px] leading-[22px] text-secondary">
            Daftar akun, pilih paket, lalu bayar lewat transfer (DANA atau rekening bank). Bukti transfer diunggah di dashboard, dan lisensi aktif otomatis jika bukti valid.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-[15px] font-semibold text-primary">Gratis</h2>
            <p className="text-[26px] font-semibold leading-[30px] text-primary">
              Rp0 <span className="text-[13px] font-normal text-secondary">selamanya</span>
            </p>
            <ul className="mt-4 flex-1 space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-secondary">
                  <Check size={15} strokeWidth={2} className="mt-[2px] shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/qr" className="mt-5">
              <Button variant="secondary" className="w-full"><QrCode size={15} /> Mulai gratis</Button>
            </Link>
          </div>

          {plans.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col rounded-2xl border border-border bg-card p-5 ${PLAN_TONE[p.id]?.card || ''}`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-primary">{p.label}</h2>
                {p.discount ? (
                  <DiscountBadge discount={p.discount} />
                ) : (
                  yearlySaves(p) && <span className="premium-gold rounded-full border px-2 py-0.5 text-[11px] font-semibold">Hemat</span>
                )}
              </div>
              <PlanPrice plan={p} period={p.id === 'monthly' ? '/ bulan' : '/ tahun'} className="text-primary" />
              {p.note && <p className="mt-1 text-[12px] text-secondary">{p.note}</p>}
              <ul className="mt-4 flex-1 space-y-2">
                {PAID_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-secondary">
                    <Check size={15} strokeWidth={2} className={`mt-[2px] shrink-0 ${PLAN_TONE[p.id]?.check || 'text-primary'}`} /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="primary" className="mt-5 w-full" onClick={() => choose(p.id)}>
                Pilih {p.label}
              </Button>
            </div>
          ))}
        </div>

        {!user && (
          <p className="mt-6 text-[13px] text-secondary">
            Sudah punya akun? <Link to="/masuk" className="underline hover:text-primary">Masuk</Link>.
          </p>
        )}
      </section>
    </PageContainer>
  );
}
