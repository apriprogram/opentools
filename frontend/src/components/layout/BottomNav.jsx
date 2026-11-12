import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart2, Plus, ArrowLeftRight, Link2, Minimize, ImagePlus, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BottomNav({ onOpenBatchModal, onScrollToStats }) {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="glass h-[46px] sm:h-[56px] px-1.5 sm:px-2 rounded-full flex items-center gap-0.5 sm:gap-2">
        {/* Home Tab */}
        <Link
          to="/"
          className={`h-[34px] sm:h-[40px] px-2.5 sm:px-3.5 rounded-full flex items-center gap-1.5 transition-smooth [&>svg]:max-sm:h-4 [&>svg]:max-sm:w-4 ${
            location.pathname === '/'
              ? 'bg-blue-500 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
              : 'text-secondary hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
          }`}
          title="Explore"
        >
          <Home size={18} strokeWidth={1.75} />
          <span className="hidden sm:inline text-[12px] whitespace-nowrap">Explore</span>
        </Link>

        {/* Converter Tab */}
        <Link
          to="/converters"
          className={`h-[34px] sm:h-[40px] px-2.5 sm:px-3.5 rounded-full flex items-center gap-1.5 transition-smooth [&>svg]:max-sm:h-4 [&>svg]:max-sm:w-4 ${
            location.pathname === '/converters'
              ? 'bg-blue-500 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
              : 'text-secondary hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
          }`}
          title={t('home.converters_title', 'Converters')}
        >
          <ArrowLeftRight size={18} strokeWidth={1.75} />
          <span className="hidden sm:inline text-[12px] whitespace-nowrap">{t('home.converters_title', 'Converters')}</span>
        </Link>

        {/* Compressor Tab */}
        <Link
          to="/compressors"
          className={`h-[34px] sm:h-[40px] px-2.5 sm:px-3.5 rounded-full flex items-center gap-1.5 transition-smooth [&>svg]:max-sm:h-4 [&>svg]:max-sm:w-4 ${
            location.pathname === '/compressors'
              ? 'bg-blue-500 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
              : 'text-secondary hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
          }`}
          title={t('home.compressors_title', 'Compressors')}
        >
          <Minimize size={18} strokeWidth={1.75} />
          <span className="hidden sm:inline text-[12px] whitespace-nowrap">{t('home.compressors_title', 'Compressors')}</span>
        </Link>

        {/* Twibbon Tab */}
        <Link
          to="/campaigns"
          className={`h-[34px] sm:h-[40px] px-2.5 sm:px-3.5 rounded-full flex items-center gap-1.5 transition-smooth [&>svg]:max-sm:h-4 [&>svg]:max-sm:w-4 ${
            location.pathname.startsWith('/campaigns') || location.pathname.startsWith('/c/') || location.pathname.startsWith('/twibbon')
              ? 'bg-blue-500 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
              : 'text-secondary hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
          }`}
          title="Twibbon"
        >
          <ImagePlus size={18} strokeWidth={1.75} />
          <span className="hidden sm:inline text-[12px] whitespace-nowrap">Twibbon</span>
        </Link>

        {/* QR Generator Tab */}
        <Link
          to="/qr"
          className={`h-[34px] sm:h-[40px] px-2.5 sm:px-3.5 rounded-full flex items-center gap-1.5 transition-smooth [&>svg]:max-sm:h-4 [&>svg]:max-sm:w-4 ${
            location.pathname.startsWith('/qr')
              ? 'bg-blue-500 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
              : 'text-secondary hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
          }`}
          title="QR Generator"
        >
          <QrCode size={18} strokeWidth={1.75} />
          <span className="hidden sm:inline text-[12px] whitespace-nowrap">QR</span>
        </Link>

        {/* Linktree Tab */}
        <Link
          to="/linktree"
          className={`h-[34px] sm:h-[40px] px-2.5 sm:px-3.5 rounded-full flex items-center gap-1.5 transition-smooth [&>svg]:max-sm:h-4 [&>svg]:max-sm:w-4 ${
            location.pathname.startsWith('/linktree')
              ? 'bg-blue-500 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
              : 'text-secondary hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
          }`}
          title="Linktree"
        >
          <Link2 size={18} strokeWidth={1.75} />
          <span className="hidden sm:inline text-[12px] whitespace-nowrap">Linktree</span>
        </Link>

        {/* Stats Tab */}
        <Link
          to="/overview"
          className={`h-[34px] sm:h-[40px] px-2.5 sm:px-3.5 rounded-full flex items-center gap-1.5 transition-smooth [&>svg]:max-sm:h-4 [&>svg]:max-sm:w-4 ${
            location.pathname === '/overview'
              ? 'bg-blue-500 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
              : 'text-secondary hover:text-primary hover:bg-white/50 dark:hover:bg-white/10'
          }`}
          title="Statistics"
        >
          <BarChart2 size={18} strokeWidth={1.75} />
          <span className="hidden sm:inline text-[12px] whitespace-nowrap">Overview</span>
        </Link>

        {/* Separator */}
        <div className="w-[1px] h-4 sm:h-5 bg-border mx-0.5" />

        {/* Batch Plus Button (44x44px solid black circle, white plus icon) */}
        <Link
          to="/batch"
          className="w-[34px] h-[34px] sm:w-[40px] sm:h-[40px] rounded-full [&>svg]:max-sm:h-[18px] [&>svg]:max-sm:w-[18px] bg-accent-black dark:bg-white hover:bg-accent-black-hover dark:hover:bg-zinc-200 text-white dark:text-black flex items-center justify-center transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-black dark:focus-visible:ring-white"
          title="Import Multiple Files"
        >
          <Plus size={20} strokeWidth={2} />
        </Link>
      </div>
    </nav>
  );
}
