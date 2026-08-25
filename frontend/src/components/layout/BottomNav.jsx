import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, BarChart2, Plus } from 'lucide-react';

export default function BottomNav({ onOpenBatchModal, onScrollToStats }) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="h-[64px] px-3 bg-card border border-border rounded-full flex items-center gap-1.5 sm:gap-3 shadow-subtle-modal">
        {/* Home Tab */}
        <Link
          to="/"
          className={`h-[44px] px-4 rounded-full flex items-center gap-2 transition-smooth ${
            location.pathname === '/'
              ? 'bg-card-muted text-primary font-medium'
              : 'text-tertiary hover:text-primary hover:bg-card-muted/60'
          }`}
          title="Home"
        >
          <Home size={22} strokeWidth={1.75} />
          <span className="hidden sm:inline text-[13px]">Explore</span>
        </Link>

        {/* Stats Tab */}
        <Link
          to="/overview"
          className={`h-[44px] px-4 rounded-full flex items-center gap-2 transition-smooth ${
            location.pathname === '/overview'
              ? 'bg-card-muted text-primary font-medium'
              : 'text-tertiary hover:text-primary hover:bg-card-muted/60'
          }`}
          title="Statistics"
        >
          <BarChart2 size={22} strokeWidth={1.75} />
          <span className="hidden sm:inline text-[13px]">Overview</span>
        </Link>

        {/* Separator */}
        <div className="w-[1px] h-6 bg-border mx-1" />

        {/* Batch Plus Button (44x44px solid black circle, white plus icon) */}
        <Link
          to="/batch"
          className="w-[44px] h-[44px] rounded-full bg-accent-black dark:bg-white hover:bg-accent-black-hover dark:hover:bg-zinc-200 text-white dark:text-black flex items-center justify-center transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-black dark:focus-visible:ring-white"
          title="Import Multiple Files"
        >
          <Plus size={22} strokeWidth={2} />
        </Link>
      </div>
    </nav>
  );
}
