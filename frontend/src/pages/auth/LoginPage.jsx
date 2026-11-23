import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, LogIn, Mail } from 'lucide-react';
import { AuthField, AuthShell, purposeText } from '../../components/auth/AuthParts';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { loginAccount } from '../../services/authApi';

export default function LoginPage() {
  const { t } = useTranslation();
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
      toast({ type: 'error', title: t('auth.login.error_title'), message: err?.response?.data?.message || t('auth.retry_later') });
    } finally {
      setBusy(false);
    }
  };

  const registerPath = nextPath ? `/daftar?next=${encodeURIComponent(nextPath)}` : paketParam ? `/daftar?paket=${paketParam}` : '/daftar';

  return (
    <AuthShell
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle', { purpose: purposeText(t, nextPath, paketParam) })}
      footer={
        <>
          {t('auth.login.no_account')}{' '}
          <Link to={registerPath} className="font-medium text-primary underline underline-offset-2 hover:text-blue-500">{t('auth.login.register_link')}</Link>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        <AuthField
          id="login"
          label={t('auth.email_label')}
          icon={Mail}
          type="text"
          inputMode="email"
          autoComplete="username"
          required
          placeholder={t('auth.email_placeholder')}
          value={form.login}
          onChange={(e) => setForm({ ...form, login: e.target.value })}
        />
        <AuthField
          id="password"
          label={t('auth.password_label')}
          icon={Lock}
          type="password"
          autoComplete="current-password"
          required
          placeholder={t('auth.login.password_placeholder')}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" variant="primary" size="lg" icon={LogIn} disabled={busy || !form.login.trim() || !form.password} className="mt-1 w-full">
          {busy ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>
    </AuthShell>
  );
}
