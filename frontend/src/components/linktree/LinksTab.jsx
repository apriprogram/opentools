import React, { useEffect, useRef, useState } from 'react';
import { GripVertical, Heading, Link2, Plus, Share2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Switch from '../ui/Switch';
import { LinkIconButton, IconPickerModal } from './LinkIcon';
import { SOCIAL, SOCIAL_BY_ID, MAX_ITEMS, newItem } from './constants';

// Kolom isian ringkas. Kelas ios-no-zoom memakai 16px khusus di iPhone supaya layar tidak membesar saat difokus.
const INPUT =
  'ios-no-zoom h-9 w-full rounded-md border border-border bg-card px-2.5 text-[13px] text-primary placeholder:text-tertiary transition-smooth focus:border-border-focus focus:outline-none';

const TYPE_LABEL = { link: 'Tautan', header: 'Judul bagian', social: 'Ikon sosial' };
const PLATFORM_OPTIONS = SOCIAL.map((s) => ({ id: s.id, label: s.label, icon: s.icon }));
const TILE = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card-muted text-secondary';

// Daftar isi Linktree: tautan, judul bagian, dan ikon sosial.
// Urutan diubah dengan menggeser pegangan (⋮⋮) di kiri tiap item, atau dengan panah atas/bawah saat pegangan difokus.
export default function LinksTab({ items, onChange }) {
  const [dragId, setDragId] = useState(null);
  const [pickerFor, setPickerFor] = useState(null);
  const itemRefs = useRef(new Map());
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const update = (id, patch) => onChange(itemsRef.current.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onChange(itemsRef.current.filter((it) => it.id !== id));
  const add = (type) => {
    if (items.length >= MAX_ITEMS) return;
    onChange([...items, newItem(type)]);
  };

  const moveTo = (from, to) => {
    const list = itemsRef.current;
    if (to < 0 || to >= list.length || to === from) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  // Saat menggeser, teks halaman tidak ikut terblok.
  useEffect(() => {
    if (!dragId) return undefined;
    const previous = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.userSelect = previous;
    };
  }, [dragId]);

  const onGripDown = (e, id) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.currentTarget.focus({ preventScroll: true });
    setDragId(id);
  };

  // Item berpindah begitu penunjuk melewati titik tengah item di atas atau di bawahnya.
  const onGripMove = (e, id) => {
    if (dragId !== id) return;
    const list = itemsRef.current;
    const from = list.findIndex((it) => it.id === id);
    let to = from;
    for (let i = 0; i < list.length; i++) {
      if (i === from) continue;
      const el = itemRefs.current.get(list[i].id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const middle = rect.top + rect.height / 2;
      if (i < from && e.clientY < middle) {
        to = i;
        break;
      }
      if (i > from && e.clientY > middle) to = i;
    }
    if (to !== from) moveTo(from, to);
    // Dekat tepi layar: halaman ikut bergulir.
    if (e.clientY < 90) window.scrollBy(0, -14);
    else if (e.clientY > window.innerHeight - 90) window.scrollBy(0, 14);
  };

  const onGripUp = (e) => {
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      /* penunjuk sudah dilepas */
    }
    setDragId(null);
  };

  const onGripKey = (e, index) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveTo(index, index - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveTo(index, index + 1);
    }
  };

  const full = items.length >= MAX_ITEMS;
  const pickerItem = items.find((it) => it.id === pickerFor) || null;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" icon={Plus} onClick={() => add('link')} disabled={full}>Tautan</Button>
          <Button size="sm" variant="secondary" icon={Heading} onClick={() => add('header')} disabled={full}>Judul bagian</Button>
          <Button size="sm" variant="secondary" icon={Share2} onClick={() => add('social')} disabled={full}>Ikon sosial</Button>
          <span className="ml-auto text-[11px] tabular-nums text-tertiary sm:text-[12px]">{items.length} dari {MAX_ITEMS}</span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-tertiary sm:text-[12px]">
          <GripVertical size={13} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
          Geser pegangan di kiri tiap item untuk mengubah urutan.
        </p>
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <p className="text-[13px] font-medium text-primary">Belum ada isi</p>
          <p className="mt-1 text-[12px] text-secondary">Tambahkan tautan pertama kamu lewat tombol di atas.</p>
        </div>
      )}

      {items.map((item, index) => {
        const dragging = dragId === item.id;
        const social = item.type === 'social' ? SOCIAL_BY_ID[item.platform || 'website'] || SOCIAL_BY_ID.website : null;
        const SocialIcon = social?.icon;
        const dim = item.enabled ? '' : 'opacity-50';
        return (
          <div
            key={item.id}
            ref={(el) => {
              if (el) itemRefs.current.set(item.id, el);
              else itemRefs.current.delete(item.id);
            }}
            className={`flex items-start gap-2 rounded-2xl border bg-card p-2.5 transition-smooth sm:gap-3 sm:p-3 ${
              dragging ? 'relative z-10 border-blue-500 shadow-menu dark:shadow-menu-dark' : 'border-border'
            }`}
          >
            <button
              type="button"
              aria-label={`Geser untuk mengubah urutan ${TYPE_LABEL[item.type]} ${item.title || social?.label || ''}. Bisa juga dengan panah atas dan bawah.`}
              title="Geser untuk mengubah urutan"
              onPointerDown={(e) => onGripDown(e, item.id)}
              onPointerMove={(e) => onGripMove(e, item.id)}
              onPointerUp={onGripUp}
              onPointerCancel={onGripUp}
              onKeyDown={(e) => onGripKey(e, index)}
              className={`flex h-10 w-6 shrink-0 touch-none items-center justify-center rounded-md text-tertiary transition-smooth hover:bg-card-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                dragging ? 'cursor-grabbing bg-card-muted text-primary' : 'cursor-grab'
              }`}
            >
              <GripVertical size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>

            {item.type === 'link' && <LinkIconButton value={item.icon} onClick={() => setPickerFor(item.id)} />}
            {item.type === 'header' && (
              <span className={TILE}><Heading size={17} strokeWidth={1.75} aria-hidden="true" /></span>
            )}
            {item.type === 'social' && (
              <span className={TILE}><SocialIcon size={17} strokeWidth={1.75} aria-hidden="true" /></span>
            )}

            <div className={`min-w-0 flex-1 ${dim}`}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
                {TYPE_LABEL[item.type]}
                {!item.enabled && <span className="ml-1.5 normal-case tracking-normal">(disembunyikan)</span>}
              </p>

              {item.type === 'header' && (
                <input
                  type="text"
                  value={item.title}
                  maxLength={200}
                  placeholder="Contoh: Daftar menu"
                  aria-label="Teks judul bagian"
                  onChange={(e) => update(item.id, { title: e.target.value })}
                  className={`${INPUT} font-medium`}
                />
              )}

              {item.type === 'link' && (
                <div className="grid gap-1.5">
                  <input
                    type="text"
                    value={item.title}
                    maxLength={200}
                    placeholder="Judul tautan"
                    aria-label="Judul tautan"
                    onChange={(e) => update(item.id, { title: e.target.value })}
                    className={`${INPUT} font-medium`}
                  />
                  <label className="relative block">
                    <span className="sr-only">Alamat tautan</span>
                    <Link2 size={14} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" />
                    <input
                      type="text"
                      inputMode="url"
                      value={item.url}
                      maxLength={2048}
                      placeholder="https://alamat-tujuan.com"
                      onChange={(e) => update(item.id, { url: e.target.value })}
                      className={`${INPUT} pl-8`}
                    />
                  </label>
                </div>
              )}

              {item.type === 'social' && (
                <div className="grid gap-1.5 sm:grid-cols-[168px_minmax(0,1fr)]">
                  <Select
                    value={item.platform || 'website'}
                    label="Platform"
                    options={PLATFORM_OPTIONS}
                    onChange={(platform) => update(item.id, { platform })}
                  />
                  <input
                    type="text"
                    inputMode="url"
                    value={item.url}
                    maxLength={2048}
                    placeholder={social?.placeholder}
                    aria-label="Alamat akun"
                    onChange={(e) => update(item.id, { url: e.target.value })}
                    className={INPUT}
                  />
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-center gap-2 pt-1 sm:flex-row sm:gap-2.5 sm:pt-2.5">
              {item.type !== 'header' && (
                <Switch
                  checked={item.enabled}
                  onChange={(enabled) => update(item.id, { enabled })}
                  label={`Tampilkan ${TYPE_LABEL[item.type]} ${item.title || social?.label || ''} di halaman`}
                  title={item.enabled ? 'Tampil di halaman. Klik untuk menyembunyikan.' : 'Disembunyikan. Klik untuk menampilkan.'}
                />
              )}
              <button
                type="button"
                aria-label={`Hapus ${TYPE_LABEL[item.type]} ${item.title || social?.label || ''}`}
                title="Hapus"
                onClick={() => remove(item.id)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-tertiary transition-smooth hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}

      {pickerItem && (
        <IconPickerModal
          value={pickerItem.icon}
          onPick={(icon) => update(pickerItem.id, { icon })}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}
