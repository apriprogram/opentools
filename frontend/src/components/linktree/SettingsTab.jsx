import React, { useEffect, useMemo, useState } from 'react';
import { CheckCheck, Copy, Download, ExternalLink, EyeOff, Globe, Trash2, X } from 'lucide-react';
import Switch from '../ui/Switch';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { readImageAsDataUrl } from '../../lib/imageUpload';
import { buildQrSvg, loadLogoDataUrl, svgToPngBlob, downloadBlob } from '../../lib/qrCode';
import { SLUG_RE } from './constants';

const INPUT =
  'h-[42px] w-full rounded-md border border-border bg-card px-3 text-[14px] text-primary placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth';

// Pengaturan: profil, foto, alamat, status terbit, cara membagikan (link dan QR), serta hapus.
export default function SettingsTab({ draft, update, publicSlug, published, onDelete }) {
  const { addToast: toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [logo, setLogo] = useState(null);
  const publicUrl = `${window.location.origin}/l/${publicSlug}`;
  const slugOk = SLUG_RE.test(draft.slug);

  useEffect(() => {
    loadLogoDataUrl().then(setLogo).catch(() => setLogo(null));
  }, []);

  const qrSvg = useMemo(() => {
    try {
      return buildQrSvg({ text: publicUrl, fg: '#111111', bg: '#FFFFFF', logoDataUrl: logo, size: 512 });
    } catch {
      return '';
    }
  }, [publicUrl, logo]);

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const avatar = await readImageAsDataUrl(file, { maxSide: 400, maxChars: 600000, square: true });
      update({ avatar });
    } catch (err) {
      toast({ type: 'error', title: 'Foto tidak bisa dipakai', message: err.message });
    }
  };

  const copy = () => {
    navigator.clipboard?.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPng = async () => {
    try {
      const blob = await svgToPngBlob(qrSvg, 1024);
      downloadBlob(blob, `qr-linktree-${publicSlug}.png`);
    } catch {
      toast({ type: 'error', title: 'Gagal mengunduh', message: 'QR tidak bisa diunduh sebagai PNG.' });
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold text-primary">Profil</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="lt-name" className="mb-1 block text-[13px] text-secondary">Nama tampilan</label>
            <input
              id="lt-name"
              type="text"
              maxLength={120}
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
              className={INPUT}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="lt-bio" className="text-[13px] text-secondary">Bio</label>
              <span className="text-[12px] text-tertiary">{draft.bio.length}/300</span>
            </div>
            <textarea
              id="lt-bio"
              rows={3}
              maxLength={300}
              value={draft.bio}
              onChange={(e) => update({ bio: e.target.value })}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-[14px] text-primary placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth"
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] text-secondary">Foto profil</p>
            <div className="flex flex-wrap items-center gap-3">
              {draft.avatar ? (
                <img src={draft.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-border text-[12px] text-tertiary">
                  Kosong
                </div>
              )}
              <label className="inline-flex h-[36px] cursor-pointer items-center rounded-md border border-border px-3 text-[13px] text-primary transition-smooth hover:bg-card-muted">
                {draft.avatar ? 'Ganti foto' : 'Unggah foto'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onAvatar} />
              </label>
              {draft.avatar && (
                <Button size="sm" variant="ghost" icon={X} onClick={() => update({ avatar: null })}>Hapus</Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold text-primary">Alamat dan terbit</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="lt-slug" className="mb-1 block text-[13px] text-secondary">Alamat halaman</label>
            <div className="flex items-center overflow-hidden rounded-md border border-border bg-card focus-within:border-border-focus">
              <span className="shrink-0 border-r border-border px-3 text-[13px] text-tertiary">/l/</span>
              <input
                id="lt-slug"
                type="text"
                maxLength={30}
                value={draft.slug}
                onChange={(e) => update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                className="h-[42px] w-full bg-transparent px-3 text-[14px] text-primary focus:outline-none"
              />
            </div>
            {!slugOk && <p className="mt-1 text-[12px] text-danger">Alamat harus 3 sampai 30 karakter: huruf kecil, angka, - dan _.</p>}
          </div>

          {/* Status terbit: kartu berwarna dengan sakelar besar, supaya tidak terlewat. */}
          <div
            className={`flex items-center gap-3 rounded-2xl border p-3 transition-smooth sm:p-4 ${
              draft.published ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-amber-500/50 bg-amber-500/10'
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
                draft.published ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            >
              {draft.published ? <Globe size={18} strokeWidth={1.75} aria-hidden="true" /> : <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-primary sm:text-[14px]">
                {draft.published ? 'Halaman diterbitkan' : 'Halaman masih draf'}
              </p>
              <p className="text-[11px] text-secondary sm:text-[12px]">
                {draft.published
                  ? 'Siapa saja bisa membuka halaman ini lewat alamat di atas.'
                  : 'Orang lain belum bisa membuka halaman ini. Nyalakan sakelar untuk menerbitkan.'}
              </p>
              {draft.published !== published && (
                <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 sm:text-[12px]">
                  Belum diterapkan. Tekan Simpan untuk {draft.published ? 'menerbitkan' : 'menjadikannya draf'}.
                </p>
              )}
            </div>
            <Switch
              size="md"
              tone="green"
              checked={draft.published}
              onChange={(next) => update({ published: next })}
              label="Terbitkan halaman"
              title={draft.published ? 'Klik untuk menjadikan draf' : 'Klik untuk menerbitkan'}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold text-primary">Bagikan</h2>
        {published ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_160px]">
            <div className="min-w-0">
              <p className="break-all rounded-md border border-border bg-card-muted px-3 py-2 text-[13px] text-primary">{publicUrl}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={copied ? CheckCheck : Copy} onClick={copy}>
                  {copied ? 'Tersalin' : 'Salin link'}
                </Button>
                <a href={`/l/${publicSlug}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="secondary" icon={ExternalLink}>Buka</Button>
                </a>
                <Button size="sm" variant="ghost" icon={Download} onClick={downloadPng}>QR PNG</Button>
              </div>
            </div>
            <div className="flex aspect-square max-w-[180px] items-center justify-center rounded-md border border-border bg-white p-2 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-secondary">Terbitkan dan simpan Linktree dulu agar bisa dibagikan.</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold text-primary">Hapus Linktree</h2>
        <p className="mt-1 text-[13px] text-secondary">Semua tautan dan statistik Linktree ini ikut terhapus. Tindakan ini tidak bisa dibatalkan.</p>
        <div className="mt-4">
          <Button variant="danger" icon={Trash2} onClick={onDelete}>Hapus Linktree</Button>
        </div>
      </section>
    </div>
  );
}
