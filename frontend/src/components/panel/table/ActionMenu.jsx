import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';

const MENU_WIDTH = 200;
const ITEM_HEIGHT = 36;
const GAP = 6;
const CLOSE_MS = 150;

const ITEM =
  'flex h-9 w-full items-center gap-2.5 rounded-sm px-2.5 text-left text-[13px] transition-smooth hover:bg-card-muted focus:bg-card-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

// Tombol ikon di samping menu titik tiga, misalnya "Lihat detail".
export function IconAction({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border text-secondary transition-smooth hover:border-blue-500 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-8 sm:rounded-md"
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden="true" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </button>
  );
}

// Menu aksi titik tiga. Semua aksi satu baris tabel ada di sini.
// items: [{ label, icon, onClick?, to?, href?, danger?, disabled? }] (nilai false/null dilewati).
// Menu digambar lewat portal dengan posisi fixed, supaya tidak terpotong area gulir tabel.
export default function ActionMenu({ items, label = 'Aksi lainnya', disabled = false }) {
  const list = (items || []).filter(Boolean);
  const [open, setOpen] = useState(false); // menu ada di halaman
  const [shown, setShown] = useState(false); // menu dalam keadaan tampil (untuk animasi)
  const [pos, setPos] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const closeTimer = useRef(null);

  const close = (focusButton = false) => {
    setShown(false);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_MS);
    if (focusButton) buttonRef.current?.focus({ preventScroll: true });
  };

  const openMenu = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    const height = list.length * ITEM_HEIGHT + 10;
    const spaceBelow = window.innerHeight - rect.bottom;
    const up = spaceBelow < height + GAP + 8 && rect.top > height + GAP + 8;
    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    setPos({ left, top: up ? rect.top - height - GAP : rect.bottom + GAP, up });
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  // Tampilkan satu frame setelah menu dipasang, supaya transisinya berjalan.
  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (shown) menuRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus({ preventScroll: true });
  }, [shown]);

  // Tutup saat klik di luar, Escape, layar digulir, atau ukuran layar berubah.
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
    const onMove = () => close();
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Panah atas/bawah, Home, dan End memindahkan fokus antar item. Tab menutup menu.
  const onMenuKeyDown = (e) => {
    const nodes = [...(menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') || [])];
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
    }
  };

  const run = (item) => {
    close();
    item.onClick?.();
  };

  if (!list.length) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open && shown}
        disabled={disabled}
        onClick={() => (open && shown ? close() : openMenu())}
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border text-secondary transition-smooth hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-8 sm:rounded-md ${
          open && shown ? 'border-border-focus text-primary' : 'border-border hover:border-border-hover'
        }`}
      >
        <MoreVertical size={16} strokeWidth={1.75} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            style={{ left: pos.left, top: pos.top, width: MENU_WIDTH }}
            className={`fixed z-[70] rounded-md border border-border bg-card p-1 shadow-menu dark:shadow-menu-dark transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
              pos.up ? 'origin-bottom-right' : 'origin-top-right'
            } ${
              shown
                ? 'translate-y-0 scale-100 opacity-100'
                : `pointer-events-none scale-95 opacity-0 ${pos.up ? 'translate-y-1' : '-translate-y-1'}`
            }`}
          >
            {list.map((item) => {
              const Icon = item.icon;
              const tone = item.danger ? 'text-danger' : 'text-primary';
              const content = (
                <>
                  {Icon && <Icon size={15} strokeWidth={1.75} aria-hidden="true" className={`shrink-0 ${item.danger ? '' : 'text-secondary'}`} />}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </>
              );
              if (item.to) {
                return (
                  <Link key={item.label} to={item.to} role="menuitem" onClick={() => close()} className={`${ITEM} ${tone}`}>
                    {content}
                  </Link>
                );
              }
              if (item.href) {
                return (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => close()} className={`${ITEM} ${tone}`}>
                    {content}
                  </a>
                );
              }
              return (
                <button key={item.label} type="button" role="menuitem" disabled={item.disabled} onClick={() => run(item)} className={`${ITEM} ${tone}`}>
                  {content}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
