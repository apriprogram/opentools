import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { fetchMyProof } from '../../services/authApi';

// Bukti transfer. Pengguna memakai fetchMyProof; super admin mengirim fetcher sendiri (endpoint admin).
// Gambar diambil saat dibutuhkan dan dibersihkan saat komponen dilepas.
export const useProofImage = (code, fetcher) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let alive = true;
    let objectUrl = '';
    fetcherRef.current(code)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (alive) setUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        if (alive) setError('Bukti tidak bisa dimuat.');
      });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [code]);

  return { url, error };
};

// Kotak kecil di tabel. Klik membuka modal.
export function ProofThumb({ code, fetcher = fetchMyProof, onOpen }) {
  const { url } = useProofImage(code, fetcher);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Lihat bukti transfer"
      title="Lihat bukti transfer"
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card-muted transition-smooth hover:border-border-focus"
    >
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-tertiary">...</span>}
    </button>
  );
}

// Modal lihat bukti. details berisi pasangan [label, nilai] untuk data pembayaran.
export default function ProofModal({ code, onClose, fetcher = fetchMyProof, details = null }) {
  const { url, error } = useProofImage(code, fetcher);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      closeRef.current();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      onClick={() => closeRef.current()}
      role="dialog"
      aria-modal="true"
      aria-label={`Bukti transfer ${code}`}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-primary">Bukti transfer {code}</p>
          <button
            type="button"
            onClick={() => closeRef.current()}
            aria-label="Tutup"
            className="rounded-md p-1 text-secondary transition-smooth hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-border bg-card-muted/40 p-2">
          {url ? (
            <img src={url} alt={`Bukti transfer ${code}`} className="max-h-[60vh] w-auto rounded-md object-contain" />
          ) : (
            <span className="text-[13px] text-tertiary">{error || 'Memuat bukti...'}</span>
          )}
        </div>

        {details && details.length > 0 && (
          <dl className="mt-4 divide-y divide-border rounded-xl border border-border">
            {details.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 px-3 py-2.5 text-[13px]">
                <dt className="shrink-0 text-tertiary">{label}</dt>
                <dd className="break-words text-right text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>,
    document.body
  );
}
