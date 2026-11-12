import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { LOGO_PATH, LOGO_VIEWBOX } from '../lib/qrCode';
import LinktreeView, { pageBackground } from '../components/linktree/LinktreeView';
import { fetchLinktree, fetchPublicLinktree, recordLinktreeView } from '../services/linktreeApi';

// Halaman publik Linktree di /l/:slug. Bisa dibuka siapa saja tanpa masuk.
// Dengan ?pratinjau=<id>, pemilik yang sedang masuk bisa melihat Linktree-nya sendiri walau masih draf.
// Pratinjau tidak dihitung sebagai kunjungan, dan klik tautannya tidak dicatat.
export default function LinktreePublicPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const previewId = params.get('pratinjau');
  const [tree, setTree] = useState(null);
  const [status, setStatus] = useState('loading');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPreview(false);

    const loadPublic = () =>
      fetchPublicLinktree(slug).then((data) => {
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
      });

    // Pratinjau pemilik: ambil lewat API akun. Kalau gagal (belum masuk atau bukan pemilik), pakai halaman publik.
    const loadPreview = () =>
      fetchLinktree(previewId).then((data) => {
        if (cancelled) return;
        if (data.slug !== slug) throw new Error('alamat tidak cocok');
        setTree(data);
        setPreview(true);
        setStatus('ok');
        document.title = `Pratinjau ${data.title} | OpenTools`;
      });

    (previewId ? loadPreview().catch(loadPublic) : loadPublic()).catch(() => {
      if (!cancelled) setStatus('notfound');
    });

    return () => {
      cancelled = true;
    };
  }, [slug, previewId]);

  // Klik dicatat lewat sendBeacon agar tetap terkirim walau halaman langsung pindah ke tujuan.
  const onLinkClick = (item) => {
    if (preview) return;
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

  const badgeColor = tree.theme?.text || '#111111';

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ ...pageBackground(tree.theme), color: tree.theme?.text || '#111111' }}
    >
      {preview && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-black px-4 py-2 text-center text-[12px] text-white">
          <span>
            {tree.published
              ? 'Ini pratinjau halaman kamu. Kunjungan dan klik di sini tidak dihitung.'
              : 'Pratinjau draf. Halaman ini belum diterbitkan, jadi hanya kamu yang bisa melihatnya.'}
          </span>
          <Link to={`/dashboard/linktree/${tree.id}`} className="font-medium underline">Edit Linktree</Link>
        </div>
      )}
      <div className="flex-1">
        <LinktreeView tree={tree} onLinkClick={onLinkClick} />
      </div>
      {/* Lencana "Dibuat dengan OpenTools": kaca tipis yang warnanya mengikuti warna teks halaman. */}
      <div className="flex justify-center px-4 pb-4 pt-2">
        <Link
          to="/linktree"
          title="Buat Linktree kamu sendiri, gratis"
          className="group inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 text-[10px] leading-none transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] motion-reduce:transition-none"
          style={{
            color: badgeColor,
            background: `color-mix(in srgb, ${badgeColor} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${badgeColor} 22%, transparent)`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <span
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
            style={{ background: `color-mix(in srgb, ${badgeColor} 16%, transparent)` }}
          >
            <svg viewBox={LOGO_VIEWBOX} className="h-2 w-2.5" fill="currentColor" aria-hidden="true">
              <path d={LOGO_PATH} />
            </svg>
          </span>
          <span>
            <span className="opacity-70">Dibuat dengan</span> <span className="font-semibold">OpenTools</span>
          </span>
          <ArrowUpRight size={10} strokeWidth={2} aria-hidden="true" className="opacity-60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 motion-reduce:transition-none" />
        </Link>
      </div>
    </div>
  );
}
