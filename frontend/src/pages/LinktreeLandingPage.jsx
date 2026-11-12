import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Heading, Image, Link2, Palette, QrCode, Rows3, Share2, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import LinktreeView, { pageBackground } from '../components/linktree/LinktreeView';
import PhoneMockup from '../components/linktree/PhoneMockup';
import { THEME_PRESETS } from '../components/linktree/constants';
import { QR_MARK_PATH, QR_MARK_VIEWBOX } from '../lib/qrCode';
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

// Tema pertama di mockup ponsel: liquid glass di atas latar ungu tua.
// backdrop: latar khusus mockup, dengan dua sorot cahaya supaya kacanya terlihat membiaskan warna.
const LIQUID_PURPLE = {
  id: 'liquid-ungu',
  label: 'Liquid glass ungu',
  theme: {
    bg: { type: 'gradient', color: '#7A2A5E', color2: '#26091A' },
    text: '#FFFFFF',
    button: { style: 'liquid', radius: 'pill', color: '#FFFFFF', textColor: '#FFFFFF' },
    social: { style: 'liquid' },
  },
  backdrop: {
    backgroundImage:
      'radial-gradient(circle at 18% 10%, rgba(222, 128, 196, 0.6), transparent 42%), radial-gradient(circle at 88% 52%, rgba(152, 72, 176, 0.55), transparent 46%), radial-gradient(circle at 20% 92%, rgba(122, 42, 94, 0.7), transparent 50%), linear-gradient(160deg, #5C2347, #26091A)',
  },
};

// Tema yang bisa dicoba langsung di mockup ponsel. Sisanya diambil dari tema siap pakai di editor.
const DEMO_THEMES = [
  LIQUID_PURPLE,
  ...['senja', 'laut', 'hutan', 'pastel', 'gelap'].map((id) => THEME_PRESETS.find((preset) => preset.id === id)).filter(Boolean),
];

// Foto profil contoh: logo OpenTools di dalam lingkaran kaca, warnanya mengikuti warna teks tema.
const logoAvatar = (ink) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><circle cx="120" cy="120" r="117" fill="${ink}" fill-opacity="0.14" stroke="${ink}" stroke-opacity="0.55" stroke-width="5"/><svg x="72" y="72" width="96" height="96" viewBox="${QR_MARK_VIEWBOX}"><path d="${QR_MARK_PATH}" fill="${ink}"/></svg></svg>`
  )}`;

// Tampilan di layar mockup dikecilkan supaya lebih banyak isi yang terlihat, seperti di ponsel sungguhan.
const SCREEN_ZOOM = 0.8;

const SAMPLE = {
  title: 'Nama Anda',
  bio: 'Kreator konten dan pemilik toko online. Pesan untuk kerja sama di bawah.',
  avatar: null,
  items: [
    { id: 's1', type: 'social', platform: 'instagram', url: '#', enabled: true },
    { id: 's2', type: 'social', platform: 'youtube', url: '#', enabled: true },
    { id: 'h1', type: 'header', title: 'Karya Terbaru', enabled: true },
    { id: 'l1', type: 'link', title: 'Toko Online Saya', url: '#', enabled: true },
    { id: 'l2', type: 'link', title: 'Video Terbaru', url: '#', enabled: true },
    { id: 'l3', type: 'link', title: 'Hubungi Saya', url: '#', enabled: true },
    { id: 'h2', type: 'header', title: 'Kerja Sama', enabled: true },
    { id: 'l4', type: 'link', title: 'Portofolio', url: '#', enabled: true },
    { id: 'l5', type: 'link', title: 'Jadwal Konsultasi', url: '#', enabled: true },
    { id: 'l6', type: 'link', title: 'Kirim Email', url: '#', enabled: true },
  ],
};

// Landing Linktree. Membuat dan mengedit wajib daftar akun; halaman yang sudah diterbitkan bisa dibuka siapa saja.
export default function LinktreeLandingPage() {
  const { user } = useAuth();
  const dashboardPath = '/dashboard/linktree';
  const [themeId, setThemeId] = useState(DEMO_THEMES[0].id);
  const demo = DEMO_THEMES.find((preset) => preset.id === themeId) || DEMO_THEMES[0];
  // Lingkaran foto digambar di dalam logo, jadi garis tepi bawaan dimatikan.
  const theme = { ...demo.theme, avatar: { outline: false } };
  const sample = { ...SAMPLE, avatar: logoAvatar(theme.text), theme };

  return (
    <PageContainer>
      <section className="mx-auto max-w-6xl pt-6 pb-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-secondary">
              Gratis
            </span>
            {/* Judul dua baris: "Satu link" besar dengan huruf serif miring berwarna gradasi, lalu lanjutannya dengan huruf tipis. */}
            <h1 className="mt-4 text-primary">
              <span
                className="block w-fit bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EA580C] bg-clip-text pb-1 pr-3 text-[60px] font-normal italic leading-[0.95] tracking-[-0.02em] text-transparent dark:from-[#7CA3FF] dark:via-[#B794F6] dark:to-[#FDBA74] sm:text-[88px] lg:text-[104px]"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
              >
                Satu link
              </span>
              <span className="mt-1 block text-[22px] font-light leading-[1.2] tracking-[-0.02em] sm:mt-2 sm:text-[32px] lg:text-[36px]">
                untuk semua profil Anda
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-[14px] leading-[22px] text-secondary sm:text-[15px] sm:leading-[24px]">
              Kumpulkan semua tautan penting dalam satu halaman. Daftar akun untuk membuat dan mengedit Linktree. Halaman yang sudah diterbitkan bisa dibuka siapa saja.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Link to={dashboardPath}>
                  <Button variant="primary" size="md" icon={ArrowRight}>Buka Linktree saya</Button>
                </Link>
              ) : (
                <>
                  <Link to={`/daftar?next=${encodeURIComponent(dashboardPath)}`}>
                    <Button variant="primary" size="md" icon={UserPlus}>Daftar dan buat Linktree</Button>
                  </Link>
                  <Link to={`/masuk?next=${encodeURIComponent(dashboardPath)}`}>
                    <Button variant="secondary" size="md" icon={LogIn}>Sudah punya akun? Masuk</Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mockup ponsel 3D: miring mengikuti kursor, isi layarnya bisa digulir, dan temanya bisa diganti. */}
          <div className="flex min-w-0 flex-col items-center">
            <PhoneMockup ink={theme.text} label="Contoh Linktree di ponsel">
              <div className="min-h-full pt-8" style={{ ...(demo.backdrop || pageBackground(theme)), zoom: SCREEN_ZOOM }}>
                <LinktreeView tree={sample} preview plain />
              </div>
            </PhoneMockup>

            <div role="group" aria-label="Coba tema" className="glass mt-9 inline-flex max-w-full items-center gap-2 rounded-full py-1.5 pl-3.5 pr-2">
              <span className="text-[12px] font-medium text-secondary">Coba tema</span>
              {DEMO_THEMES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setThemeId(preset.id)}
                  aria-label={`Tema ${preset.label}`}
                  aria-pressed={preset.id === themeId}
                  title={preset.label}
                  className={`h-7 w-7 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)] transition-transform duration-150 hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100 ${
                    preset.id === themeId ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent' : ''
                  }`}
                  style={pageBackground(preset.theme)}
                />
              ))}
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
