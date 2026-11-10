import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, RefreshCw, LogOut, Copy, Eye, FileText, Download } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import {
  adminFetchQrOrders,
  adminConfirmQrOrder,
  adminCancelQrOrder,
  adminFetchQrProof,
  adminFetchQrNota,
  adminFetchQrNotaPdf,
  adminLogin,
} from '../services/qrApi';

const KEY_STORAGE = 'ot_admin_key';
const FILTERS = [
  { id: 'pending', label: 'Menunggu' },
  { id: 'paid', label: 'Lunas' },
  { id: 'cancelled', label: 'Batal' },
  { id: 'all', label: 'Semua' },
];
const VERIFY_LABEL = {
  approved: { text: 'Otomatis lunas', cls: 'text-success' },
  review: { text: 'Perlu cek manual', cls: 'text-secondary' },
  rejected: { text: 'Ditolak', cls: 'text-danger' },
  checking: { text: 'Diperiksa', cls: 'text-secondary' },
};

const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function AdminQrPage() {
  const { addToast: toast } = useToast();
  const [adminKey, setAdminKey] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginBusy, setLoginBusy] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    try {
      setAdminKey(sessionStorage.getItem(KEY_STORAGE) || '');
    } catch {
      /* abaikan */
    }
  }, []);

  const load = useCallback(async (key, status) => {
    if (!key) return;
    setLoading(true);
    try {
      const res = await adminFetchQrOrders(key, status);
      setOrders(res.orders || []);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 503) {
        toast({ type: 'error', title: 'Akses ditolak', message: err.response.data?.message || 'Kunci admin salah.' });
        setAdminKey('');
        try { sessionStorage.removeItem(KEY_STORAGE); } catch { /* abaikan */ }
      } else {
        toast({ type: 'error', title: 'Gagal memuat', message: 'Tidak bisa menghubungi server.' });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load(adminKey, filter);
  }, [adminKey, filter, load]);

  const login = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password) return;
    setLoginBusy(true);
    try {
      const res = await adminLogin({ username: loginForm.username.trim(), password: loginForm.password });
      try { sessionStorage.setItem(KEY_STORAGE, res.token); } catch { /* abaikan */ }
      setAdminKey(res.token);
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      toast({ type: 'error', title: 'Gagal masuk', message: err?.response?.data?.message || 'Tidak bisa masuk. Coba lagi.' });
    } finally {
      setLoginBusy(false);
    }
  };

  const logout = () => {
    try { sessionStorage.removeItem(KEY_STORAGE); } catch { /* abaikan */ }
    setAdminKey('');
    setOrders([]);
  };

  const confirm = async (code) => {
    setBusy(code);
    try {
      const res = await adminConfirmQrOrder(adminKey, code);
      toast({ type: 'success', title: 'Pesanan dikonfirmasi', message: `Kode lisensi: ${res.order.licenseKey}` });
      load(adminKey, filter);
    } catch (err) {
      toast({ type: 'error', title: 'Gagal', message: err?.response?.data?.message || 'Konfirmasi gagal.' });
    } finally {
      setBusy('');
    }
  };

  const cancel = async (code) => {
    if (!window.confirm(`Batalkan pesanan ${code}?`)) return;
    setBusy(code);
    try {
      await adminCancelQrOrder(adminKey, code);
      toast({ type: 'info', title: 'Pesanan dibatalkan', message: code });
      load(adminKey, filter);
    } catch (err) {
      toast({ type: 'error', title: 'Gagal', message: err?.response?.data?.message || 'Pembatalan gagal.' });
    } finally {
      setBusy('');
    }
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    toast({ type: 'success', title: 'Disalin', message: text });
  };

  // Nota HTML dibuka di tab baru untuk dilihat atau dicetak
  const viewNota = async (code) => {
    setBusy(code);
    try {
      const blob = await adminFetchQrNota(adminKey, code);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      toast({ type: 'error', title: 'Gagal membuka nota', message: 'Nota tidak bisa dimuat.' });
    } finally {
      setBusy('');
    }
  };

  // Nota PDF diunduh langsung dengan nama berkas INV-...pdf
  const downloadNotaPdf = async (code) => {
    setBusy(code);
    try {
      const blob = await adminFetchQrNotaPdf(adminKey, code);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nota-${code}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      toast({ type: 'error', title: 'Gagal mengunduh nota', message: 'PDF tidak bisa dibuat.' });
    } finally {
      setBusy('');
    }
  };

  const viewProof = async (code) => {
    setBusy(code);
    try {
      const blob = await adminFetchQrProof(adminKey, code);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      toast({ type: 'error', title: 'Gagal membuka bukti', message: 'Bukti tidak bisa dimuat.' });
    } finally {
      setBusy('');
    }
  };

  if (!adminKey) {
    return (
      <PageContainer>
        <section className="max-w-md mx-auto pt-10">
          <h1 className="text-[22px] font-semibold text-primary mb-1">Admin QR</h1>
          <p className="text-[13px] text-secondary mb-5">Masuk dengan username dan password admin untuk mengelola pesanan paket QR.</p>
          <form onSubmit={login} className="grid gap-2">
            <input
              type="text"
              autoComplete="username"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="h-[40px] px-3 rounded-md border border-border bg-card text-primary text-[14px] focus:outline-none focus:border-border-focus transition-smooth"
            />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="h-[40px] px-3 rounded-md border border-border bg-card text-primary text-[14px] focus:outline-none focus:border-border-focus transition-smooth"
            />
            <Button type="submit" variant="primary" disabled={loginBusy}>{loginBusy ? 'Memeriksa...' : 'Masuk'}</Button>
          </form>
        </section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <section className="max-w-5xl mx-auto pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-[22px] font-semibold text-primary">Pesanan QR Generator</h1>
            <p className="text-[13px] text-secondary">Konfirmasi setelah transfer masuk. Kode lisensi dibuat otomatis.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => load(adminKey, filter)} disabled={loading}>Muat ulang</Button>
            <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>Keluar</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`h-[32px] px-3 rounded-full text-[12px] font-medium border transition-smooth ${
                filter === f.id ? 'bg-accent-black text-white border-accent-black dark:bg-white dark:text-black' : 'border-border text-secondary hover:text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-[13px] min-w-[760px]">
            <thead className="text-left text-secondary border-b border-border">
              <tr>
                <th className="p-3 font-medium">Kode</th>
                <th className="p-3 font-medium">Paket</th>
                <th className="p-3 font-medium">Transfer</th>
                <th className="p-3 font-medium">Pemesan</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Lisensi</th>
                <th className="p-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-tertiary">{loading ? 'Memuat...' : 'Tidak ada pesanan.'}</td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.code} className="border-b border-border last:border-0 align-top">
                  <td className="p-3 font-medium text-primary">{o.code}<div className="text-[11px] text-tertiary">{new Date(o.createdAt).toLocaleString('id-ID')}</div></td>
                  <td className="p-3 text-primary">{o.planLabel}</td>
                  <td className="p-3 text-primary">{rupiah(o.amount)}</td>
                  <td className="p-3 text-secondary">
                    {o.name}
                    <div className="text-[12px] text-tertiary break-all">{o.email}</div>
                    {o.whatsapp && (
                      <a
                        href={`https://wa.me/${o.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-primary underline hover:no-underline"
                      >
                        WA +{o.whatsapp}
                      </a>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`text-[12px] font-medium ${o.status === 'paid' ? 'text-success' : o.status === 'cancelled' ? 'text-danger' : 'text-secondary'}`}>
                      {o.status === 'pending' ? 'Menunggu' : o.status === 'paid' ? 'Lunas' : 'Batal'}
                    </span>
                    {VERIFY_LABEL[o.verifyStatus] && (
                      <div className={`text-[12px] font-medium mt-1 ${VERIFY_LABEL[o.verifyStatus].cls}`}>
                        Bukti: {VERIFY_LABEL[o.verifyStatus].text}
                      </div>
                    )}
                    {o.verifyAmount != null && (
                      <div className="text-[11px] text-tertiary">Terbaca: {rupiah(o.verifyAmount)}</div>
                    )}
                    {o.verifyNote && o.status === 'pending' && (
                      <div className="text-[11px] text-tertiary max-w-[220px]">{o.verifyNote}</div>
                    )}
                  </td>
                  <td className="p-3">
                    {o.licenseKey ? (
                      <button onClick={() => copy(o.licenseKey)} className="inline-flex items-center gap-1 text-primary font-medium break-all text-left hover:underline">
                        {o.licenseKey} <Copy size={12} />
                      </button>
                    ) : <span className="text-tertiary">-</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Button size="sm" variant="ghost" icon={FileText} disabled={busy === o.code} onClick={() => viewNota(o.code)}>Nota</Button>
                      <Button size="sm" variant="ghost" icon={Download} disabled={busy === o.code} onClick={() => downloadNotaPdf(o.code)}>PDF</Button>
                      {o.hasProof && (
                        <Button size="sm" variant="ghost" icon={Eye} disabled={busy === o.code} onClick={() => viewProof(o.code)}>Bukti</Button>
                      )}
                      {o.status === 'pending' && (
                        <>
                          <Button size="sm" variant="primary" icon={Check} disabled={busy === o.code} onClick={() => confirm(o.code)}>Konfirmasi</Button>
                          <Button size="sm" variant="secondary" icon={X} disabled={busy === o.code} onClick={() => cancel(o.code)}>Batal</Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[12px] text-tertiary mt-4">
          Kirim kode lisensi ke pembeli lewat WhatsApp. Pembeli juga bisa melihatnya sendiri di <Link to="/qr/harga" className="underline hover:text-primary">halaman paket</Link>.
        </p>
      </section>
    </PageContainer>
  );
}
