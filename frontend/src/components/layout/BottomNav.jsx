import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart2, Plus, ArrowLeftRight, Link2, Minimize, ImagePlus, QrCode, ScanLine, Layers, FileStack } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Widget menu bawah: hanya ikon. Di ponsel tombolnya 28 px supaya 11 ikon muat di layar 360 px.
// Namanya tampil sebagai keterangan saat ikon disorot (desktop)
// dan dibaca pembaca layar (aria-label). Kelompok: alat file, alat PDF, lalu fitur lain.
const DIVIDER = 'divider';

export default function BottomNav() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const items = [
    { to: '/', label: t('nav.home'), icon: Home, active: pathname === '/' },
    { to: '/converters', label: t('nav.converters'), icon: ArrowLeftRight, active: pathname === '/converters' || pathname.startsWith('/convert/') },
    { to: '/compressors', label: t('nav.compressors'), icon: Minimize, active: pathname === '/compressors' || pathname.startsWith('/compress/') },
    DIVIDER,
    { to: '/pdf/scan', label: t('nav.scan_pdf'), icon: ScanLine, active: pathname === '/pdf/scan' },
    { to: '/pdf/gabung', label: t('nav.merge_pdf'), icon: Layers, active: pathname === '/pdf/gabung' },
    { to: '/pdf/atur', label: t('nav.organize_pdf'), icon: FileStack, active: pathname === '/pdf/atur' },
    DIVIDER,
    { to: '/campaigns', label: t('nav.twibbon'), icon: ImagePlus, active: pathname.startsWith('/campaigns') || pathname.startsWith('/c/') || pathname.startsWith('/twibbon') },
    { to: '/qr', label: t('nav.qr'), icon: QrCode, active: pathname.startsWith('/qr') },
    { to: '/linktree', label: t('nav.linktree'), icon: Link2, active: pathname.startsWith('/linktree') },
    { to: '/overview', label: t('nav.stats'), icon: BarChart2, active: pathname === '/overview' },
  ];

  return (
    <nav aria-label={t('nav.quick_menu')} className="fixed bottom-3 left-1/2 z-40 max-w-[calc(100vw-16px)] -translate-x-1/2 sm:bottom-6">
      <div className="glass glass-blur flex h-[42px] items-center gap-0 rounded-full px-1 sm:h-[54px] sm:gap-1 sm:px-2">
        {items.map((item, i) =>
          item === DIVIDER ? (
            <span key={`d${i}`} aria-hidden="true" className="mx-[3px] h-4 w-px shrink-0 bg-border sm:mx-1 sm:h-5" />
          ) : (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={item.active ? 'page' : undefined}
              className={`group relative flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-[40px] sm:w-[40px] ${
                item.active
                  ? 'bg-blue-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
                  : 'text-secondary hover:bg-white/50 hover:text-primary dark:hover:bg-white/10'
              }`}
            >
              <item.icon size={18} strokeWidth={1.75} aria-hidden="true" className="max-sm:h-4 max-sm:w-4" />
              {/* Keterangan nama menu saat disorot. Tidak tampil di layar sentuh. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-black px-2.5 py-1 text-[11px] font-medium text-card opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:hover)]:block"
              >
                {item.label}
              </span>
            </Link>
          )
        )}

        <span aria-hidden="true" className="mx-[3px] h-4 w-px shrink-0 bg-border sm:mx-1 sm:h-5" />

        {/* Konversi banyak file sekaligus */}
        <Link
          to="/batch"
          aria-label={t('nav.batch')}
          className="group relative flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-accent-black text-white transition-smooth hover:bg-accent-black-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-black focus-visible:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:ring-white sm:h-[40px] sm:w-[40px]"
        >
          <Plus size={20} strokeWidth={2} aria-hidden="true" className="max-sm:h-[18px] max-sm:w-[18px]" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-black px-2.5 py-1 text-[11px] font-medium text-card opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:hover)]:block"
          >
            {t('nav.batch')}
          </span>
        </Link>
      </div>
    </nav>
  );
}
