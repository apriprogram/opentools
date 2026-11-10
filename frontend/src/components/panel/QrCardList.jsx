import React, { useMemo } from 'react';
import { Download, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Countdown from '../ui/Countdown';
import { useToast } from '../ui/Toast';
import { buildQrSvg, svgToPngBlob, downloadBlob } from '../../lib/qrCode';
import { deleteMyQr } from '../../services/authApi';
import { tanggal } from './OrderParts';

const STATUS_TEXT = {
  aktif: 'Premium Gold aktif',
  gratis: 'Paket gratis',
  berakhir: 'Masa berlaku habis',
  nonaktif: 'Dinonaktifkan admin',
};

// Daftar QR milik pengguna. QR yang paket berbayarnya aktif tampil dengan gaya Premium Gold.
export default function QrCardList({ items, logoUrl, onChanged }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((qr) => (
        <QrCard key={qr.id} qr={qr} logoUrl={logoUrl} onChanged={onChanged} />
      ))}
    </div>
  );
}

function QrCard({ qr, logoUrl, onChanged }) {
  const { addToast: toast } = useToast();
  const premium = qr.status === 'aktif';

  const svg = useMemo(() => {
    try {
      return buildQrSvg({
        text: qr.link,
        fg: qr.fg,
        bg: qr.bg,
        logoDataUrl: qr.logo ? logoUrl : null,
        size: 512,
      });
    } catch {
      return '';
    }
  }, [qr, logoUrl]);

  const base = `qr-${qr.id.slice(0, 8)}`;

  const downloadPng = async () => {
    try {
      const blob = await svgToPngBlob(svg, 1024);
      downloadBlob(blob, `${base}.png`);
    } catch {
      toast({ type: 'error', title: 'Gagal mengunduh', message: 'QR tidak bisa diunduh sebagai PNG.' });
    }
  };

  const downloadSvg = () => {
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${base}.svg`);
  };

  const remove = async () => {
    if (!window.confirm('Hapus QR ini dari akun Anda?')) return;
    try {
      await deleteMyQr(qr.id);
      toast({ type: 'success', title: 'QR dihapus' });
      onChanged();
    } catch {
      toast({ type: 'error', title: 'Gagal menghapus', message: 'Coba lagi beberapa saat.' });
    }
  };

  // Teks di kartu Premium Gold memakai warna cokelat tua agar terbaca di atas latar emas.
  const tone = premium ? 'text-[#3D2B06]' : 'text-primary';
  const muted = premium ? 'text-[#5C4512]' : 'text-secondary';

  return (
    <div className={`flex flex-col gap-4 rounded-2xl border p-5 ${premium ? 'premium-gold' : 'border-border bg-card'}`}>
      <div className="flex gap-4">
        <div
          className="h-[112px] w-[112px] shrink-0 rounded-xl border border-border p-2 [&>svg]:h-full [&>svg]:w-full"
          style={{ background: qr.bg }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${premium ? 'text-[#5C4512]' : 'text-tertiary'}`}>
            {premium ? 'Premium Gold' : 'Gratis'}
          </p>
          <p className={`mt-1 break-all text-[14px] font-medium leading-[20px] line-clamp-2 ${tone}`} title={qr.link}>
            {qr.link}
          </p>
          <p className={`mt-2 text-[12px] ${muted}`}>{STATUS_TEXT[qr.status] || 'Paket gratis'}</p>
          {premium && qr.planExpiresAt ? (
            <p className={`text-[12px] ${muted}`}>
              Sisa <Countdown expiresAt={qr.planExpiresAt} className={`font-semibold ${tone}`} />
            </p>
          ) : (
            <p className={`text-[12px] ${muted}`}>Dibuat {tanggal(qr.createdAt)}</p>
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <Button size="sm" variant="primary" icon={Download} onClick={downloadPng} disabled={!svg}>PNG</Button>
        <Button size="sm" variant="secondary" icon={Download} onClick={downloadSvg} disabled={!svg}>SVG</Button>
        <Button size="sm" variant="ghost" icon={Trash2} onClick={remove}>Hapus</Button>
      </div>
    </div>
  );
}
