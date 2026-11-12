import React, { useRef } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import DetailModal from '../panel/DetailModal';
import { readIconAsDataUrl } from '../../lib/imageUpload';
import { LINK_ICONS, LINK_ICON_BY_ID } from './constants';

const isImage = (value) => typeof value === 'string' && value.startsWith('data:image/');
const presetOf = (value) =>
  typeof value === 'string' && value.startsWith('preset:') ? LINK_ICON_BY_ID[value.slice(7)] || null : null;

// Gambar ikon tautan. value: "preset:<id>" (ikon bawaan) atau data URL (gambar unggahan).
// Mengembalikan null jika tautan tidak punya ikon.
export default function LinkIcon({ value, size = 20, className = '' }) {
  if (isImage(value)) {
    return <img src={value} alt="" className={`shrink-0 rounded-md object-cover ${className}`} style={{ width: size + 8, height: size + 8 }} />;
  }
  const preset = presetOf(value);
  if (!preset) return null;
  const Icon = preset.icon;
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" className={`shrink-0 ${className}`} />;
}

// Tombol kotak di kartu tautan: menampilkan ikon yang dipakai, atau tanda tambah jika belum ada.
export function LinkIconButton({ value, onClick }) {
  const has = isImage(value) || Boolean(presetOf(value));
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={has ? 'Ganti ikon tautan' : 'Tambah ikon tautan'}
      title={has ? 'Ganti ikon' : 'Tambah ikon'}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-smooth hover:border-blue-500 hover:text-blue-500 ${
        has ? 'border-border bg-card-muted text-primary' : 'border-dashed border-border text-tertiary'
      }`}
    >
      {has ? <LinkIcon value={value} size={isImage(value) ? 22 : 18} /> : <ImagePlus size={16} strokeWidth={1.75} aria-hidden="true" />}
    </button>
  );
}

// Modal pilih ikon: unggah gambar sendiri, atau pilih dari daftar ikon.
export function IconPickerModal({ value, onPick, onClose }) {
  const { addToast: toast } = useToast();
  const fileRef = useRef(null);

  const choose = (next) => {
    onPick(next);
    onClose();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      choose(await readIconAsDataUrl(file));
    } catch (err) {
      toast({ type: 'error', title: 'Gambar tidak bisa dipakai', message: err.message });
    }
  };

  return (
    <DetailModal
      title="Ikon tautan"
      subtitle="Unggah gambar sendiri atau pilih salah satu ikon."
      icon={ImagePlus}
      onClose={onClose}
      footer={
        <>
          {value && (
            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => choose(null)} className="mr-auto">Tanpa ikon</Button>
          )}
          <Button size="sm" variant="secondary" onClick={onClose}>Tutup</Button>
        </>
      }
    >
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-border p-3 sm:p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-card-muted text-secondary">
          {isImage(value) ? <img src={value} alt="" className="h-10 w-10 rounded-md object-cover" /> : <Upload size={18} strokeWidth={1.75} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-primary">Unggah gambar sendiri</p>
          <p className="text-[11px] text-tertiary sm:text-[12px]">PNG, JPG, atau WebP. Dipotong persegi dan diperkecil otomatis.</p>
        </div>
        <Button size="sm" variant="primary" icon={Upload} onClick={() => fileRef.current?.click()}>
          {isImage(value) ? 'Ganti gambar' : 'Pilih gambar'}
        </Button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
      </section>

      <section>
        <p className="mb-2 text-[12px] font-medium text-secondary sm:text-[13px]">Atau pilih ikon</p>
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7 sm:gap-2">
          {LINK_ICONS.map((item) => {
            const Icon = item.icon;
            const active = value === `preset:${item.id}`;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(`preset:${item.id}`)}
                aria-pressed={active}
                title={item.label}
                className={`flex flex-col items-center gap-1 rounded-md border px-1 py-2 transition-smooth hover:border-blue-500 hover:text-blue-500 ${
                  active ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'border-border text-primary'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className="w-full truncate text-center text-[10px] text-secondary">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </DetailModal>
  );
}
