import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Images, QrCode, Link2, ClipboardList, Database, ImagePlus, LogOut, Eye, Menu, Moon, Settings, Sun, Undo2, UserCog, Users, X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import SiteLogo from '../ui/SiteLogo';
import { NotificationBell, ProfileMenu } from './HeaderMenus';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Kerangka panel gaya admin: sidebar dengan bagian, header dengan tanggal dan profil, lalu konten.
// Sidebar dan header berupa bilah kaca yang melayang dan tetap di tempat; hanya konten yang bergulir.
// Dipakai untuk peran user dan super admin. Menu berbeda menurut peran.
// Di ponsel sidebar disembunyikan dan dibuka lewat tombol hamburger.
const USER_ITEMS = [
  { label: 'QR Generator', to: '/dashboard/qr', icon: QrCode },
  { label: 'Linktree', to: '/dashboard/linktree', icon: Link2 },
  { label: 'Twibbon', to: '/dashboard/twibbon', icon: ImagePlus },
];

// Super admin melihat menu admin, ditambah dashboard pengguna untuk QR, Linktree, dan Twibbon miliknya sendiri.
const MENUS = {
  user: [{ section: 'Utama', items: USER_ITEMS }],
  superadmin: [
    {
      section: 'Pemesanan',
      items: [
        { label: 'Statistik', to: '/admin/statistik', icon: BarChart3 },
        { label: 'Data QR', to: '/admin', icon: ClipboardList, end: true },
        { label: 'Data Linktree', to: '/admin/linktree', icon: Database },
        { label: 'Data Twibbon', to: '/admin/twibbon', icon: Images },
      ],
    },
    // Tools Admin: QR, Linktree, dan Twibbon milik admin sendiri. QR buatan admin memakai fitur Premium tanpa biaya.
    { section: 'Tools Admin', items: USER_ITEMS },
    {
      section: 'Pengaturan',
      items: [
        { label: 'Pengaturan', to: '/admin/pengaturan', icon: Settings },
        { label: 'Users', to: '/admin/users', icon: Users },
        // Tombol keluar ikut di bagian ini (action, bukan tautan).
        { label: 'Keluar', action: 'logout', icon: LogOut },
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
  const { user, signOut, stopImpersonating } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = user?.role === 'superadmin' ? 'superadmin' : 'user';
  const menu = MENUS[role];
  const displayName = user?.name || user?.username || '';

  // Saat super admin sedang masuk sebagai pengguna, keluar berarti kembali ke akun admin.
  const onLogout = async () => {
    const backToAdmin = await signOut();
    navigate(backToAdmin ? '/admin/users' : '/masuk', { replace: true });
  };

  const [leaving, setLeaving] = useState(false);
  const backToAdmin = async () => {
    setLeaving(true);
    const ok = await stopImpersonating();
    navigate(ok ? '/admin/users' : '/masuk', { replace: true });
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
        <SiteLogo className="h-6 w-6 shrink-0 text-[#034AFC] dark:text-[#5B86FF] md:h-7 md:w-7" />
        <div className="min-w-0 leading-tight">
          <p className="text-[14px] font-semibold tracking-tight text-primary md:text-[15px]">OpenTools</p>
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

    <nav className="mt-6 min-h-0 flex-1 space-y-6 overflow-y-auto md:mt-7">
      {menu.map((group) => (
        <div key={group.section}>
          <p className="px-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-tertiary md:text-[11px]">{group.section}</p>
          <div className="mt-2 space-y-1">
            {group.items.map((item) =>
              item.action === 'logout' ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-2.5 rounded-full px-3.5 py-2 text-[13px] transition-smooth md:py-2.5 md:text-[14px] w-full text-left text-danger hover:bg-red-500/10"
                >
                  <item.icon size={17} strokeWidth={1.75} />
                  {item.label}
                </button>
              ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-full px-3.5 py-2 text-[13px] transition-smooth md:py-2.5 md:text-[14px] ${
                    isActive
                      ? 'bg-blue-500 font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_20px_-12px_rgba(37,99,235,0.9)]'
                      : 'text-secondary hover:bg-black/[0.05] hover:text-primary dark:hover:bg-white/10'
                  }`
                }
              >
                <item.icon size={17} strokeWidth={1.75} />
                {item.label}
              </NavLink>
              )
            )}
          </div>
        </div>
      ))}
    </nav>

    {/* Ponsel: nama akun tampil di sini, karena header hanya menampilkan foto profil. */}
    <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-border px-3 py-2 md:hidden">
      <Avatar user={user} className="h-8 w-8 text-[12px]" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[13px] font-medium text-primary">{displayName}</p>
        <p className="text-[11px] text-tertiary">{ROLE_LABEL[role]}</p>
      </div>
    </div>

    {/* Panel user: tombol keluar di dasar sidebar. Panel super admin menaruhnya di bagian Pengaturan. */}
    {!menu.some((group) => group.items.some((item) => item.action === 'logout')) && (
      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-2.5 rounded-full px-3.5 py-2 text-[13px] transition-smooth md:py-2.5 md:text-[14px] mt-2 text-danger hover:bg-red-500/10 md:mt-4"
      >
        <LogOut size={17} strokeWidth={1.75} />
        Keluar
      </button>
    )}
    </>
  );

  return (
    <div className="panel-compact min-h-screen flex-1 md:flex">
      {/* Sidebar layar besar: bilah kaca yang melayang di sisi kiri dan tetap di tempat saat halaman digulir. */}
      <aside aria-label="Menu panel" className="hidden shrink-0 self-start p-3 pr-0 md:sticky md:top-0 md:flex md:h-screen md:w-[268px]">
        <div className="glass flex min-h-0 w-full flex-col rounded-[28px] px-3 py-5">{sidebar}</div>
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
            className={`fixed inset-y-0 left-0 z-[60] flex w-[264px] max-w-[82vw] flex-col rounded-r-[28px] border-r border-border bg-card px-3 py-4 transition-[transform,visibility] duration-200 ease-out motion-reduce:transition-none ${
              menuOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
            }`}
          >
            {sidebar}
          </aside>
        </div>,
        document.body
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bilah atas: tetap di tempat saat konten digulir. */}
        <div className="sticky top-0 z-30 px-2 pt-2 sm:px-3 sm:pt-3 md:px-4">
        {/* Super admin sedang masuk sebagai pengguna: tanda yang selalu terlihat, dengan jalan kembali */}
        {user?.impersonated && (
          <div role="status" className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-[20px] bg-amber-500 px-3 py-2 text-[12px] text-black shadow-[0_10px_24px_-16px_rgba(180,83,9,0.9)] sm:px-4 sm:text-[13px]">
            <p className="flex min-w-0 items-center gap-2">
              <UserCog size={15} strokeWidth={2} aria-hidden="true" className="shrink-0" />
              <span className="min-w-0 [overflow-wrap:anywhere]">
                Kamu masuk sebagai <strong className="font-semibold">{displayName || user.email}</strong>
                {user.email && displayName ? ` (${user.email})` : ''}. Perubahan tersimpan di akun ini.
              </span>
            </p>
            <button
              type="button"
              onClick={backToAdmin}
              disabled={leaving}
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-black px-3 text-[12px] font-medium text-white transition-smooth hover:bg-black/80 disabled:opacity-60"
            >
              <Undo2 size={13} strokeWidth={2} aria-hidden="true" /> {leaving ? 'Kembali...' : 'Kembali ke admin'}
            </button>
          </div>
        )}
        {/* Header */}
        <header className="glass glass-blur flex items-center justify-between gap-2 rounded-full px-2 py-1.5 sm:gap-3 sm:py-2 sm:pl-4 sm:pr-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Buka menu"
              aria-expanded={menuOpen}
              aria-controls="panel-sidebar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-smooth hover:border-border-hover md:hidden"
            >
              <Menu size={16} strokeWidth={1.75} />
            </button>
            <Link to={role === 'superadmin' ? '/admin' : '/dashboard'} className="flex items-center gap-2 md:hidden">
              <SiteLogo className="h-5 w-5 shrink-0 text-[#034AFC] dark:text-[#5B86FF]" />
              <span className="text-[13px] font-semibold tracking-tight text-primary">OpenTools</span>
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
        </div>

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 md:px-8 md:py-7">
          <CrumbContext.Provider value={title}>{children}</CrumbContext.Provider>
        </main>

        {/* Footer panel: sama dengan footer situs */}
        <footer className="flex flex-col gap-2 px-3 pb-4 pt-2 text-[11px] text-tertiary sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:pb-5 sm:text-[12px] md:px-8">
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
