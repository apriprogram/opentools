import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, LogIn, Mail } from 'lucide-react';
import { AuthField, AuthShell, purposeText } from '../../components/auth/AuthParts';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { loginAccount } from '../../services/authApi';

export default function LoginPage() {
  const { addToast: toast } = useToast();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Paket yang dipilih di halaman harga dibawa sampai ke pemesanan.
  const paketParam = ['monthly', 'yearly'].includes(params.get('paket')) ? params.get('paket') : null;
  // Tujuan setelah masuk (misalnya dari halaman Linktree). Hanya halaman panel yang diizinkan.
  const nextParam = params.get('next');
  const nextPath = nextParam && nextParam.startsWith('/dashboard/') ? nextParam : null;
  const afterLogin = (role) => {
    if (nextPath) return nextPath;
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

  const registerPath = nextPath ? `/daftar?next=${encodeURIComponent(nextPath)}` : paketParam ? `/daftar?paket=${paketParam}` : '/daftar';

  return (
    <AuthShell
      title="Masuk ke akun"
      subtitle={`Masuk ${purposeText(nextPath, paketParam)}.`}
      footer={
        <>
          Belum punya akun?{' '}
          <Link to={registerPath} className="font-medium text-primary underline underline-offset-2 hover:text-blue-500">Daftar gratis</Link>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        <AuthField
          id="login"
          label="Email"
          icon={Mail}
          type="text"
          inputMode="email"
          autoComplete="username"
          required
          placeholder="nama@email.com"
          value={form.login}
          onChange={(e) => setForm({ ...form, login: e.target.value })}
        />
        <AuthField
          id="password"
          label="Password"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          required
          placeholder="Password kamu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" variant="primary" size="lg" icon={LogIn} disabled={busy || !form.login.trim() || !form.password} className="mt-1 w-full">
          {busy ? 'Memeriksa...' : 'Masuk'}
        </Button>
      </form>
    </AuthShell>
  );
}
