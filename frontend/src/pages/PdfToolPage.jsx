import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Camera,
  Check,
  Download,
  FilePlus2,
  FileStack,
  FileText,
  GripVertical,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  RotateCcw,
  RotateCw,
  ScanLine,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import {
  A4,
  SCAN_FILTERS,
  buildPdf,
  downloadPdf,
  formatSize,
  isImageFile,
  isPdfFile,
  newId,
  readImage,
  readPdf,
  renderImageThumb,
  renderPdfThumb,
} from '../lib/pdfTools';

// Tiga alat PDF dalam satu ruang kerja. Semua proses di browser: tanpa login dan file tidak diunggah.

// key: awalan kunci terjemahan di locales/<bahasa>/pdf.json (pdf.<key>_title, _intro, _drop, _hint).
const MODES = {
  scan: {
    key: 'scan',
    icon: ScanLine,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    // Tanggal menurut jam perangkat pengguna (bukan UTC), misalnya scan-2026-11-24.
    fileName: (t) => `${t('pdf.file_scan')}-${new Date().toLocaleDateString('sv-SE')}`,
  },
  gabung: {
    key: 'merge',
    icon: Layers,
    accept: { 'application/pdf': ['.pdf'] },
    fileName: (t) => t('pdf.file_merged'),
  },
  atur: {
    key: 'organize',
    icon: FileStack,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    fileName: (t, sources) => `${(Object.values(sources)[0]?.name || 'dokumen').replace(/\.pdf$/i, '')}-${t('pdf.file_organized')}`,
  },
};

const MAX_PAGES = 500;

/* ── Kartu halaman ───────────────────────────────────────────────────────── */

function PageCard({ page, number, thumb, selected, onToggle, onRotate, onDelete }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const stop = (e) => e.stopPropagation();

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group relative flex touch-manipulation select-none flex-col rounded-2xl border bg-card p-2 transition-shadow ${
        isDragging ? 'z-10 border-blue-500 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.55)]' : selected ? 'border-blue-500' : 'border-border'
      }`}
    >
      {/* Seluruh kartu bisa ditarik. Tombol di dalamnya tidak ikut memulai tarikan. */}
      <div
        {...attributes}
        {...listeners}
        aria-label={t('pdf.page_aria', { number })}
        className="relative flex aspect-[3/4] cursor-grab items-center justify-center overflow-hidden rounded-xl bg-card-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing"
      >
        {page.kind === 'blank' ? (
          <span
            className="flex items-center justify-center bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-transform duration-200"
            style={{ width: '70%', aspectRatio: `${A4.width} / ${A4.height}`, transform: `rotate(${page.rotation}deg)` }}
          >
            <Square size={18} strokeWidth={1.5} className="text-zinc-300" aria-hidden="true" />
          </span>
        ) : thumb ? (
          <img
            src={thumb}
            alt=""
            draggable={false}
            className="max-h-[92%] max-w-[92%] bg-white object-contain shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-transform duration-200"
            style={{ transform: `rotate(${page.rotation}deg)` }}
          />
        ) : (
          <Loader2 size={18} className="animate-spin text-tertiary" aria-hidden="true" />
        )}
        <span className="pointer-events-none absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-zinc-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 dark:bg-zinc-800/85 dark:text-zinc-300">
          <GripVertical size={13} aria-hidden="true" />
        </span>
      </div>

      <button
        type="button"
        onPointerDown={stop}
        onClick={() => onToggle(page.id)}
        aria-pressed={selected}
        aria-label={t(selected ? 'pdf.unselect_page' : 'pdf.select_page', { number })}
        className={`absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-md border transition-smooth ${
          selected ? 'border-blue-500 bg-blue-500 text-white' : 'border-zinc-300 bg-white/90 text-transparent hover:border-blue-500'
        }`}
      >
        <Check size={14} strokeWidth={3} aria-hidden="true" />
      </button>

      <div className="mt-2 flex items-center justify-between gap-1 px-0.5">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tabular-nums text-primary">{number}</p>
          <p className="truncate text-[10px] text-tertiary" title={page.label}>
            {page.kind === 'blank' ? t('pdf.blank_label') : page.kind === 'pdf' ? t('pdf.page_of_file', { name: page.label, page: page.index + 1 }) : page.label}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <IconBtn label={t('pdf.rotate_page', { number })} onPointerDown={stop} onClick={() => onRotate(page.id, 90)}>
            <RotateCw size={14} />
          </IconBtn>
          <IconBtn label={t('pdf.delete_page', { number })} danger onPointerDown={stop} onClick={() => onDelete([page.id])}>
            <Trash2 size={14} />
          </IconBtn>
        </div>
      </div>
    </li>
  );
}

function IconBtn({ label, danger = false, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-full text-secondary transition-smooth hover:bg-card-muted ${
        danger ? 'hover:text-red-500' : 'hover:text-primary'
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── Halaman alat ────────────────────────────────────────────────────────── */

export default function PdfToolPage({ mode = 'atur' }) {
  const { t } = useTranslation();
  const config = MODES[mode] || MODES.atur;
  const tm = (part) => t(`pdf.${config.key}_${part}`);
  const errText = (err) => (err?.i18n ? t(err.i18n.key, err.i18n.params) : err?.message);
  const { addToast: toast } = useToast();
  const [sources, setSources] = useState({});
  const [pages, setPages] = useState([]);
  const [thumbs, setThumbs] = useState({});
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [filter, setFilter] = useState(mode === 'scan' ? 'dokumen' : 'asli');
  const [pageSize, setPageSize] = useState('a4');
  const [fileName, setFileName] = useState('');
  const cameraRef = useRef(null);
  const addRef = useRef(null);

  // Ganti mode (pindah alat): mulai dari kosong.
  useEffect(() => {
    setSources({});
    setPages([]);
    setThumbs({});
    setSelected([]);
    setFileName('');
    setFilter(mode === 'scan' ? 'dokumen' : 'asli');
  }, [mode]);

  // Bebaskan memori gambar dan dokumen pratinjau saat halaman ditutup.
  useEffect(
    () => () => {
      Object.values(sources).forEach((s) => {
        if (s.url) URL.revokeObjectURL(s.url);
        s.preview?.destroy?.();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const thumbKey = useCallback((page) => (page.kind === 'image' ? `${page.sourceId}:${page.filter || filter}` : `${page.sourceId}:${page.index}`), [filter]);

  // Buat pratinjau yang belum ada, satu per satu supaya halaman tetap ringan.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const page of pages) {
        if (cancelled) return;
        if (page.kind === 'blank') continue;
        const key = thumbKey(page);
        if (thumbs[key]) continue;
        const source = sources[page.sourceId];
        if (!source) continue;
        try {
          const url = page.kind === 'pdf' ? await renderPdfThumb(source, page.index) : renderImageThumb(source, page.filter || filter);
          if (!cancelled) setThumbs((t) => ({ ...t, [key]: url }));
        } catch {
          if (!cancelled) setThumbs((t) => ({ ...t, [key]: 'error' }));
        }
        return; // efek berjalan lagi setelah state berubah, untuk halaman berikutnya
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pages, sources, thumbs, thumbKey, filter]);

  const addFiles = useCallback(
    async (files) => {
      const list = Array.from(files || []);
      if (!list.length) return;
      setBusy(true);
      const added = { sources: {}, pages: [] };
      const problems = [];
      for (const file of list) {
        try {
          if (isPdfFile(file) && mode !== 'scan') {
            const { source, pages: p } = await readPdf(file);
            added.sources[source.id] = source;
            added.pages.push(...p);
          } else if (isImageFile(file) && mode !== 'gabung') {
            const { source, pages: p } = await readImage(file);
            added.sources[source.id] = source;
            added.pages.push(...p);
          } else {
            problems.push(t(mode === 'scan' ? 'pdf.err_not_image' : mode === 'gabung' ? 'pdf.err_not_pdf' : 'pdf.err_not_pdf_or_image', { name: file.name }));
          }
        } catch (err) {
          problems.push(errText(err));
        }
      }
      setSources((s) => ({ ...s, ...added.sources }));
      setPages((p) => {
        const next = [...p, ...added.pages];
        if (next.length > MAX_PAGES) {
          problems.push(t('pdf.err_max_pages', { max: MAX_PAGES }));
          return next.slice(0, MAX_PAGES);
        }
        return next;
      });
      setBusy(false);
      if (problems.length) toast({ type: 'error', title: t('pdf.toast_skipped'), message: problems.slice(0, 3).join(' ') });
    },
    [mode, toast, t]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: addFiles,
    accept: config.accept,
    noClick: true,
    multiple: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setPages((p) => arrayMove(p, p.findIndex((x) => x.id === active.id), p.findIndex((x) => x.id === over.id)));
  };

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const rotate = (ids, by) =>
    setPages((p) => p.map((page) => ((Array.isArray(ids) ? ids : [ids]).includes(page.id) ? { ...page, rotation: (page.rotation + by + 360) % 360 } : page)));
  const remove = (ids) => {
    setPages((p) => p.filter((page) => !ids.includes(page.id)));
    setSelected((s) => s.filter((id) => !ids.includes(id)));
  };
  const addBlank = () => {
    const first = pages.find((p) => p.kind === 'pdf');
    setPages((p) => [...p, { id: newId(), kind: 'blank', sourceId: null, index: 0, rotation: 0, width: first?.width || A4.width, height: first?.height || A4.height, label: t('pdf.blank_label') }]);
  };
  const clearAll = () => {
    setPages([]);
    setSelected([]);
  };

  // Gabungkan: daftar file berurutan menurut kemunculan pertama halamannya.
  const fileOrder = useMemo(() => {
    const seen = [];
    for (const p of pages) if (p.sourceId && !seen.includes(p.sourceId)) seen.push(p.sourceId);
    return seen;
  }, [pages]);
  const moveFile = (sourceId, dir) => {
    const order = [...fileOrder];
    const i = order.indexOf(sourceId);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    setPages((p) => order.flatMap((id) => p.filter((page) => page.sourceId === id)).concat(p.filter((page) => !page.sourceId)));
  };
  const removeFile = (sourceId) => remove(pages.filter((p) => p.sourceId === sourceId).map((p) => p.id));

  const hasImages = pages.some((p) => p.kind === 'image');
  const allSelected = pages.length > 0 && selected.length === pages.length;

  const download = async () => {
    if (!pages.length) return;
    setProgress(0);
    try {
      const bytes = await buildPdf(pages, sources, { pageSize, filter, margin: mode === 'scan' ? 0 : 0, onProgress: setProgress });
      downloadPdf(bytes, fileName || config.fileName(t, sources));
      toast({ type: 'success', title: t('pdf.toast_ready'), message: t('pdf.toast_ready_msg', { count: pages.length, size: formatSize(bytes.length) }) });
    } catch (err) {
      toast({ type: 'error', title: t('pdf.toast_failed'), message: errText(err) || t('pdf.toast_retry') });
    } finally {
      setProgress(null);
    }
  };

  const Icon = config.icon;
  const empty = pages.length === 0;

  return (
    <PageContainer>
      <div className="mx-auto max-w-6xl pb-32">
        <Link to="/converters" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-secondary transition-colors hover:text-primary">
          <ArrowLeft size={14} /> {t('pdf.all_tools')}
        </Link>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white">
              <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-primary sm:text-[30px]">{tm('title')}</h1>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-secondary sm:text-[14px]">{tm('intro')}</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-secondary sm:text-[12px]">
            <Lock size={12} aria-hidden="true" /> {t('pdf.privacy_badge')}
          </span>
        </div>

        {/* Pindah cepat antaralat PDF */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {Object.entries(MODES).map(([key, m]) => (
            <Link
              key={key}
              to={`/pdf/${key}`}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-smooth ${
                key === mode ? 'bg-accent-black text-card' : 'border border-border bg-card text-secondary hover:text-primary'
              }`}
            >
              <m.icon size={13} aria-hidden="true" /> {t(`pdf.${m.key}_title`)}
            </Link>
          ))}
        </div>

        <input {...getInputProps()} />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={addRef}
          type="file"
          multiple
          accept={mode === 'gabung' ? 'application/pdf,.pdf' : mode === 'scan' ? 'image/*' : 'application/pdf,.pdf,image/*'}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div {...getRootProps()} className="relative">
          {isDragActive && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-3xl border-2 border-dashed border-blue-500 bg-blue-500/10 text-[14px] font-semibold text-blue-600">
              {t('pdf.drop_here')}
            </div>
          )}

          {empty ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card px-6 py-14 text-center sm:py-20">
              {busy ? (
                <Loader2 size={32} className="animate-spin text-blue-500" aria-hidden="true" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {mode === 'scan' ? <Camera size={26} /> : <Upload size={26} />}
                </span>
              )}
              <p className="mt-4 text-[15px] font-semibold text-primary">{busy ? t('pdf.reading') : tm('drop')}</p>
              <p className="mt-1 text-[12px] text-secondary">
                {tm('hint')}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {mode === 'scan' && (
                  <Button variant="primary" icon={Camera} onClick={() => cameraRef.current?.click()} disabled={busy}>
                    {t('pdf.take_photo')}
                  </Button>
                )}
                <Button variant={mode === 'scan' ? 'secondary' : 'primary'} icon={mode === 'scan' ? ImagePlus : Upload} onClick={open} disabled={busy}>
                  {mode === 'scan' ? t('pdf.choose_images') : t('pdf.choose_pdf')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Bilah alat */}
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2.5 sm:p-3">
                {mode === 'scan' && (
                  <Button size="sm" variant="secondary" icon={Camera} onClick={() => cameraRef.current?.click()} disabled={busy}>
                    {t('pdf.take_photo')}
                  </Button>
                )}
                <Button size="sm" variant="secondary" icon={mode === 'scan' ? ImagePlus : FilePlus2} onClick={() => addRef.current?.click()} disabled={busy}>
                  {mode === 'scan' ? t('pdf.add_images') : mode === 'gabung' ? t('pdf.add_pdf') : t('pdf.add_pdf_or_image')}
                </Button>
                {mode !== 'gabung' && (
                  <Button size="sm" variant="secondary" icon={Square} onClick={addBlank}>
                    {t('pdf.blank_page')}
                  </Button>
                )}
                {busy && <Loader2 size={16} className="animate-spin text-blue-500" aria-label={t('pdf.reading_aria')} />}

                <span className="mx-1 hidden h-5 w-px bg-border sm:inline-block" />
                <button
                  type="button"
                  onClick={() => setSelected(allSelected ? [] : pages.map((p) => p.id))}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-secondary transition-smooth hover:bg-card-muted hover:text-primary"
                >
                  {allSelected ? t('pdf.unselect_all') : t('pdf.select_all')}
                </button>
                {selected.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-blue-500/10 py-1 pl-3 pr-1">
                    <span className="text-[12px] font-semibold text-blue-700 dark:text-blue-300">{t('pdf.n_selected', { count: selected.length })}</span>
                    <IconBtn label={t('pdf.rotate_left_selected')} onClick={() => rotate(selected, -90)}>
                      <RotateCcw size={14} />
                    </IconBtn>
                    <IconBtn label={t('pdf.rotate_right_selected')} onClick={() => rotate(selected, 90)}>
                      <RotateCw size={14} />
                    </IconBtn>
                    <button
                      type="button"
                      onClick={() => remove(selected)}
                      className="inline-flex h-7 items-center gap-1 rounded-full bg-red-500 px-2.5 text-[12px] font-medium text-white transition-smooth hover:bg-red-600"
                    >
                      <Trash2 size={13} /> {t('pdf.delete')}
                    </button>
                    <IconBtn label={t('pdf.unselect')} onClick={() => setSelected([])}>
                      <X size={14} />
                    </IconBtn>
                  </div>
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-secondary transition-smooth hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 size={13} /> {t('pdf.clear')}
                </button>
              </div>

              {/* Scan: filter warna */}
              {mode === 'scan' && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-[12px] font-medium text-secondary">{t('pdf.color_mode')}</span>
                  <div role="radiogroup" aria-label={t('pdf.color_mode_label')} className="inline-flex gap-1 rounded-lg bg-card-muted p-1">
                    {SCAN_FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        role="radio"
                        aria-checked={filter === f.id}
                        title={t(`pdf.filter_${f.id}_hint`)}
                        onClick={() => setFilter(f.id)}
                        className={`h-8 rounded-md px-3 text-[12px] font-medium transition-smooth ${
                          filter === f.id ? 'bg-card text-primary shadow-tab dark:bg-zinc-700' : 'text-secondary hover:text-primary'
                        }`}
                      >
                        {t(`pdf.filter_${f.id}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Gabungkan: urutan file */}
              {mode === 'gabung' && fileOrder.length > 0 && (
                <ol className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {fileOrder.map((id, i) => {
                    const s = sources[id];
                    const count = pages.filter((p) => p.sourceId === id).length;
                    return (
                      <li key={id} className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[12px] font-semibold text-blue-700 dark:text-blue-300">{i + 1}</span>
                        <FileText size={16} className="shrink-0 text-secondary" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-primary" title={s?.name}>{s?.name}</p>
                          <p className="text-[11px] text-tertiary">{t('pdf.pages_count', { count })}{s?.bytes ? ` · ${formatSize(s.bytes.length)}` : ''}</p>
                        </div>
                        <IconBtn label={t('pdf.move_up')} onClick={() => moveFile(id, -1)} disabled={i === 0}>
                          <ArrowUp size={14} />
                        </IconBtn>
                        <IconBtn label={t('pdf.move_down')} onClick={() => moveFile(id, 1)} disabled={i === fileOrder.length - 1}>
                          <ArrowDown size={14} />
                        </IconBtn>
                        <IconBtn label={t('pdf.remove_file', { name: s?.name })} danger onClick={() => removeFile(id)}>
                          <X size={14} />
                        </IconBtn>
                      </li>
                    );
                  })}
                </ol>
              )}

              <p className="mb-3 text-[12px] text-secondary">
                {t('pdf.drag_help')}
              </p>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {pages.map((page, i) => (
                      <PageCard
                        key={page.id}
                        page={page}
                        number={i + 1}
                        thumb={thumbs[thumbKey(page)] === 'error' ? null : thumbs[thumbKey(page)]}
                        selected={selected.includes(page.id)}
                        onToggle={toggle}
                        onRotate={rotate}
                        onDelete={remove}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>

        {/* Bilah unduh menempel di bawah */}
        {!empty && (
          <div className="fixed inset-x-0 bottom-[76px] z-30 px-3 sm:bottom-[88px] sm:px-6">
            <div className="glass glass-blur mx-auto flex max-w-4xl flex-wrap items-center gap-2 rounded-3xl p-2.5 sm:flex-nowrap sm:gap-3 sm:rounded-full sm:pl-5">
              <span className="text-[13px] font-semibold tabular-nums text-primary">{t('pdf.pages_count', { count: pages.length })}</span>
              <label htmlFor="pdf-name" className="sr-only">{t('pdf.file_name')}</label>
              <div className="relative min-w-0 flex-1">
                <input
                  id="pdf-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder={config.fileName(t, sources)}
                  className="ios-no-zoom h-9 w-full min-w-[120px] rounded-full border border-border bg-card pl-3.5 pr-12 text-[13px] text-primary placeholder:text-tertiary focus:border-blue-500 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-tertiary">.pdf</span>
              </div>
              {hasImages && (
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  aria-label={t('pdf.page_size')}
                  className="h-9 rounded-full border border-border bg-card px-3 text-[12px] text-primary focus:border-blue-500 focus:outline-none"
                >
                  <option value="a4">{t('pdf.size_a4')}</option>
                  <option value="fit">{t('pdf.size_fit')}</option>
                </select>
              )}
              <Button variant="primary" icon={progress != null ? Loader2 : Download} onClick={download} disabled={progress != null || busy} className="w-full sm:w-auto">
                {progress != null ? t('pdf.building', { percent: Math.round(progress * 100) }) : t('pdf.download')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
