import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { registerAccount } from '../../services/authApi';

const INPUT =
  'h-[42px] w-full px-3 rounded-md border border-border bg-card text-primary text-[14px] placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth';

export default function RegisterPage() {
  const { addToast: toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Paket yang dipilih di halaman harga dibawa sampai ke pemesanan.
  const paketParam = ['monthly', 'yearly'].includes(params.get('paket')) ? params.get('paket') : null;
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);

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
      navigate(paketParam ? `/dashboard/qr?paket=${paketParam}` : '/dashboard/qr', { replace: true });
    } catch (err) {
      toast({ type: 'error', title: 'Gagal daftar', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <section className="mx-auto max-w-md pt-10">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="text-[22px] font-semibold text-primary">Daftar akun</h1>
          <p className="mt-1 text-[13px] text-secondary">
            Akun menyimpan QR dan lisensi Anda. Sudah punya akun?{' '}
            <Link to={paketParam ? `/masuk?paket=${paketParam}` : '/masuk'} className="underline hover:text-primary">Masuk</Link>.
          </p>

          <form onSubmit={submit} className="mt-6 grid gap-3">
            <div>
              <label className="mb-1 block text-[13px] text-secondary" htmlFor="name">Nama lengkap</label>
              <input id="name" type="text" required minLength={2} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-secondary" htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-secondary" htmlFor="whatsapp">Nomor WhatsApp</label>
              <input id="whatsapp" type="tel" required inputMode="tel" placeholder="08xxxxxxxxxx" value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={INPUT} />
              <p className="mt-1 text-[12px] text-tertiary">Dipakai admin untuk mengirim kode lisensi. Tidak perlu diisi lagi saat memesan.</p>
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-secondary" htmlFor="password">Password (minimal 8 karakter)</label>
              <input id="password" type="password" required minLength={8} autoComplete="new-password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-secondary" htmlFor="confirm">Ulangi password</label>
              <input id="confirm" type="password" required minLength={8} autoComplete="new-password" value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={INPUT} />
            </div>
            <Button type="submit" variant="primary" icon={UserPlus} disabled={busy} className="mt-2 w-full">
              {busy ? 'Membuat akun...' : 'Daftar'}
            </Button>
          </form>
        </div>
      </section>
    </PageContainer>
  );
}
