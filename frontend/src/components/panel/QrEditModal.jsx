import React, { useMemo, useState } from 'react';
import { Link2, PencilLine, RotateCcw, Save } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import DetailModal from './DetailModal';
import { buildQrSvg, contrastRatio, normalizeLink } from '../../lib/qrCode';
import { updateMyQr } from '../../services/authApi';

const COLOR_INPUT = 'h-9 w-9 shrink-0 cursor-pointer rounded-sm border border-border bg-transparent p-0.5';
const LINK_INPUT =
  'ios-no-zoom h-10 w-full rounded-md border border-border bg-card pl-9 pr-3 text-[13px] text-primary placeholder:text-tertiary transition-smooth hover:border-border-hover focus:border-border-focus focus:outline-none';

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

// Edit ulang QR Premium: link tujuan, warna QR, warna latar, dan logo.
// Mengganti warna atau logo tidak mengubah tujuan QR. Mengganti link mengubah pola QR,
// jadi QR lama yang sudah dicetak tetap menuju link lama dan perlu diunduh ulang.
export default function QrEditModal({ qr, onClose, onSaved }) {
  const { addToast: toast } = useToast();
  const [link, setLink] = useState(qr.link);
  const [fg, setFg] = useState(qr.fg);
  const [bg, setBg] = useState(qr.bg);
  const [logo, setLogo] = useState(qr.logo);
  const [saving, setSaving] = useState(false);

  const target = normalizeLink(link);
  const linkChanged = target !== qr.link;

  const svg = useMemo(() => {
    if (!target) return '';
    try {
      return buildQrSvg({ text: target, fg, bg, logo, size: 512 });
    } catch {
      return ''; // teks terlalu panjang untuk QR
    }
  }, [target, fg, bg, logo]);

  let linkError = '';
  if (!target) linkError = 'Link wajib diisi.';
  else if (/\s/.test(target)) linkError = 'Link tidak boleh mengandung spasi. Isi alamat tujuannya saja, misalnya https://contoh.com/halaman.';
  else if (!svg) linkError = 'Link terlalu panjang untuk dijadikan QR.';

  const sameColor = fg.toLowerCase() === bg.toLowerCase();
  const lowContrast = !sameColor && contrastRatio(fg, bg) < 3;
  const changed =
    linkChanged || fg.toLowerCase() !== String(qr.fg).toLowerCase() || bg.toLowerCase() !== String(qr.bg).toLowerCase() || logo !== qr.logo;

  const reset = () => {
    setFg('#000000');
    setBg('#FFFFFF');
    setLogo(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateMyQr(qr.id, { link: target, fg, bg, logo });
      toast({
        type: 'success',
        title: 'QR disimpan',
        message: linkChanged ? 'Link QR berubah. Unduh ulang QR, karena QR yang lama masih menuju link lama.' : 'Unduh ulang QR untuk memakai tampilan yang baru.',
      });
      onSaved();
    } catch (err) {
      toast({ type: 'error', title: 'Gagal menyimpan', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DetailModal
      title="Edit QR"
      subtitle="Ganti link tujuan, warna, atau logo QR ini."
      icon={PencilLine}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={reset} className="mr-auto">Hitam putih</Button>
          <Button size="sm" variant="secondary" onClick={onClose}>Batal</Button>
          <Button size="sm" variant="primary" icon={Save} onClick={save} disabled={saving || !changed || sameColor || Boolean(linkError)}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </>
      }
    >
      <div className="mb-4">
        <label htmlFor="qr-edit-link" className="mb-1.5 block text-[12px] font-medium text-secondary sm:text-[13px]">Link tujuan</label>
        <div className="relative">
          <Link2 size={15} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            id="qr-edit-link"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            maxLength={2048}
            placeholder="https://contoh.com/halaman"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            aria-invalid={linkError ? 'true' : undefined}
            aria-describedby="qr-edit-link-note"
            className={`${LINK_INPUT} ${linkError ? 'border-red-500 focus:border-red-500' : ''}`}
          />
        </div>
        <p id="qr-edit-link-note" className={`mt-1 text-[11px] leading-relaxed sm:text-[12px] ${linkError ? 'text-danger' : 'text-tertiary'}`}>
          {linkError || 'Alamat yang terbuka saat QR dipindai.'}
        </p>
      </div>

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

          {linkChanged && !linkError ? (
            <p className="rounded-md bg-amber-500/10 px-2.5 py-2 text-[12px] leading-relaxed text-amber-700 dark:text-amber-400">
              Link berubah, jadi pola QR ikut berubah. QR lama yang sudah dicetak atau dibagikan tetap menuju link lama. Unduh dan pasang ulang QR setelah disimpan.
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-tertiary sm:text-[12px]">
              Mengganti warna atau logo tidak mengubah tujuan QR. QR yang sudah dicetak tetap bisa dipindai seperti biasa.
            </p>
          )}
        </div>
      </div>
    </DetailModal>
  );
}
