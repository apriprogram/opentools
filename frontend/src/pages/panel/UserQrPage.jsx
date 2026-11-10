import React, { useEffect, useMemo, useState } from 'react';
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
import PlanPicker, { WhatsappStep } from '../../components/panel/PlanPicker';
import PaymentInstruction from '../../components/panel/PaymentInstruction';
import ProofModal from '../../components/panel/ProofModal';
import NotaModal from '../../components/panel/NotaModal';
import { proofDetails } from '../../components/panel/OrderParts';

const TITLE = { daftar: 'QR Generator', pilih: 'Buat QR baru', wa: 'Satu langkah lagi', bayar: 'Pembayaran' };

// Satu menu QR Generator. Tampilan ditentukan dari URL:
// - tanpa parameter: daftar QR dan pesanan
// - ?view=pilih (dan &qr=ID): pilih paket, untuk QR baru atau QR yang sudah ada
// - ?view=buat: generator gratis, atau ?paket=monthly: desain Premium untuk satu QR
// - ?kode=KODE: instruksi pembayaran pesanan
export default function UserQrPage() {
  const { addToast: toast } = useToast();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kode = params.get('kode');
  const paket = params.get('paket');
  const qrParam = params.get('qr');
  const rawView = params.get('view');
  const needWa = !user?.whatsapp;

  let view = 'daftar';
  if (kode) view = 'bayar';
  else if (rawView === 'pilih') view = 'pilih';
  else if (paket) view = needWa ? 'wa' : 'buat';
  else if (rawView === 'buat') view = 'buat';

  const [plans, setPlans] = useState([]);
  const [payment, setPayment] = useState(null);
  const [qrList, setQrList] = useState(null);
  const [orders, setOrders] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [logoUrl, setLogoUrl] = useState(null);
  const [busy, setBusy] = useState('');
  const [waInput, setWaInput] = useState('');
  const [proofCode, setProofCode] = useState(null);
  const [notaCode, setNotaCode] = useState(null);

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
  const planObj = paket ? plans.find((p) => p.id === paket) || null : null;
  const unknownPlan = !kode && Boolean(paket) && plans.length > 0 && !planObj;
  const renewQr = qrParam ? (qrList || []).find((q) => q.id === qrParam) || null : null;
  const qrMissing = Boolean(qrParam) && qrList !== null && !renewQr;

  // Paket berbayar dipilih: lanjut ke desain QR (lewat langkah WhatsApp bila akun belum punya nomor).
  const choosePaid = (planId) => {
    navigate(`/dashboard/qr?view=buat&paket=${planId}${qrParam ? `&qr=${qrParam}` : ''}`);
  };

  // Desain dari generator menjadi satu pesanan. Bila qrParam ada, pesanan untuk QR itu (perpanjang / jadikan Premium).
  const placeOrder = async (design) => {
    setBusy(paket);
    try {
      const res = await createQrOrder({
        plan: paket,
        name: user.name,
        email: user.email,
        whatsapp: user.whatsapp,
        design,
        qrId: qrParam || undefined,
      });
      toast({ type: 'success', title: 'Pesanan dibuat', message: `Kode ${res.order.code}. Silakan lakukan pembayaran.` });
      await loadAll();
      navigate(`/dashboard/qr?kode=${res.order.code}`);
    } catch (err) {
      toast({ type: 'error', title: 'Pesanan gagal', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setBusy('');
    }
  };

  // Akun lama tanpa nomor WhatsApp: diminta sekali. Setelah tersimpan, tampilan berpindah ke desain.
  const saveWhatsapp = async (e) => {
    e.preventDefault();
    setBusy('wa');
    try {
      const next = await updateMyWhatsapp(waInput.trim());
      updateUser(next);
    } catch (err) {
      toast({ type: 'error', title: 'Nomor tidak valid', message: err?.response?.data?.message || 'Periksa nomor WhatsApp Anda.' });
    } finally {
      setBusy('');
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
  const subtitle = {
    daftar: 'Daftar QR, pesanan, dan lisensi Anda dalam satu menu.',
    pilih: renewQr
      ? `Pilih paket untuk QR: ${renewQr.link}. Satu pembayaran berlaku untuk satu QR code.`
      : 'Paket gratis langsung bisa dipakai. Paket Premium Gold berlaku untuk satu QR code dan dibayar lewat transfer DANA.',
    wa: 'Nomor WhatsApp dipakai admin untuk menghubungi Anda. Nomor disimpan di akun dan tidak perlu diisi lagi.',
    bayar: 'Transfer sesuai nominal, lalu unggah bukti. Pesanan yang lunas tampil di tabel pesanan.',
  }[view];

  return (
    <PanelLayout title="QR Generator">
      {view === 'buat' ? (
        <Link to="/dashboard/qr" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-secondary hover:text-primary">
          <ArrowLeft size={14} /> Kembali ke daftar QR
        </Link>
      ) : (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[24px] font-semibold text-primary">{headerTitle}</h1>
            <p className="mt-1 max-w-2xl text-[14px] text-secondary">{subtitle}</p>
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
                  Buat QR pertama Anda. Gratis, atau pilih Premium Gold untuk satu QR dengan warna sendiri dan tanpa logo.
                </p>
                <Button variant="primary" icon={QrCode} className="mt-4" onClick={() => navigate('/dashboard/qr?view=pilih')}>
                  Buat QR baru
                </Button>
              </div>
            ) : (
              <QrCardList
                items={qrList}
                logoUrl={logoUrl}
                onChanged={loadAll}
                onUpgrade={(qr) => navigate(`/dashboard/qr?view=pilih&qr=${qr.id}`)}
              />
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
        qrMissing ? (
          <p className="text-[13px] text-tertiary">QR tidak ditemukan di akun Anda.</p>
        ) : qrParam && !qrList ? (
          <p className="text-[13px] text-tertiary">Memuat...</p>
        ) : (
          <PlanPicker
            plans={plans}
            busy={busy}
            pendingOrders={pendingOrders}
            qrContext={renewQr}
            onFree={() => navigate('/dashboard/qr?view=buat')}
            onPaid={choosePaid}
          />
        )
      )}

      {view === 'wa' && (
        <WhatsappStep value={waInput} onChange={setWaInput} onSubmit={saveWhatsapp} busy={busy === 'wa'} />
      )}

      {view === 'buat' && (
        <div>
          {Boolean(paket) && plans.length === 0 ? (
            <p className="text-[13px] text-tertiary">Memuat paket...</p>
          ) : paket && !planObj ? (
            <p className="text-[13px] text-tertiary">
              Paket tidak dikenal. <Link to="/dashboard/qr?view=pilih" className="underline">Pilih paket lain</Link>.
            </p>
          ) : qrParam && !qrList ? (
            <p className="text-[13px] text-tertiary">Memuat...</p>
          ) : qrMissing ? (
            <p className="text-[13px] text-tertiary">QR tidak ditemukan di akun Anda.</p>
          ) : (
            <QrGeneratorPage
              key={`${paket || 'gratis'}-${renewQr?.id || 'baru'}`}
              embedded
              orderPlan={planObj}
              renewQr={renewQr}
              onOrder={placeOrder}
              orderBusy={busy === paket}
            />
          )}
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
