import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, QrCode } from 'lucide-react';
import PanelLayout from '../../components/panel/PanelLayout';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { loadLogoDataUrl, downloadBlob } from '../../lib/qrCode';
import { fetchQrPlans, createQrOrder } from '../../services/qrApi';
import { fetchMyQr, fetchMyOrders, fetchMyLicenses, fetchMyNotaPdf, updateMyWhatsapp } from '../../services/authApi';
import QrGeneratorPage from '../QrGeneratorPage';
import QrCardList from '../../components/panel/QrCardList';
import OrderTable from '../../components/panel/OrderTable';
import PlanPicker from '../../components/panel/PlanPicker';
import PaymentInstruction from '../../components/panel/PaymentInstruction';
import ProofModal from '../../components/panel/ProofModal';
import NotaModal from '../../components/panel/NotaModal';
import { proofDetails } from '../../components/panel/OrderParts';

const TITLE = { daftar: 'QR Generator', pilih: 'Buat QR baru', bayar: 'Pembayaran' };
const SUBTITLE = {
  daftar: 'Daftar QR, pesanan, dan lisensi Anda dalam satu menu.',
  pilih: 'Paket gratis langsung bisa dipakai. Paket Premium Gold dibayar lewat transfer DANA, lalu aktif setelah bukti diverifikasi.',
  bayar: 'Transfer sesuai nominal, lalu unggah bukti. Pesanan yang lunas tampil di tabel pesanan.',
};

// Satu menu QR Generator: daftar QR, buat QR baru (pilih paket), pembayaran, dan generator.
// Tampilan ditentukan dari URL: ?view=pilih, ?view=buat, atau ?kode=KODE. Tanpa parameter berarti daftar QR.
export default function UserQrPage() {
  const { addToast: toast } = useToast();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kode = params.get('kode');
  const paket = params.get('paket');
  const rawView = params.get('view');
  const view = kode ? 'bayar' : ['pilih', 'buat'].includes(rawView) ? rawView : paket ? 'pilih' : 'daftar';

  const [plans, setPlans] = useState([]);
  const [payment, setPayment] = useState(null);
  const [qrList, setQrList] = useState(null);
  const [orders, setOrders] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [logoUrl, setLogoUrl] = useState(null);
  const [busyPlan, setBusyPlan] = useState('');
  const [waForPlan, setWaForPlan] = useState(null); // paket yang menunggu nomor WhatsApp (akun lama)
  const [waInput, setWaInput] = useState('');
  const [proofCode, setProofCode] = useState(null);
  const [notaCode, setNotaCode] = useState(null);
  const autoRef = useRef(false);

  const loadAll = () =>
    Promise.all([fetchMyQr(), fetchMyOrders(), fetchMyLicenses()])
      .then(([q, o, l]) => {
        setQrList(q);
        setOrders(o);
        setLicenses(l);
      })
      .catch(() => toast({ type: 'error', title: 'Gagal memuat', message: 'Data akun tidak bisa dimuat.' }));

  useEffect(() => {
    fetchQrPlans()
      .then((res) => {
        setPlans(res.plans || []);
        setPayment(res.payment || null);
      })
      .catch(() => toast({ type: 'error', title: 'Gagal memuat paket', message: 'Coba muat ulang halaman.' }));
    loadLogoDataUrl().then(setLogoUrl).catch(() => setLogoUrl(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Data dimuat ulang setiap pindah tampilan, supaya QR dan pesanan baru langsung terlihat.
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const order = useMemo(() => (orders || []).find((o) => o.code === kode) || null, [orders, kode]);
  const pendingOrders = (orders || []).filter((o) => o.status === 'pending');
  const expiryByKey = useMemo(
    () => Object.fromEntries((licenses || []).map((l) => [l.licenseKey, l.expiresAt])),
    [licenses]
  );
  const autoPlan = !kode && paket ? plans.find((p) => p.id === paket) || null : null;
  const unknownPlan = !kode && Boolean(paket) && plans.length > 0 && !autoPlan;

  const createOrderFor = async (planId, whatsapp, { replace = false } = {}) => {
    setBusyPlan(planId);
    try {
      const res = await createQrOrder({ plan: planId, name: user.name, email: user.email, whatsapp });
      toast({ type: 'success', title: 'Pesanan dibuat', message: `Kode ${res.order.code}. Silakan lakukan pembayaran.` });
      await loadAll();
      navigate(`/dashboard/qr?kode=${res.order.code}`, { replace });
    } catch (err) {
      toast({ type: 'error', title: 'Pesanan gagal', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setBusyPlan('');
    }
  };

  // Pilih paket: pakai pesanan yang masih menunggu untuk paket yang sama, atau buat pesanan baru.
  const choosePlan = (planId, opts = {}) => {
    const existing = (orders || []).find((o) => o.status === 'pending' && o.plan === planId);
    if (existing) {
      navigate(`/dashboard/qr?kode=${existing.code}`, { replace: Boolean(opts.replace) });
      return;
    }
    if (!user?.whatsapp) {
      setWaForPlan(planId);
      return;
    }
    createOrderFor(planId, user.whatsapp, opts);
  };

  // Dari halaman harga (?paket=...): buat pesanan sekali, tanpa form.
  useEffect(() => {
    if (!paket || kode || orders === null || autoRef.current) return;
    if (!plans.some((p) => p.id === paket)) return;
    autoRef.current = true;
    choosePlan(paket, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paket, kode, orders, plans]);

  // Akun lama yang belum punya nomor WhatsApp: diminta sekali, lalu disimpan ke akun.
  const saveWhatsapp = async (e) => {
    e.preventDefault();
    const planId = waForPlan;
    setBusyPlan('wa');
    try {
      const next = await updateMyWhatsapp(waInput.trim());
      updateUser(next);
      setWaForPlan(null);
      setBusyPlan('');
      await createOrderFor(planId, next.whatsapp);
    } catch (err) {
      toast({ type: 'error', title: 'Nomor tidak valid', message: err?.response?.data?.message || 'Periksa nomor WhatsApp Anda.' });
      setBusyPlan('');
    }
  };

  const applyUpdate = (updated) => {
    setOrders((list) => (list || []).map((o) => (o.code === updated.code ? { ...o, ...updated } : o)));
    loadAll();
  };

  const downloadNotaPdf = async (code) => {
    try {
      const blob = await fetchMyNotaPdf(code);
      downloadBlob(blob, `nota-${code}.pdf`);
    } catch {
      toast({ type: 'error', title: 'Gagal mengunduh', message: 'PDF nota tidak bisa dibuat.' });
    }
  };

  const headerTitle = view === 'bayar' && order ? `Pesanan ${order.code}` : TITLE[view] || TITLE.daftar;

  return (
    <PanelLayout title="QR Generator">
      {view !== 'buat' && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[24px] font-semibold text-primary">{headerTitle}</h1>
            <p className="mt-1 max-w-2xl text-[14px] text-secondary">{SUBTITLE[view] || SUBTITLE.daftar}</p>
          </div>
          {view === 'daftar' ? (
            <Button variant="primary" icon={QrCode} onClick={() => navigate('/dashboard/qr?view=pilih')}>
              Buat QR baru
            </Button>
          ) : (
            <Link to="/dashboard/qr">
              <Button variant="ghost" icon={ArrowLeft} className="whitespace-nowrap">Kembali ke daftar</Button>
            </Link>
          )}
        </div>
      )}

      {view === 'daftar' && (
        <>
          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-primary">Daftar QR Anda</h2>
            {!qrList ? (
              <p className="text-[13px] text-tertiary">Memuat...</p>
            ) : qrList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <p className="text-[14px] text-primary">Belum ada QR tersimpan.</p>
                <p className="mt-1 text-[13px] text-secondary">
                  Buat QR pertama Anda. Gratis, atau pilih Premium Gold untuk warna sendiri dan tanpa logo.
                </p>
                <Button variant="primary" icon={QrCode} className="mt-4" onClick={() => navigate('/dashboard/qr?view=pilih')}>
                  Buat QR baru
                </Button>
              </div>
            ) : (
              <QrCardList items={qrList} logoUrl={logoUrl} onChanged={loadAll} />
            )}
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-[15px] font-semibold text-primary">Pesanan dan lisensi</h2>
            <OrderTable
              orders={orders}
              expiryByKey={expiryByKey}
              onProof={setProofCode}
              onNota={setNotaCode}
              onPdf={downloadNotaPdf}
            />
          </section>
        </>
      )}

      {view === 'pilih' && (
        <PlanPicker
          plans={plans}
          busyPlan={busyPlan}
          autoPlan={autoPlan}
          unknownPlan={unknownPlan}
          pendingOrders={pendingOrders}
          onFree={() => navigate('/dashboard/qr?view=buat')}
          onPaid={(planId) => choosePlan(planId)}
          waForPlan={waForPlan}
          waInput={waInput}
          onWaInput={setWaInput}
          onSaveWhatsapp={saveWhatsapp}
        />
      )}

      {view === 'buat' && (
        <div>
          <Link to="/dashboard/qr" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-secondary hover:text-primary">
            <ArrowLeft size={14} /> Kembali ke daftar QR
          </Link>
          <QrGeneratorPage embedded />
        </div>
      )}

      {view === 'bayar' && (
        <div className="max-w-2xl">
          {!orders ? (
            <p className="text-[13px] text-tertiary">Memuat...</p>
          ) : !order ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-[14px] text-primary">Pesanan {kode} tidak ditemukan di akun Anda.</p>
            </div>
          ) : (
            <PaymentInstruction
              order={order}
              payment={payment}
              expiresAt={expiryByKey[order.licenseKey] || null}
              onUpdated={applyUpdate}
              onProof={setProofCode}
            />
          )}
        </div>
      )}

      {notaCode && <NotaModal code={notaCode} onClose={() => setNotaCode(null)} />}
      {proofCode && (
        <ProofModal
          code={proofCode}
          details={proofDetails((orders || []).find((o) => o.code === proofCode))}
          onClose={() => setProofCode(null)}
        />
      )}
    </PanelLayout>
  );
}
