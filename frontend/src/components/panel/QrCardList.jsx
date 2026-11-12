import React, { useMemo, useState } from 'react';
import { Crown, Download, PencilLine, Power, PowerOff, Trash2 } from 'lucide-react';
import QrEditModal from './QrEditModal';
import { QrModal } from './LicenseQr';
import Button from '../ui/Button';
import Countdown from '../ui/Countdown';
import { useToast } from '../ui/Toast';
import { buildQrSvg, qrContent, svgToPngBlob, downloadBlob } from '../../lib/qrCode';
import { toggleQrActive } from './qrActions';
import { deleteMyQr } from '../../services/authApi';
import { tanggal } from './OrderParts';

const STATUS_TEXT = {
  aktif: 'Premium Gold aktif',
  gratis: 'Paket gratis',
  berakhir: 'Masa berlaku habis',
  nonaktif: 'Dinonaktifkan admin',
};

// Daftar QR milik pengguna. QR yang paket berbayarnya aktif tampil dengan gaya Premium Gold.
// adminFree: QR milik super admin, fitur Premium tanpa pesanan, jadi tombol beli dan perpanjang disembunyikan.
export default function QrCardList({ items, logoUrl, onChanged, onUpgrade, adminFree = false }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((qr) => (
        <QrCard key={qr.id} qr={qr} logoUrl={logoUrl} onChanged={onChanged} onUpgrade={onUpgrade} adminFree={adminFree} />
      ))}
    </div>
  );
}

function QrCard({ qr, logoUrl, onChanged, onUpgrade, adminFree }) {
  const { addToast: toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [copied, setCopied] = useState(false);
  const premium = qr.status === 'aktif';

  // Paket gratis: QR hitam putih dengan logo hitam. Berlaku juga untuk QR yang lisensinya sudah berakhir atau dinonaktifkan.
  const fg = premium ? qr.fg : '#000000';
  const bg = premium ? qr.bg : '#FFFFFF';
  // Logo hanya disembunyikan jika paket berbayar aktif dan pengguna memang mematikannya.
  const logoDataUrl = premium && !qr.logo ? null : logoUrl;

  // Gambar QR berisi alamat pindai (QR dinamis), bukan link langsung.
  const content = qrContent(qr);

  const svg = useMemo(() => {
    try {
      return buildQrSvg({
        text: content,
        fg,
        bg,
        logoDataUrl,
        size: 512,
      });
    } catch {
      return '';
    }
  }, [content, fg, bg, logoDataUrl]);

  const base = `qr-${qr.id.slice(0, 8)}`;

  const toggleActive = async () => {
    if (await toggleQrActive(qr, toast)) onChanged();
  };

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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(qr.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ type: 'error', title: 'Gagal menyalin', message: 'Salin link secara manual.' });
    }
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
        {/* Klik gambar QR untuk melihatnya dalam ukuran besar */}
        <button
          type="button"
          onClick={() => setZoomed(true)}
          disabled={!svg}
          aria-label="Perbesar QR"
          title="Klik untuk memperbesar"
          className="h-[112px] w-[112px] shrink-0 cursor-zoom-in rounded-xl border border-border p-2 transition-smooth hover:border-blue-500 focus-visible:border-blue-500 focus-visible:outline-none disabled:cursor-default [&>svg]:h-full [&>svg]:w-full"
          style={{ background: bg }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="min-w-0 flex-1">
          <p className={`select-none text-[11px] font-semibold uppercase tracking-wider ${premium ? 'text-[#5C4512]' : 'text-tertiary'}`}>
            {adminFree ? 'Tools Admin' : premium ? 'Premium Gold' : 'Gratis'}
          </p>
          <p className={`mt-1 break-all text-[14px] font-medium leading-[20px] line-clamp-2 ${tone}`} title={qr.link}>
            {qr.link}
          </p>
          <p className={`mt-2 text-[12px] ${muted}`}>{adminFree ? 'Fitur Premium, tanpa batas waktu' : STATUS_TEXT[qr.status] || 'Paket gratis'}</p>
          {qr.disabled && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white">
              <PowerOff size={11} strokeWidth={2} aria-hidden="true" /> Dinonaktifkan
            </p>
          )}
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
        {/* Link, warna, dan logo hanya bisa diedit ulang untuk QR Premium yang aktif. QR gratis tetap hitam putih. */}
        {premium && (
          <Button size="sm" variant="secondary" icon={PencilLine} onClick={() => setEditing(true)}>Edit QR</Button>
        )}
        {!adminFree && qr.status !== 'nonaktif' && (
          <Button size="sm" variant={qr.status === 'gratis' ? 'primary' : 'secondary'} icon={Crown} onClick={() => onUpgrade(qr)}>
            {qr.status === 'gratis' ? 'Jadikan Premium' : 'Perpanjang'}
          </Button>
        )}
        {/* Nonaktif: saat dipindai, QR menampilkan halaman "Link sudah tidak aktif" */}
        <Button size="sm" variant="secondary" icon={qr.disabled ? Power : PowerOff} onClick={toggleActive}>
          {qr.disabled ? 'Aktifkan' : 'Nonaktifkan'}
        </Button>
        <Button size="sm" variant="ghost" icon={Trash2} onClick={remove}>Hapus</Button>
      </div>

      {qr.disabled && (
        <p className={`text-[12px] leading-relaxed ${muted}`}>
          QR ini sedang nonaktif. Saat dipindai, yang tampil halaman "Link sudah tidak aktif", bukan link di atas.
        </p>
      )}
      {qr.legacyStatic && qr.dynamicAt && (
        <p className={`text-[12px] leading-relaxed ${muted}`}>
          Gambar QR yang diunduh sebelum {tanggal(qr.dynamicAt)} masih berisi link langsung. Unduh ulang supaya bisa dinonaktifkan dan diganti link-nya tanpa cetak ulang.
        </p>
      )}

      {zoomed && (
        <QrModal
          svg={svg}
          link={qr.link}
          title="QR kamu"
          caption={`${adminFree ? 'Tools Admin' : STATUS_TEXT[qr.status] || 'Paket gratis'}${qr.disabled ? ' · Dinonaktifkan' : ''}`}
          background={bg}
          onClose={() => setZoomed(false)}
          onPng={downloadPng}
          onSvg={downloadSvg}
          onCopy={copyLink}
          copied={copied}
        />
      )}

      {editing && (
        <QrEditModal
          qr={qr}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
