import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { QrCode, Link2, ClipboardList, LogOut, Bell, Eye, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Kerangka panel gaya admin: sidebar dengan bagian, header dengan tanggal dan profil, lalu konten.
// Dipakai untuk peran user dan super admin. Menu berbeda menurut peran.
const MENUS = {
  user: [
    {
      section: 'Utama',
      items: [
        { label: 'QR Generator', to: '/dashboard/qr', icon: QrCode },
        { label: 'Linktree', to: '/dashboard/linktree', icon: Link2 },
      ],
    },
  ],
  superadmin: [
    {
      section: 'Utama',
      items: [{ label: 'Konfirmasi Pesanan', to: '/admin', icon: ClipboardList }],
    },
  ],
};

const ROLE_LABEL = { user: 'User', superadmin: 'Super Admin' };

const todayLabel = () =>
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function PanelLayout({ title, children }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const role = user?.role === 'superadmin' ? 'superadmin' : 'user';
  const menu = MENUS[role];

  const onLogout = async () => {
    await signOut();
    navigate('/masuk', { replace: true });
  };

  return (
    <div className="min-h-screen flex-1 bg-card-muted/30 md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6">
        <Link to={role === 'superadmin' ? '/admin' : '/dashboard'} className="flex items-center gap-2.5 px-2">
          <img src="/qr-logo.svg" alt="" className="h-7 w-auto" />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold text-primary">OpenTools</p>
            <p className="text-[12px] text-tertiary">Panel {ROLE_LABEL[role]}</p>
          </div>
        </Link>

        <nav className="mt-8 flex-1 space-y-6">
          {menu.map((group) => (
            <div key={group.section}>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">{group.section}</p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] transition-smooth ${
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

        <button
          type="button"
          onClick={onLogout}
          className="mt-6 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-danger hover:bg-card-muted/60"
        >
          <LogOut size={17} strokeWidth={1.75} />
          Keluar
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:px-8">
          <div className="min-w-0">
            <p className="text-[13px] text-tertiary">
              Panel <span className="mx-1">›</span> <span className="text-secondary">{title}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] text-secondary lg:inline">{todayLabel()}</span>
            <span className="hidden h-5 w-px bg-border sm:inline-block" />
            <Eye size={17} className="hidden text-tertiary sm:block" />
            <Bell size={17} className="hidden text-tertiary sm:block" />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-secondary transition-smooth hover:text-primary"
            >
              {theme === 'dark' ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
            </button>
            <div className="flex items-center gap-2.5 rounded-full border border-border bg-card-muted/50 py-1 pl-1 pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-black text-[12px] font-semibold text-white dark:bg-white dark:text-black">
                {(user?.name || user?.username || 'A').slice(0, 1).toUpperCase()}
              </span>
              <div className="leading-tight">
                <p className="text-[13px] font-medium text-primary">{user?.name || user?.username}</p>
                <p className="text-[11px] text-tertiary">{ROLE_LABEL[role]}</p>
              </div>
            </div>
            <button type="button" onClick={onLogout} className="text-[13px] text-danger md:hidden">
              Keluar
            </button>
          </div>
        </header>

        {/* Navigasi ringkas untuk layar kecil */}
        <nav className="flex gap-2 overflow-x-auto border-b border-border bg-card px-4 py-2 md:hidden">
          {menu.flatMap((g) => g.items).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 rounded-full border px-3 py-1.5 text-[12px] ${
                  isActive ? 'border-primary bg-card-muted font-medium text-primary' : 'border-border text-secondary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>

        {/* Footer panel: sama dengan footer situs */}
        <footer className="flex flex-col gap-3 border-t border-border bg-card px-4 py-4 text-[12px] text-tertiary sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>
            © 2026 <span className="font-medium text-secondary">Apriprogram</span>. Hak cipta dilindungi undang-undang.
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
