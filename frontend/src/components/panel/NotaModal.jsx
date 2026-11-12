import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { downloadBlob } from '../../lib/qrCode';
import { fetchMyNota, fetchMyNotaPdf } from '../../services/authApi';

// Nota pesanan dalam modal. Isi nota ditampilkan di dalam frame, dan PDF bisa diunduh.
export default function NotaModal({ code, onClose }) {
  const { addToast: toast } = useToast();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    let alive = true;
    let objectUrl = '';
    fetchMyNota(code)
      .then((blob) => {
        objectUrl = URL.createObjectURL(new Blob([blob], { type: 'text/html' }));
        if (alive) setUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        if (alive) setError('Nota tidak bisa dimuat.');
      });
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      closeRef.current();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      alive = false;
      window.removeEventListener('keydown', onKey, true);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [code]);

  const downloadPdf = async () => {
    try {
      const blob = await fetchMyNotaPdf(code);
      downloadBlob(blob, `nota-${code}.pdf`);
    } catch {
      toast({ type: 'error', title: 'Gagal mengunduh', message: 'PDF nota tidak bisa dibuat.' });
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      onClick={() => closeRef.current()}
      role="dialog"
      aria-modal="true"
      aria-label={`Nota pesanan ${code}`}
    >
      <div className="flex h-[88vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[14px] font-semibold text-primary">Nota pesanan {code}</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" icon={Download} onClick={downloadPdf}>Unduh PDF</Button>
            <button
              type="button"
              onClick={() => closeRef.current()}
              aria-label="Tutup"
              className="rounded-md p-1 text-secondary transition-smooth hover:text-primary"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
          {url ? (
            <iframe src={url} title={`Nota ${code}`} className="h-full w-full border-0" />
          ) : (
            <span className="text-[13px] text-tertiary">{error || 'Memuat nota...'}</span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
