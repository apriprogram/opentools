import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LinktreeView, { pageBackground } from '../components/linktree/LinktreeView';
import { fetchPublicLinktree, recordLinktreeView } from '../services/linktreeApi';

// Halaman publik Linktree di /l/:slug. Bisa dibuka siapa saja tanpa masuk.
export default function LinktreePublicPage() {
  const { slug } = useParams();
  const [tree, setTree] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchPublicLinktree(slug)
      .then((data) => {
        if (cancelled) return;
        setTree(data);
        setStatus('ok');
        document.title = `${data.title} | OpenTools`;
        // Kunjungan dihitung sekali per sesi browser untuk setiap halaman.
        try {
          const key = `lt-view:${slug}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            recordLinktreeView(slug).catch(() => {});
          }
        } catch {
          recordLinktreeView(slug).catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('notfound');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Klik dicatat lewat sendBeacon agar tetap terkirim walau halaman langsung pindah ke tujuan.
  const onLinkClick = (item) => {
    const url = `/api/v1/linktree/public/${encodeURIComponent(slug)}/click/${encodeURIComponent(item.id)}`;
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(url);
      else fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    } catch {
      /* pencatatan klik tidak boleh menghalangi tautan */
    }
  };

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center text-[13px] text-tertiary">Memuat...</div>;
  }

  if (status === 'notfound' || !tree) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[18px] font-semibold text-primary">Halaman tidak ditemukan</p>
        <p className="text-[13px] text-secondary">Linktree ini belum diterbitkan atau alamatnya salah.</p>
        <Link to="/linktree" className="mt-2 text-[13px] underline text-primary">Buat Linktree Anda sendiri</Link>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ ...pageBackground(tree.theme), color: tree.theme?.text || '#111111' }}
    >
      <div className="flex-1">
        <LinktreeView tree={tree} onLinkClick={onLinkClick} />
      </div>
      <div className="py-4 text-center text-[12px] opacity-70">
        <Link to="/linktree" className="underline hover:opacity-100">Dibuat dengan OpenTools</Link>
      </div>
    </div>
  );
}
