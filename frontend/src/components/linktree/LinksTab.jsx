import React from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Heading, Plus, Share2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { SOCIAL, SOCIAL_BY_ID, MAX_ITEMS, newItem } from './constants';

const INPUT =
  'h-[40px] w-full rounded-md border border-border bg-card px-3 text-[14px] text-primary placeholder:text-tertiary focus:outline-none focus:border-border-focus transition-smooth';

const TYPE_LABEL = { link: 'Tautan', header: 'Header', social: 'Ikon sosial' };

// Daftar item Linktree: tautan, header, dan ikon sosial. Urutan mengikuti posisi di daftar.
export default function LinksTab({ items, onChange }) {
  const update = (index, patch) => onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const move = (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };
  const add = (type) => {
    if (items.length >= MAX_ITEMS) return;
    onChange([...items, newItem(type)]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon={Plus} onClick={() => add('link')}>Tautan</Button>
        <Button variant="secondary" icon={Heading} onClick={() => add('header')}>Header</Button>
        <Button variant="secondary" icon={Share2} onClick={() => add('social')}>Ikon sosial</Button>
      </div>
      <p className="text-[12px] text-tertiary">{items.length} dari {MAX_ITEMS} item</p>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-[13px] text-secondary">
          Belum ada item. Tambahkan tautan pertama Anda.
        </div>
      )}

      {items.map((item, index) => (
        <div key={item.id} className={`rounded-2xl border border-border bg-card p-4 ${item.enabled ? '' : 'opacity-60'}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-tertiary">{TYPE_LABEL[item.type]}</span>
            <div className="flex items-center gap-1">
              <IconButton label="Naik" icon={ArrowUp} disabled={index === 0} onClick={() => move(index, -1)} />
              <IconButton label="Turun" icon={ArrowDown} disabled={index === items.length - 1} onClick={() => move(index, 1)} />
              {item.type !== 'header' && (
                <IconButton
                  label={item.enabled ? 'Sembunyikan' : 'Tampilkan'}
                  icon={item.enabled ? Eye : EyeOff}
                  onClick={() => update(index, { enabled: !item.enabled })}
                />
              )}
              <IconButton label="Hapus" icon={Trash2} danger onClick={() => remove(index)} />
            </div>
          </div>

          {item.type === 'header' && (
            <input
              type="text"
              value={item.title}
              maxLength={200}
              placeholder="Teks header"
              onChange={(e) => update(index, { title: e.target.value })}
              className={INPUT}
            />
          )}

          {item.type === 'link' && (
            <div className="grid gap-2">
              <input
                type="text"
                value={item.title}
                maxLength={200}
                placeholder="Judul tautan"
                onChange={(e) => update(index, { title: e.target.value })}
                className={INPUT}
              />
              <input
                type="text"
                inputMode="url"
                value={item.url}
                maxLength={2048}
                placeholder="https://"
                onChange={(e) => update(index, { url: e.target.value })}
                className={INPUT}
              />
            </div>
          )}

          {item.type === 'social' && (
            <div className="grid gap-2 sm:grid-cols-[170px_1fr]">
              <select
                value={item.platform || 'website'}
                onChange={(e) => update(index, { platform: e.target.value })}
                className={INPUT}
              >
                {SOCIAL.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <input
                type="text"
                inputMode="url"
                value={item.url}
                maxLength={2048}
                placeholder={SOCIAL_BY_ID[item.platform || 'website']?.placeholder}
                onChange={(e) => update(index, { url: e.target.value })}
                className={INPUT}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function IconButton({ label, icon: Icon, onClick, disabled = false, danger = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-smooth disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? 'text-danger hover:bg-card-muted' : 'text-secondary hover:bg-card-muted hover:text-primary'
      }`}
    >
      <Icon size={15} strokeWidth={1.75} />
    </button>
  );
}
