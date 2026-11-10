import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Heading, Image, Link2, Palette, QrCode, Rows3, Share2, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import LinktreeView from '../components/linktree/LinktreeView';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  { icon: Link2, title: 'Tautan tanpa batas', text: 'Tambahkan semua link penting: toko, portofolio, video, dan kontak.' },
  { icon: Heading, title: 'Header dan pemisah', text: 'Kelompokkan tautan dengan judul bagian agar mudah dibaca.' },
  { icon: Share2, title: 'Ikon sosial', text: 'Instagram, YouTube, TikTok, WhatsApp, email, dan platform lainnya.' },
  { icon: Palette, title: 'Tema dan warna', text: 'Pilih tema siap pakai atau atur warna latar, teks, dan tombol sendiri.' },
  { icon: Image, title: 'Foto dan latar', text: 'Unggah foto profil dan gambar latar untuk tampilan yang khas.' },
  { icon: BarChart3, title: 'Statistik klik', text: 'Lihat berapa kali halaman dibuka dan tiap tautan diklik.' },
  { icon: QrCode, title: 'QR code halaman', text: 'Unduh QR code dari Linktree Anda untuk dicetak atau dibagikan.' },
  { icon: Rows3, title: 'Banyak Linktree', text: 'Satu akun bisa membuat banyak Linktree untuk tujuan yang berbeda.' },
];

const SAMPLE = {
  title: 'Nama Anda',
  bio: 'Kreator konten dan pemilik toko online. Pesan untuk kerja sama di bawah.',
  avatar: null,
  theme: {
    bg: { type: 'gradient', color: '#F97316', color2: '#EC4899', image: null },
    text: '#FFFFFF',
    button: { style: 'outline', radius: 'pill', color: '#FFFFFF', textColor: '#FFFFFF' },
  },
  items: [
    { id: 's1', type: 'social', platform: 'instagram', url: '#', enabled: true },
    { id: 's2', type: 'social', platform: 'youtube', url: '#', enabled: true },
    { id: 'h1', type: 'header', title: 'Karya Terbaru', enabled: true },
    { id: 'l1', type: 'link', title: 'Toko Online Saya', url: '#', enabled: true },
    { id: 'l2', type: 'link', title: 'Video Terbaru', url: '#', enabled: true },
    { id: 'l3', type: 'link', title: 'Hubungi Saya', url: '#', enabled: true },
  ],
};

// Landing Linktree. Membuat dan mengedit wajib daftar akun; halaman yang sudah diterbitkan bisa dibuka siapa saja.
export default function LinktreeLandingPage() {
  const { user } = useAuth();
  const dashboardPath = '/dashboard/linktree';

  return (
    <PageContainer>
      <section className="mx-auto max-w-6xl pt-6 pb-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-secondary">
              Gratis
            </span>
            <h1 className="mt-4 text-[32px] font-semibold leading-[40px] tracking-tight text-primary sm:text-[40px] sm:leading-[48px]">
              Satu link untuk semua profil Anda
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-[24px] text-secondary">
              Kumpulkan semua tautan penting dalam satu halaman. Daftar akun untuk membuat dan mengedit Linktree. Halaman yang sudah diterbitkan bisa dibuka siapa saja.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Link to={dashboardPath}>
                  <Button variant="primary" size="lg" icon={ArrowRight}>Buka Linktree saya</Button>
                </Link>
              ) : (
                <>
                  <Link to={`/daftar?next=${encodeURIComponent(dashboardPath)}`}>
                    <Button variant="primary" size="lg" icon={UserPlus}>Daftar dan buat Linktree</Button>
                  </Link>
                  <Link to={`/masuk?next=${encodeURIComponent(dashboardPath)}`}>
                    <Button variant="secondary" size="lg" icon={LogIn}>Sudah punya akun? Masuk</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[36px] border-[10px] border-zinc-900 bg-black shadow-xl">
            <div className="h-[560px] overflow-y-auto">
              <LinktreeView tree={SAMPLE} preview />
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
              <f.icon size={20} strokeWidth={1.75} className="text-primary" />
              <p className="mt-3 text-[15px] font-semibold text-primary">{f.title}</p>
              <p className="mt-1 text-[13px] leading-[20px] text-secondary">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
