import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { loginAccount } from '../../services/authApi';

const INPUT =
  'h-[42px] w-full px-3 rounded-md border border-border bg-card text-primary text-[14px] placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth';

export default function LoginPage() {
  const { addToast: toast } = useToast();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Paket yang dipilih di halaman harga dibawa sampai ke pemesanan.
  const paketParam = ['monthly', 'yearly'].includes(params.get('paket')) ? params.get('paket') : null;
  const afterLogin = (role) => {
    if (role === 'superadmin') return '/admin';
    return paketParam ? `/dashboard/qr?paket=${paketParam}` : '/dashboard/qr';
  };
  const [form, setForm] = useState({ login: '', password: '' });
  const [busy, setBusy] = useState(false);

  // Sudah masuk: langsung diarahkan sesuai peran.
  useEffect(() => {
    if (user) navigate(afterLogin(user.role), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, paketParam]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await loginAccount({ login: form.login.trim(), password: form.password });
      signIn(res);
      navigate(afterLogin(res.user.role), { replace: true });
    } catch (err) {
      toast({ type: 'error', title: 'Gagal masuk', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <section className="mx-auto max-w-md pt-10">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="text-[22px] font-semibold text-primary">Masuk</h1>
          <p className="mt-1 text-[13px] text-secondary">
            Masuk untuk melihat QR dan lisensi Anda. Belum punya akun?{' '}
            <Link to={paketParam ? `/daftar?paket=${paketParam}` : '/daftar'} className="underline hover:text-primary">Daftar dulu</Link>.
          </p>

          <form onSubmit={submit} className="mt-6 grid gap-3">
            <div>
              <label className="mb-1 block text-[13px] text-secondary" htmlFor="login">Email</label>
              <input
                id="login"
                type="text"
                autoComplete="username"
                required
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                className={INPUT}
                placeholder="nama@email.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-secondary" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={INPUT}
              />
            </div>
            <Button type="submit" variant="primary" icon={LogIn} disabled={busy} className="mt-2 w-full">
              {busy ? 'Memeriksa...' : 'Masuk'}
            </Button>
          </form>
        </div>
      </section>
    </PageContainer>
  );
}
