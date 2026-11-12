import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Phone, UserPlus, UserRound } from 'lucide-react';
import { AuthField, AuthShell, purposeText } from '../../components/auth/AuthParts';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { registerAccount } from '../../services/authApi';

export default function RegisterPage() {
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
      toast({ type: 'error', title: 'Password tidak sama', message: 'Ulangi password dengan benar.' });
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
      toast({ type: 'error', title: 'Gagal daftar', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setBusy(false);
    }
  };

  const loginPath = nextPath ? `/masuk?next=${encodeURIComponent(nextPath)}` : paketParam ? `/masuk?paket=${paketParam}` : '/masuk';
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <AuthShell
      title="Buat akun gratis"
      subtitle={`Daftar ${purposeText(nextPath, paketParam)}.`}
      footer={
        <>
          Sudah punya akun?{' '}
          <Link to={loginPath} className="font-medium text-primary underline underline-offset-2 hover:text-blue-500">Masuk</Link>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        <AuthField id="name" label="Nama lengkap" icon={UserRound} required minLength={2} maxLength={120} autoComplete="name" placeholder="Nama kamu" value={form.name} onChange={set('name')} />
        <AuthField id="email" label="Email" icon={Mail} type="email" required autoComplete="email" placeholder="nama@email.com" value={form.email} onChange={set('email')} />
        <AuthField
          id="whatsapp"
          label="Nomor WhatsApp"
          icon={Phone}
          type="tel"
          inputMode="tel"
          required
          autoComplete="tel"
          placeholder="081234567890"
          hint="Dipakai admin untuk menghubungi kamu soal pesanan."
          value={form.whatsapp}
          onChange={set('whatsapp')}
        />
        <AuthField
          id="password"
          label="Password"
          icon={Lock}
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          error={tooShort ? 'Password minimal 8 karakter.' : ''}
          value={form.password}
          onChange={set('password')}
        />
        <AuthField
          id="confirm"
          label="Ulangi password"
          icon={Lock}
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Ketik ulang password"
          error={mismatch ? 'Belum sama dengan password di atas.' : ''}
          value={form.confirm}
          onChange={set('confirm')}
        />
        <Button type="submit" variant="primary" size="lg" icon={UserPlus} disabled={busy || tooShort || mismatch} className="mt-1 w-full">
          {busy ? 'Membuat akun...' : 'Daftar'}
        </Button>
      </form>
    </AuthShell>
  );
}
