import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, Link2, ClipboardList, ImagePlus, LogOut, Eye, Menu, Moon, Sun, X } from 'lucide-react';
import { NotificationBell, ProfileMenu } from './HeaderMenus';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Kerangka panel gaya admin: sidebar dengan bagian, header dengan tanggal dan profil, lalu konten.
// Dipakai untuk peran user dan super admin. Menu berbeda menurut peran.
// Di ponsel sidebar disembunyikan dan dibuka lewat tombol hamburger.
const MENUS = {
  user: [
    {
      section: 'Utama',
      items: [
        { label: 'QR Generator', to: '/dashboard/qr', icon: QrCode },
        { label: 'Linktree', to: '/dashboard/linktree', icon: Link2 },
        { label: 'Twibbon', to: '/dashboard/twibbon', icon: ImagePlus },
      ],
    },
  ],
  superadmin: [
    {
      section: 'Utama',
      items: [
        { label: 'Konfirmasi Pesanan', to: '/admin', icon: ClipboardList, end: true },
        { label: 'Data Linktree', to: '/admin/linktree', icon: Link2 },
      ],
    },
  ],
};

const ROLE_LABEL = { user: 'User', superadmin: 'Super Admin' };

const todayLabel = () =>
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const CrumbContext = createContext('');

// Jejak halaman ("Panel › Nama halaman"). Di layar besar tampil di header;
// di ponsel halaman menaruhnya tepat di bawah judul.
export function PanelCrumb({ className = '' }) {
  const title = useContext(CrumbContext);
  if (!title) return null;
  return (
    <p className={`mt-0.5 text-[11px] text-tertiary md:hidden ${className}`}>
      Panel <span className="mx-0.5">›</span> <span className="text-secondary">{title}</span>
    </p>
  );
}

export default function PanelLayout({ title, children }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = user?.role === 'superadmin' ? 'superadmin' : 'user';
  const menu = MENUS[role];
  const displayName = user?.name || user?.username || '';

  const onLogout = async () => {
    await signOut();
    navigate('/masuk', { replace: true });
  };

  // Pindah halaman: tutup menu ponsel.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  // Menu ponsel terbuka: kunci gulir halaman dan tutup dengan Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Isi sidebar: dipakai di sidebar layar besar dan di laci ponsel.
  const sidebar = (
    <>
    <div className="flex items-center justify-between gap-2">
      <Link to={role === 'superadmin' ? '/admin' : '/dashboard'} className="flex min-w-0 items-center gap-2.5 px-2">
        <img src="/qr-logo.svg" alt="" className="h-6 w-auto md:h-7" />
        <div className="min-w-0 leading-tight">
          <p className="text-[14px] font-semibold text-primary md:text-[15px]">OpenTools</p>
          <p className="text-[11px] text-tertiary md:text-[12px]">Panel {ROLE_LABEL[role]}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => setMenuOpen(false)}
        aria-label="Tutup menu"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-secondary transition-smooth hover:bg-card-muted hover:text-primary md:hidden"
      >
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>

    <nav className="mt-6 flex-1 space-y-6 overflow-y-auto md:mt-8">
      {menu.map((group) => (
        <div key={group.section}>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">{group.section}</p>
          <div className="mt-2 space-y-1">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-smooth md:text-[14px] ${
                    isActive ? 'bg-card-muted font-medium text-primary' : 'text-secondary hover:bg-card-muted/60 hover:text-primary'
                  }`
                }
              >
                <item.icon size={17} strokeWidth={1.75} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>

    {/* Ponsel: nama akun tampil di sini, karena header hanya menampilkan foto profil. */}
    <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 md:hidden">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-black text-[12px] font-semibold text-white dark:bg-white dark:text-black">
        {(displayName || 'A').slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[13px] font-medium text-primary">{displayName}</p>
        <p className="text-[11px] text-tertiary">{ROLE_LABEL[role]}</p>
      </div>
    </div>

    <button
      type="button"
      onClick={onLogout}
      className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-danger transition-smooth hover:bg-card-muted/60 md:mt-6 md:text-[14px]"
    >
      <LogOut size={17} strokeWidth={1.75} />
      Keluar
    </button>
    </>
  );

  return (
    <div className="panel-compact min-h-screen flex-1 bg-card-muted/30 md:flex">
      {/* Sidebar layar besar: selalu tampil di sisi kiri. */}
      <aside aria-label="Menu panel" className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6 md:flex">
        {sidebar}
      </aside>

      {/* Ponsel: sidebar jadi laci yang masuk dari kiri. Digambar lewat portal ke body,
          karena pembungkus halaman punya animasi transform yang membuat posisi fixed ikut tergulir. */}
      {createPortal(
        <div className="md:hidden">
          <div
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
            className={`fixed inset-0 z-[55] bg-black/50 transition-opacity duration-200 motion-reduce:transition-none ${
              menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />
          <aside
            id="panel-sidebar"
            aria-label="Menu panel"
            className={`fixed inset-y-0 left-0 z-[60] flex w-[264px] max-w-[82vw] flex-col border-r border-border bg-card px-3 py-4 transition-[transform,visibility] duration-200 ease-out motion-reduce:transition-none ${
              menuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
            }`}
          >
            {sidebar}
          </aside>
        </div>,
        document.body
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Buka menu"
              aria-expanded={menuOpen}
              aria-controls="panel-sidebar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-primary transition-smooth hover:border-border-hover md:hidden"
            >
              <Menu size={16} strokeWidth={1.75} />
            </button>
            <Link to={role === 'superadmin' ? '/admin' : '/dashboard'} className="flex items-center gap-2 md:hidden">
              <img src="/qr-logo.svg" alt="" className="h-5 w-auto" />
              <span className="text-[13px] font-semibold text-primary">OpenTools</span>
            </Link>
            <p className="hidden truncate text-[13px] text-tertiary md:block">
              Panel <span className="mx-1">›</span> <span className="text-secondary">{title}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden text-[13px] text-secondary lg:inline">{todayLabel()}</span>
            <span className="hidden h-5 w-px bg-border sm:inline-block" />
            {/* Mata: buka halaman depan website di tab baru. */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Lihat halaman depan website"
              title="Lihat website"
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-secondary transition-smooth hover:border-border-hover hover:text-primary sm:flex"
            >
              <Eye size={16} strokeWidth={1.75} aria-hidden="true" />
            </a>
            <NotificationBell />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-secondary transition-smooth hover:text-primary"
            >
              {theme === 'dark' ? (
                <Sun size={16} strokeWidth={1.75} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Moon size={16} strokeWidth={1.75} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>
            {/* Foto profil: ponsel hanya foto, layar lebih besar dengan nama dan peran. Diklik membuka menu akun. */}
            <ProfileMenu onLogout={onLogout} />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8">
          <CrumbContext.Provider value={title}>{children}</CrumbContext.Provider>
        </main>

        {/* Footer panel: sama dengan footer situs */}
        <footer className="flex flex-col gap-2 border-t border-border bg-card px-3 py-3 text-[11px] text-tertiary sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-4 sm:text-[12px] md:px-8">
          <p>
            © {new Date().getFullYear()} <span className="font-medium text-secondary">PT. Garuda Nexa Bahtera</span>. Hak cipta dilindungi undang-undang.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacy" className="hover:text-primary">Kebijakan Privasi</Link>
            <Link to="/terms" className="hover:text-primary">Syarat Ketentuan</Link>
            <a
              href="https://wa.me/6282181361433?text=Halo%20saya%20ingin%20konsultasi%20mengenai%20website%20OpenTools"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              Kontak
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
