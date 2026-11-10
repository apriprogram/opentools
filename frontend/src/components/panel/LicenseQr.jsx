import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, CheckCheck, ExternalLink, Download, X } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { buildQrSvg, svgToPngBlob, downloadBlob } from '../../lib/qrCode';

// Link aktivasi lisensi: membuka halaman QR Generator dan mengaktifkan kode lisensi di browser itu.
export const licenseLink = (licenseKey) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/qr?lisensi=${encodeURIComponent(licenseKey)}`;
};

// Barcode (QR) dan link untuk pesanan yang sudah lunas. Dipakai di dashboard user dan panel admin.
// Klik gambar QR membuka modal dengan ukuran besar dan tombol unduh.
export default function LicenseQr({ licenseKey }) {
  const { addToast: toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const link = licenseLink(licenseKey);

  const svg = useMemo(() => {
    try {
      return buildQrSvg({ text: link, fg: '#111111', bg: '#FFFFFF', size: 512 });
    } catch {
      return '';
    }
  }, [link]);

  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = () => {
    navigator.clipboard?.writeText(link);
    setCopied(true);
  };

  const downloadPng = async () => {
    try {
      const blob = await svgToPngBlob(svg, 1024);
      downloadBlob(blob, `qr-lisensi-${licenseKey}.png`);
    } catch {
      toast({ type: 'error', title: 'Gagal mengunduh', message: 'QR tidak bisa diunduh sebagai PNG.' });
    }
  };

  const downloadSvg = () => {
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `qr-lisensi-${licenseKey}.svg`);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Perbesar barcode lisensi"
          title="Klik untuk memperbesar"
          className="h-16 w-16 shrink-0 cursor-zoom-in rounded-md border border-border bg-white p-1 transition-smooth hover:border-border-focus [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="min-w-0">
          <p className="text-[11px] text-tertiary">Barcode dan link lisensi</p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-[260px] truncate text-[12px] font-medium text-primary underline"
            title={link}
          >
            {link}
          </a>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-[11px] text-secondary hover:text-primary">
              {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
              {copied ? 'Disalin' : 'Salin link'}
            </button>
            <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-secondary hover:text-primary">
              <ExternalLink size={12} /> Buka
            </a>
            <button type="button" onClick={downloadPng} className="inline-flex items-center gap-1 text-[11px] text-secondary hover:text-primary">
              <Download size={12} /> Unduh QR
            </button>
          </div>
        </div>
      </div>

      {open && (
        <QrModal
          svg={svg}
          link={link}
          licenseKey={licenseKey}
          onClose={() => setOpen(false)}
          onPng={downloadPng}
          onSvg={downloadSvg}
          onCopy={copy}
          copied={copied}
        />
      )}
    </>
  );
}

function QrModal({ svg, link, licenseKey, onClose, onPng, onSvg, onCopy, copied }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
      onClick={() => closeRef.current()}
      role="dialog"
      aria-modal="true"
      aria-label={`QR lisensi ${licenseKey}`}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-primary">QR lisensi</p>
          <button
            type="button"
            onClick={() => closeRef.current()}
            aria-label="Tutup"
            className="rounded-md p-1 text-secondary transition-smooth hover:text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-auto aspect-square w-full max-w-[320px] rounded-xl border border-border bg-white p-4 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />

        <p className="mt-4 break-all text-center font-mono text-[12px] text-primary">{licenseKey}</p>
        <p className="mt-1 break-all text-center text-[11px] text-tertiary">{link}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="primary" icon={Download} onClick={onPng}>Unduh PNG</Button>
          <Button variant="secondary" icon={Download} onClick={onSvg}>Unduh SVG</Button>
          <Button variant="secondary" icon={copied ? CheckCheck : Copy} onClick={onCopy} className="col-span-2">
            {copied ? 'Link disalin' : 'Salin link'}
          </Button>
        </div>
      </div>
    </div>
  );
}
