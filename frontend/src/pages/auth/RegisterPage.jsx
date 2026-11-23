import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, Phone, UserPlus, UserRound } from 'lucide-react';
import { AuthField, AuthShell, purposeText } from '../../components/auth/AuthParts';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { registerAccount } from '../../services/authApi';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { addToast: toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Paket yang dipilih di halaman harga dibawa sampai ke pemesanan.
  const paketParam = ['monthly', 'yearly'].includes(params.get('paket')) ? params.get('paket') : null;
  // Tujuan setelah daftar (misalnya dari halaman Linktree). Hanya halaman panel yang diizinkan.
  const nextParam = params.get('next');
  const nextPath = nextParam && nextParam.startsWith('/dashboard/') ? nextParam : null;
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  const tooShort = form.password.length > 0 && form.password.length < 8;
  const mismatch = form.confirm.length > 0 && form.confirm !== form.password;

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast({ type: 'error', title: t('auth.register.mismatch_title'), message: t('auth.register.mismatch_message') });
      return;
    }
    setBusy(true);
    try {
      const res = await registerAccount({
        name: form.name.trim(),
        email: form.email.trim(),
        whatsapp: form.whatsapp.trim(),
        password: form.password,
      });
      signIn(res);
      navigate(nextPath || (paketParam ? `/dashboard/qr?paket=${paketParam}` : '/dashboard/qr'), { replace: true });
    } catch (err) {
      toast({ type: 'error', title: t('auth.register.error_title'), message: err?.response?.data?.message || t('auth.retry_later') });
    } finally {
      setBusy(false);
    }
  };

  const loginPath = nextPath ? `/masuk?next=${encodeURIComponent(nextPath)}` : paketParam ? `/masuk?paket=${paketParam}` : '/masuk';
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <AuthShell
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle', { purpose: purposeText(t, nextPath, paketParam) })}
      footer={
        <>
          {t('auth.register.have_account')}{' '}
          <Link to={loginPath} className="font-medium text-primary underline underline-offset-2 hover:text-blue-500">{t('auth.register.login_link')}</Link>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        <AuthField id="name" label={t('auth.register.name_label')} icon={UserRound} required minLength={2} maxLength={120} autoComplete="name" placeholder={t('auth.register.name_placeholder')} value={form.name} onChange={set('name')} />
        <AuthField id="email" label={t('auth.email_label')} icon={Mail} type="email" required autoComplete="email" placeholder={t('auth.email_placeholder')} value={form.email} onChange={set('email')} />
        <AuthField
          id="whatsapp"
          label={t('auth.register.whatsapp_label')}
          icon={Phone}
          type="tel"
          inputMode="tel"
          required
          autoComplete="tel"
          placeholder="081234567890"
          hint={t('auth.register.whatsapp_hint')}
          value={form.whatsapp}
          onChange={set('whatsapp')}
        />
        <AuthField
          id="password"
          label={t('auth.password_label')}
          icon={Lock}
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder={t('auth.register.password_placeholder')}
          error={tooShort ? t('auth.register.password_too_short') : ''}
          value={form.password}
          onChange={set('password')}
        />
        <AuthField
          id="confirm"
          label={t('auth.register.confirm_label')}
          icon={Lock}
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder={t('auth.register.confirm_placeholder')}
          error={mismatch ? t('auth.register.confirm_mismatch') : ''}
          value={form.confirm}
          onChange={set('confirm')}
        />
        <Button type="submit" variant="primary" size="lg" icon={UserPlus} disabled={busy || tooShort || mismatch} className="mt-1 w-full">
          {busy ? t('auth.register.submitting') : t('auth.register.submit')}
        </Button>
      </form>
    </AuthShell>
  );
}
