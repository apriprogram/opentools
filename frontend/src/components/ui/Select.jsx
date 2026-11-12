import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

const GAP = 6;
const MAX_HEIGHT = 300;
const CLOSE_MS = 150;

const SIZES = {
  sm: 'h-8 text-[12px]',
  md: 'h-8 text-[12px] sm:h-9 sm:text-[13px]',
  lg: 'h-[44px] text-[14px]',
};

// Dropdown pilihan dengan tampilan sendiri (pengganti <select> bawaan browser).
// options: [{ id, label, icon?, hint?, group? }]. Opsi dengan group yang sama dikelompokkan di bawah satu judul.
// Menu digambar lewat portal dengan posisi fixed, jadi tidak terpotong tabel, kartu, atau modal.
// Keyboard: Enter/Spasi/panah membuka, panah memindahkan, Enter memilih, Escape menutup.
export default function Select({
  value,
  onChange,
  options = [],
  label,
  icon: LeadIcon,
  placeholder = 'Pilih',
  size = 'md',
  align = 'left',
  className = '',
  buttonClassName = '',
  menuWidth,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const closeTimer = useRef(null);

  const selected = options.find((o) => String(o.id) === String(value)) || null;
  const SelectedIcon = selected?.icon;

  const close = (focusButton = false) => {
    setShown(false);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_MS);
    if (focusButton) buttonRef.current?.focus({ preventScroll: true });
  };

  const openMenu = () => {
    if (disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const groups = new Set(options.map((o) => o.group).filter(Boolean)).size;
    const wanted = Math.min(MAX_HEIGHT, options.length * 34 + groups * 26 + 10);
    const below = window.innerHeight - rect.bottom - GAP - 8;
    const above = rect.top - GAP - 8;
    const up = below < Math.min(wanted, 160) && above > below;
    const maxHeight = Math.max(120, Math.min(MAX_HEIGHT, up ? above : below));
    const width = Math.min(Math.max(menuWidth || 0, rect.width, 150), window.innerWidth - 16);
    let left = align === 'right' ? rect.right - width : rect.left;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    setPos({ left, width, maxHeight, up, top: up ? undefined : rect.bottom + GAP, bottom: up ? window.innerHeight - rect.top + GAP : undefined });
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  // Tampilkan satu frame setelah menu dipasang, supaya transisinya berjalan.
  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Saat menu tampil, fokus ke opsi yang sedang dipilih (atau opsi pertama).
  useEffect(() => {
    if (!shown) return;
    const menu = menuRef.current;
    const target = menu?.querySelector('[aria-selected="true"]') || menu?.querySelector('[role="option"]');
    target?.focus({ preventScroll: true });
    target?.scrollIntoView?.({ block: 'nearest' });
  }, [shown]);

  // Tutup saat klik di luar, Escape, halaman digulir, atau ukuran layar berubah.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (menuRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      close();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close(true);
      }
    };
    const onScroll = (e) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
      close();
    };
    const onResize = () => close();
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const choose = (id) => {
    close(true);
    if (String(id) !== String(value)) onChange(id);
  };

  const onButtonKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) openMenu();
    }
  };

  const onMenuKeyDown = (e) => {
    const nodes = [...(menuRef.current?.querySelectorAll('[role="option"]') || [])];
    if (!nodes.length) return;
    const index = nodes.indexOf(document.activeElement);
    let next = null;
    if (e.key === 'ArrowDown') next = nodes[(index + 1) % nodes.length];
    else if (e.key === 'ArrowUp') next = nodes[(index - 1 + nodes.length) % nodes.length];
    else if (e.key === 'Home') next = nodes[0];
    else if (e.key === 'End') next = nodes[nodes.length - 1];
    else if (e.key === 'Tab') close();
    if (next) {
      e.preventDefault();
      next.focus({ preventScroll: true });
      next.scrollIntoView({ block: 'nearest' });
    }
  };

  let lastGroup = null;

  return (
    <div className={`relative min-w-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open && shown}
        aria-label={label ? `${label}: ${selected?.label || placeholder}` : undefined}
        title={label}
        disabled={disabled}
        onClick={() => (open && shown ? close() : openMenu())}
        onKeyDown={onButtonKeyDown}
        className={`flex w-full items-center gap-2 rounded-md border bg-card pl-2.5 pr-2 text-left text-primary transition-smooth focus:outline-none focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size] || SIZES.md} ${
          open && shown ? 'border-border-focus' : 'border-border hover:border-border-hover'
        } ${buttonClassName}`}
      >
        {LeadIcon && <LeadIcon size={14} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-tertiary" />}
        {SelectedIcon && <SelectedIcon size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-secondary" />}
        <span className={`min-w-0 flex-1 truncate ${selected ? '' : 'text-tertiary'}`}>{selected?.label || placeholder}</span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          aria-hidden="true"
          className={`shrink-0 text-tertiary transition-transform duration-150 motion-reduce:transition-none ${open && shown ? 'rotate-180' : ''}`}
        />
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxHeight }}
            className={`fixed z-[95] overflow-y-auto rounded-md border border-border bg-card p-1 shadow-menu transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none dark:shadow-menu-dark ${
              pos.up ? 'origin-bottom' : 'origin-top'
            } ${shown ? 'translate-y-0 scale-100 opacity-100' : `pointer-events-none scale-95 opacity-0 ${pos.up ? 'translate-y-1' : '-translate-y-1'}`}`}
          >
            {options.map((option) => {
              const active = String(option.id) === String(value);
              const Icon = option.icon;
              const heading = option.group && option.group !== lastGroup ? option.group : null;
              lastGroup = option.group || null;
              return (
                <React.Fragment key={option.id}>
                  {heading && (
                    <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-tertiary first:pt-1">{heading}</p>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => choose(option.id)}
                    className={`flex min-h-[34px] w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] transition-smooth hover:bg-card-muted focus:bg-card-muted focus:outline-none ${
                      active ? 'font-medium text-primary' : 'text-secondary hover:text-primary focus:text-primary'
                    }`}
                  >
                    {Icon && <Icon size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />}
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.hint && <span className="shrink-0 text-[11px] font-normal tabular-nums text-tertiary">{option.hint}</span>}
                    {active && <Check size={14} strokeWidth={2} aria-hidden="true" className="shrink-0 text-blue-500" />}
                  </button>
                </React.Fragment>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
