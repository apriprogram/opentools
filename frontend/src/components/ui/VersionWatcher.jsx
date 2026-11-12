import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { currentBuild, latestBuild } from '../../lib/versionCheck';

const CHECK_GAP_MS = 60 * 1000; // jarak minimal antar pengecekan
const TIMER_MS = 5 * 60 * 1000; // pengecekan berkala selama tab terbuka
const RELOAD_KEY = 'ot-reloaded-for';

// Memastikan pengunjung selalu memakai versi situs terbaru setelah deploy.
// - Saat halaman dibuka atau berpindah halaman: bila ada versi baru, tab dimuat ulang sendiri
//   (aman, karena di saat itu belum ada isian yang sedang diketik).
// - Saat tab sudah lama terbuka: muncul tombol kecil "Muat ulang", supaya isian yang belum disimpan tidak hilang.
export default function VersionWatcher() {
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);
  const state = useRef({ current: '', latest: '', lastCheck: 0 });

  // Muat ulang sekali untuk satu versi. Kalau setelah dimuat ulang versinya masih berbeda, jangan mengulang terus.
  const reloadOnce = useCallback((target) => {
    try {
      if (sessionStorage.getItem(RELOAD_KEY) === target) return false;
      sessionStorage.setItem(RELOAD_KEY, target);
    } catch {
      return false;
    }
    window.location.reload();
    return true;
  }, []);

  const check = useCallback(
    async (auto) => {
      const s = state.current;
      if (!s.current) return; // mode pengembangan
      if (!s.latest || s.latest === s.current) {
        if (Date.now() - s.lastCheck < CHECK_GAP_MS) return;
        s.lastCheck = Date.now();
        try {
          s.latest = await latestBuild();
        } catch {
          s.latest = '';
        }
      }
      if (!s.latest || s.latest === s.current) return;
      if (auto && reloadOnce(s.latest)) return;
      setReady(true);
    },
    [reloadOnce]
  );

  // Halaman dibuka dan setiap pindah halaman.
  useEffect(() => {
    if (!state.current.current) state.current.current = currentBuild();
    check(true);
  }, [pathname, check]);

  // Tab kembali dibuka setelah ditinggal, dan pengecekan berkala.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') check(false);
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(onVisible, TIMER_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [check]);

  if (!ready) return null;

  const reloadNow = () => {
    try {
      sessionStorage.setItem(RELOAD_KEY, state.current.latest);
    } catch {
      /* penyimpanan sesi tidak tersedia */
    }
    window.location.reload();
  };

  return createPortal(
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-[9990] flex w-max max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card py-1.5 pl-4 pr-1.5 text-[12px] text-secondary shadow-menu dark:shadow-menu-dark sm:bottom-5 sm:text-[13px]"
    >
      <span>Versi baru tersedia.</span>
      <button
        type="button"
        onClick={reloadNow}
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-black px-3 text-[12px] font-medium text-white transition-smooth hover:opacity-90 dark:bg-white dark:text-black sm:text-[13px]"
      >
        <RefreshCw size={13} strokeWidth={2} aria-hidden="true" /> Muat ulang
      </button>
    </div>,
    document.body
  );
}
