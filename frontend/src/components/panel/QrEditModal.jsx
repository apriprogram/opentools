import React, { useMemo, useState } from 'react';
import { Palette, RotateCcw, Save } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import DetailModal from './DetailModal';
import { buildQrSvg, contrastRatio } from '../../lib/qrCode';
import { updateMyQr } from '../../services/authApi';

const COLOR_INPUT = 'h-9 w-9 shrink-0 cursor-pointer rounded-sm border border-border bg-transparent p-0.5';

function ColorField({ id, label, value, onChange }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5 rounded-md border border-border px-2.5 py-2">
      <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className={COLOR_INPUT} />
      <span className="min-w-0 leading-tight">
        <span className="block text-[12px] text-secondary">{label}</span>
        <span className="block font-mono text-[12px] uppercase text-primary sm:text-[13px]">{value}</span>
      </span>
    </label>
  );
}

// Edit ulang tampilan QR Premium: warna QR, warna latar, dan logo. Link QR tidak berubah,
// jadi QR yang sudah dicetak tetap mengarah ke link yang sama.
export default function QrEditModal({ qr, onClose, onSaved }) {
  const { addToast: toast } = useToast();
  const [fg, setFg] = useState(qr.fg);
  const [bg, setBg] = useState(qr.bg);
  const [logo, setLogo] = useState(qr.logo);
  const [saving, setSaving] = useState(false);

  const svg = useMemo(() => {
    try {
      return buildQrSvg({ text: qr.link, fg, bg, logo, size: 512 });
    } catch {
      return '';
    }
  }, [qr.link, fg, bg, logo]);

  const sameColor = fg.toLowerCase() === bg.toLowerCase();
  const lowContrast = !sameColor && contrastRatio(fg, bg) < 3;
  const changed = fg.toLowerCase() !== String(qr.fg).toLowerCase() || bg.toLowerCase() !== String(qr.bg).toLowerCase() || logo !== qr.logo;

  const reset = () => {
    setFg('#000000');
    setBg('#FFFFFF');
    setLogo(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateMyQr(qr.id, { fg, bg, logo });
      toast({ type: 'success', title: 'Tampilan QR disimpan', message: 'Unduh ulang QR untuk memakai warna yang baru.' });
      onSaved();
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menyimpan', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DetailModal
      title="Edit tampilan QR"
      subtitle={qr.link}
      icon={Palette}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={reset} className="mr-auto">Hitam putih</Button>
          <Button size="sm" variant="secondary" onClick={onClose}>Batal</Button>
          <Button size="sm" variant="primary" icon={Save} onClick={save} disabled={saving || !changed || sameColor}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div
          role="img"
          aria-label="Pratinjau QR"
          className="h-44 w-44 shrink-0 self-center rounded-md border border-border p-2 sm:h-52 sm:w-52 sm:self-start [&>svg]:h-full [&>svg]:w-full"
          style={{ background: bg }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <ColorField id="qr-edit-fg" label="Warna QR" value={fg} onChange={setFg} />
            <ColorField id="qr-edit-bg" label="Warna latar" value={bg} onChange={setBg} />
          </div>

          <label className="flex cursor-pointer select-none items-center gap-2.5 rounded-md border border-border px-2.5 py-2.5 text-[12px] text-primary sm:text-[13px]">
            <input type="checkbox" checked={logo} onChange={(e) => setLogo(e.target.checked)} className="h-4 w-4 accent-black" />
            Tampilkan logo di tengah
          </label>

          {sameColor && (
            <p className="rounded-md bg-red-500/10 px-2.5 py-2 text-[12px] text-red-700 dark:text-red-400">
              Warna QR dan warna latar sama, jadi QR tidak bisa dipindai. Pilih dua warna yang berbeda.
            </p>
          )}
          {lowContrast && (
            <p className="rounded-md bg-amber-500/10 px-2.5 py-2 text-[12px] text-amber-700 dark:text-amber-400">
              Kontras warna rendah. QR bisa sulit dipindai, coba pakai warna yang lebih berbeda.
            </p>
          )}

          <p className="text-[11px] leading-relaxed text-tertiary sm:text-[12px]">
            Link QR tidak berubah. QR yang sudah dicetak tetap bisa dipindai seperti biasa; warna baru berlaku untuk unduhan berikutnya.
          </p>
        </div>
      </div>
    </DetailModal>
  );
}
