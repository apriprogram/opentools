import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, CalendarDays, CheckCheck, CheckCircle2, Copy, Download, Eraser, ExternalLink, Eye, ImagePlus, Rocket, RotateCcw, Save, Undo2, Upload,
} from 'lucide-react';
import PanelLayout, { PanelCrumb } from '../../components/panel/PanelLayout';
import FramePreview from '../../components/twibbon/FramePreview';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { frameHasHole, prepareFrame, punchHole } from '../../lib/twibbonFrame';
import { createTwibbon, fetchMyTwibbon, updateTwibbon } from '../../services/twibbonApi';

const INPUT =
  'ios-no-zoom h-10 w-full rounded-md border border-border bg-card px-3 text-[13px] text-primary placeholder:text-tertiary transition-smooth hover:border-border-hover focus:border-border-focus focus:outline-none';
const LABEL = 'mb-1.5 block text-[12px] font-medium text-secondary sm:text-[13px]';
const CARD = 'rounded-2xl border border-border bg-card';
const LABEL_BTN =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card text-[12px] font-medium text-primary transition-smooth hover:border-blue-500 hover:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-9 sm:w-auto sm:px-3 sm:text-[13px]';
const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,59}$/;

const angka = (n) => Number(n || 0).toLocaleString('id-ID');
const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-');

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

function SectionHead({ number, title, hint }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-black text-[12px] font-semibold text-card">{number}</span>
      <div className="min-w-0">
        <h2 className="text-[14px] font-semibold leading-6 text-primary sm:text-[15px]">{title}</h2>
        {hint && <p className="text-[11px] text-tertiary sm:text-[12px]">{hint}</p>}
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-md bg-card-muted px-3 py-2.5">
      <Icon size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-secondary" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[10px] uppercase tracking-wider text-tertiary sm:text-[11px]">{label}</p>
        <p className="truncate text-[13px] font-semibold tabular-nums text-primary">{value}</p>
      </div>
    </div>
  );
}

// Buat Twibbon baru atau ubah yang sudah ada: gambar bingkai di kiri, detail di kanan.
export default function TwibbonEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { addToast: toast } = useToast();
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(editing);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(null);
  const [frame, setFrame] = useState(null); // { dataUrl, transparent } dari file yang baru dipilih
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!editing) return;
    fetchMyTwibbon(id)
      .then((item) => {
        setSaved(item);
        setTitle(item.title);
        setDescription(item.description || '');
        setSlug(item.slug);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [editing, id]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const onTitle = (value) => {
    setTitle(value);
    if (!editing && !slugEdited) setSlug(slugify(value));
  };

  const pickFile = async (file) => {
    if (!file) return;
    setReading(true);
    try {
      setFrame(await prepareFrame(file));
      setUndoFrame(null);
      setPicking(false);
    } catch (err) {
      toast({ type: 'error', title: 'Gambar tidak bisa dipakai', message: err.message });
    } finally {
      setReading(false);
    }
  };

  const dropProps = {
    onDragOver: (e) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e) => {
      e.preventDefault();
      setDragging(false);
      pickFile(e.dataTransfer.files?.[0]);
    },
  };

  const frameSrc = frame?.dataUrl || saved?.frameBase64 || null;

  // Alat "Buat area foto": untuk bingkai yang belum punya bagian transparan (misalnya gambar JPG).
  // Pengguna mengetuk bagian bingkai yang akan jadi tempat foto, lalu warna di area itu dijadikan tembus pandang.
  const [picking, setPicking] = useState(false);
  const [tolerance, setTolerance] = useState(40);
  const [undoFrame, setUndoFrame] = useState(null);
  const [savedHole, setSavedHole] = useState(null);
  useEffect(() => {
    let alive = true;
    setSavedHole(null);
    // Bingkai tersimpan berganti (misalnya setelah disimpan): riwayat batal tidak berlaku lagi.
    setUndoFrame(null);
    if (saved?.frameBase64) {
      frameHasHole(saved.frameBase64)
        .then((ok) => alive && setSavedHole(ok))
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [saved?.frameBase64]);
  // null berarti belum diketahui (bingkai tersimpan masih diperiksa).
  const hasHoleNow = frame ? frame.transparent : savedHole;

  const makeHole = async (e) => {
    if (!picking || !frameSrc || reading) return;
    const box = e.currentTarget.getBoundingClientRect();
    setReading(true);
    try {
      const next = await punchHole(frameSrc, { x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height, tolerance });
      setUndoFrame({ frame });
      setFrame(next);
      setPicking(false);
      toast({ type: 'success', title: 'Area foto dibuat', message: 'Bagian abu-abu adalah tempat foto. Simpan kalau sudah pas, atau ulangi di bagian lain.' });
    } catch (err) {
      toast({ type: 'error', title: 'Area foto belum dibuat', message: err.message });
    } finally {
      setReading(false);
    }
  };
  const slugOk = SLUG_RE.test(slug);
  const titleOk = title.trim().length >= 2;
  const changed = editing
    ? Boolean(frame) || title.trim() !== saved?.title || description.trim() !== (saved?.description || '')
    : true;
  const ready = Boolean(frameSrc) && titleOk && slugOk && changed;
  const publicUrl = saved ? `${window.location.origin}/c/${saved.slug}` : '';

  const save = async () => {
    if (!ready) return;
    setSaving(true);
    try {
      if (editing) {
        const next = await updateTwibbon(id, { title: title.trim(), description: description.trim(), frameBase64: frame?.dataUrl });
        setSaved(next);
        setTitle(next.title);
        setDescription(next.description || '');
        setFrame(null);
        toast({ type: 'success', title: 'Perubahan disimpan' });
      } else {
        const created = await createTwibbon({ title: title.trim(), description: description.trim(), slug, frameBase64: frame.dataUrl });
        toast({ type: 'success', title: 'Twibbon diterbitkan', message: `Bagikan link ${window.location.origin}/c/${created.slug}` });
        navigate('/dashboard/twibbon', { replace: true });
      }
    } catch (err) {
      toast({ type: 'error', title: editing ? 'Gagal menyimpan' : 'Gagal menerbitkan', message: err?.response?.data?.message || 'Coba lagi beberapa saat.' });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setFrame(null);
    setTitle(saved.title);
    setDescription(saved.description || '');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({ type: 'success', title: 'Link disalin', message: publicUrl });
    } catch {
      toast({ type: 'error', title: 'Gagal menyalin', message: `Salin manual: ${publicUrl}` });
    }
  };

  if (notFound) {
    return (
      <PanelLayout title="Twibbon">
        <div className={`${CARD} p-5`}>
          <p className="text-[14px] text-primary">Twibbon ini tidak ditemukan di akun Anda.</p>
          <Link to="/dashboard/twibbon" className="mt-3 inline-block text-[13px] underline">Kembali ke daftar Twibbon</Link>
        </div>
      </PanelLayout>
    );
  }

  if (loading) {
    return (
      <PanelLayout title="Twibbon">
        <p className="text-[13px] text-tertiary">Memuat...</p>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout title="Twibbon">
      <Link to="/dashboard/twibbon" className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-secondary transition-smooth hover:text-primary sm:text-[13px]">
        <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" /> Semua Twibbon
      </Link>

      {/* Kepala halaman: gambar kecil, judul, alamat, lalu tombol buka dan salin link. */}
      <div className={`${CARD} mb-3 flex flex-wrap items-center gap-3 p-3 sm:mb-4 sm:p-4`}>
        <div className="w-12 shrink-0 sm:w-14">
          <FramePreview src={frameSrc} rounded="rounded-md" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-semibold text-primary sm:text-[20px]">
            {editing ? title.trim() || 'Tanpa judul' : 'Buat Twibbon baru'}
          </h1>
          <PanelCrumb />
          <p className="truncate text-[11px] text-tertiary sm:text-[12px]">
            {editing ? <span className="font-mono">/c/{saved.slug}</span> : 'Dua langkah saja: unggah gambar bingkai, lalu isi judulnya.'}
          </p>
        </div>
        {editing && (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a href={`/c/${saved.slug}`} target="_blank" rel="noopener noreferrer" title="Buka halaman Twibbon di tab baru" aria-label="Buka halaman Twibbon" className={LABEL_BTN}>
              <ExternalLink size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
              <span className="max-sm:hidden">Buka</span>
            </a>
            <button type="button" onClick={copyLink} title={copied ? 'Link disalin' : 'Salin link halaman'} aria-label="Salin link Twibbon" className={LABEL_BTN}>
              {copied ? <CheckCheck size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-success" /> : <Copy size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />}
              <span className="max-sm:hidden">{copied ? 'Disalin' : 'Salin link'}</span>
            </button>
            <Button size="sm" variant="primary" icon={Save} disabled={!ready || saving} onClick={save} className="max-sm:hidden">
              {saving ? 'Menyimpan...' : ready ? 'Simpan' : 'Tersimpan'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        {/* 1. Gambar bingkai */}
        <section className={`${CARD} self-start`}>
          <SectionHead number="1" title="Gambar bingkai" hint="PNG dengan area transparan untuk foto." />
          <div className="p-4 sm:p-5">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/webp,image/jpeg"
              className="hidden"
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            {frameSrc ? (
              <div
                {...dropProps}
                className={`relative overflow-hidden rounded-2xl border transition-smooth ${dragging ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-border'}`}
              >
                <FramePreview src={frameSrc} alt="Pratinjau bingkai" rounded="rounded-none" />
                {picking && (
                  <button
                    type="button"
                    onClick={makeHole}
                    disabled={reading}
                    aria-label="Ketuk bagian bingkai yang akan jadi tempat foto"
                    className="absolute inset-0 flex cursor-crosshair items-end justify-center bg-black/10 p-3 disabled:cursor-wait"
                  >
                    <span className="rounded-full bg-black/80 px-3 py-1.5 text-[12px] font-medium text-white">
                      {reading ? 'Memproses...' : 'Ketuk bagian yang akan jadi tempat foto'}
                    </span>
                  </button>
                )}
                {frame && !picking && (
                  <span className="absolute left-2 top-2 inline-flex h-6 items-center rounded-full bg-black/70 px-2.5 text-[11px] font-medium text-white">Gambar baru, belum disimpan</span>
                )}
                {dragging && (
                  <span className="absolute inset-0 flex items-center justify-center bg-blue-500/20 text-[13px] font-medium text-white">Lepas untuk mengganti gambar</span>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                {...dropProps}
                className={`flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-smooth ${
                  dragging ? 'border-blue-500 bg-blue-500/5' : 'border-border hover:border-blue-500'
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card-muted text-secondary">
                  <ImagePlus size={22} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="text-[14px] font-medium text-primary">{reading ? 'Memproses gambar...' : 'Klik untuk memilih gambar'}</span>
                <span className="text-[12px] text-secondary">atau tarik file ke sini</span>
              </button>
            )}

            {frameSrc && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-tertiary sm:text-[12px]">Area abu-abu adalah tempat foto pengunjung.</p>
                <Button size="sm" variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()} disabled={reading}>
                  {reading ? 'Memproses...' : 'Ganti gambar'}
                </Button>
              </div>
            )}

            {frameSrc && (
              <div className="mt-3 rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] font-medium text-primary sm:text-[13px]">Area foto</p>
                  <div className="flex flex-wrap gap-2">
                    {undoFrame && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Undo2}
                        onClick={() => {
                          setFrame(undoFrame.frame);
                          setUndoFrame(null);
                        }}
                      >
                        Urungkan
                      </Button>
                    )}
                    <Button size="sm" variant={picking ? 'primary' : 'secondary'} icon={Eraser} onClick={() => setPicking((v) => !v)} disabled={reading}>
                      {picking ? 'Batal memilih' : 'Buat area foto'}
                    </Button>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-secondary sm:text-[12px]">
                  Untuk gambar yang belum punya bagian transparan. Tekan Buat area foto, lalu ketuk bagian bingkai yang akan jadi tempat foto. Warna di area itu dijadikan tembus pandang.
                </p>
                <label className="mt-2.5 flex items-center gap-2.5 text-[11px] text-secondary sm:text-[12px]">
                  <span className="shrink-0">Kepekaan warna</span>
                  <input type="range" min={10} max={90} step={5} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="h-1.5 min-w-0 flex-1 cursor-pointer accent-blue-500" />
                  <span className="w-6 shrink-0 text-right tabular-nums text-primary">{tolerance}</span>
                </label>
                <p className="mt-1 text-[11px] text-tertiary">Naikkan kalau area fotonya belum bersih, turunkan kalau bagian lain ikut terhapus.</p>
              </div>
            )}

            {hasHoleNow === false && (
              <p className="mt-3 flex items-start gap-2 rounded-md bg-amber-500/10 px-2.5 py-2 text-[12px] text-amber-700 dark:text-amber-400">
                <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" className="mt-px shrink-0" />
                <span>Gambar ini belum punya area transparan, jadi foto pengunjung tertutup bingkai. Pakai Buat area foto di atas untuk membuat tempat fotonya.</span>
              </p>
            )}
            {frame && frame.transparent && (
              <p className="mt-3 flex items-start gap-2 rounded-md bg-emerald-500/10 px-2.5 py-2 text-[12px] text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={15} strokeWidth={1.75} aria-hidden="true" className="mt-px shrink-0" />
                <span>Area transparan ditemukan. Bingkai siap dipakai.</span>
              </p>
            )}

            <ul className="mt-4 grid gap-1.5 border-t border-border pt-3 text-[11px] text-secondary sm:text-[12px]">
              <li>Ukuran ideal 1080 × 1080 px (persegi).</li>
              <li>Format PNG, WebP, atau JPG, maksimal 10 MB.</li>
              <li>Gambar diperkecil otomatis supaya halaman cepat dibuka.</li>
            </ul>
          </div>
        </section>

        {/* 2. Detail */}
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <section className={CARD}>
            <SectionHead number="2" title="Detail Twibbon" hint="Judul dan deskripsi tampil di halaman Twibbon." />
            <div className="grid gap-4 p-4 sm:p-5">
              <div>
                <label htmlFor="tw-title" className={LABEL}>Judul</label>
                <input id="tw-title" type="text" required minLength={2} maxLength={120} value={title} onChange={(e) => onTitle(e.target.value)} placeholder="Contoh: HUT RI ke-81" className={`${INPUT} font-medium`} />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="tw-desc" className="text-[12px] font-medium text-secondary sm:text-[13px]">Deskripsi (boleh kosong)</label>
                  <span className="text-[11px] tabular-nums text-tertiary">{description.length}/500</span>
                </div>
                <textarea
                  id="tw-desc"
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan singkat acara atau kampanyenya."
                  className="ios-no-zoom w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-[13px] leading-relaxed text-primary placeholder:text-tertiary transition-smooth hover:border-border-hover focus:border-border-focus focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="tw-slug" className={LABEL}>Alamat halaman</label>
                <div className={`flex items-center overflow-hidden rounded-md border border-border ${editing ? 'bg-card-muted' : 'bg-card focus-within:border-border-focus'}`}>
                  <span className="shrink-0 border-r border-border px-3 font-mono text-[12px] text-tertiary">/c/</span>
                  <input
                    id="tw-slug"
                    type="text"
                    maxLength={60}
                    value={slug}
                    disabled={editing}
                    readOnly={editing}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    }}
                    placeholder="hut-ri-ke-81"
                    className="ios-no-zoom h-10 w-full bg-transparent px-3 font-mono text-[12px] text-primary placeholder:text-tertiary focus:outline-none disabled:text-secondary sm:text-[13px]"
                  />
                </div>
                <p className={`mt-1 text-[11px] sm:text-[12px] ${!editing && slug && !slugOk ? 'text-danger' : 'text-tertiary'}`}>
                  {editing
                    ? 'Alamat tidak bisa diubah, supaya link yang sudah dibagikan tetap jalan.'
                    : slug && !slugOk
                      ? 'Minimal 3 karakter: huruf kecil, angka, dan tanda -.'
                      : 'Diisi otomatis dari judul. Kalau sudah dipakai orang lain, ditambah angka di belakangnya.'}
                </p>
              </div>
            </div>
          </section>

          {editing && (
            <section className={`${CARD} p-4 sm:p-5`}>
              <h2 className="mb-3 text-[14px] font-semibold text-primary sm:text-[15px]">Statistik</h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <InfoTile icon={Eye} label="Dilihat" value={angka(saved.views)} />
                <InfoTile icon={Download} label="Dipakai" value={angka(saved.usage)} />
                <InfoTile icon={CalendarDays} label="Dibuat" value={tanggal(saved.createdAt)} />
              </div>
            </section>
          )}

          {/* Baris aksi. Saat mengedit, baris ini menempel di bawah layar selama ada perubahan. */}
          {editing ? (
            changed && (
              <div className="sticky bottom-3 z-20 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 pl-3 shadow-menu dark:shadow-menu-dark sm:gap-3 sm:pl-4">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <p className="min-w-0 flex-1 text-[12px] text-primary sm:text-[13px]">Ada perubahan yang belum disimpan</p>
                <Button size="sm" variant="ghost" icon={RotateCcw} onClick={discard} disabled={saving}>Batalkan</Button>
                <Button size="sm" variant="primary" icon={Save} onClick={save} disabled={saving || !ready}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            )
          ) : (
            <div className={`${CARD} flex flex-wrap items-center justify-end gap-2 p-3 sm:p-4`}>
              <p className="mr-auto text-[12px] text-tertiary">
                {!frameSrc ? 'Unggah gambar bingkai dulu.' : !titleOk ? 'Isi judul Twibbon.' : 'Siap diterbitkan.'}
              </p>
              <Link to="/dashboard/twibbon">
                <Button variant="secondary">Batal</Button>
              </Link>
              <Button variant="primary" icon={Rocket} onClick={save} disabled={!ready || saving}>
                {saving ? 'Menerbitkan...' : 'Terbitkan Twibbon'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}
