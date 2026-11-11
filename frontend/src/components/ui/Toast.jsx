import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const MAX_TOASTS = 4;
const LEAVE_MS = 200;

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

// Warna ikon per jenis notifikasi. Kartunya sendiri tetap netral.
const TONES = {
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

function ToastItem({ id, type = 'info', title, message, leaving, onRemove }) {
  const Icon = ICONS[type] || Info;
  const tone = TONES[type] || TONES.info;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-full max-w-[380px] items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-menu dark:shadow-menu-dark motion-reduce:animate-none ${
        leaving
          ? 'animate-out fade-out slide-out-to-top-2 duration-200 fill-mode-forwards'
          : 'animate-in fade-in slide-in-from-top-3 duration-300'
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}>
        <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1 py-0.5">
        {title && <p className="text-[13px] font-semibold leading-snug text-primary">{title}</p>}
        {message && <p className="mt-0.5 text-[12px] leading-relaxed text-secondary [overflow-wrap:anywhere]">{message}</p>}
      </div>

      <button
        type="button"
        aria-label="Tutup notifikasi"
        onClick={() => onRemove(id)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-tertiary transition-smooth hover:bg-card-muted hover:text-primary"
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  // Tandai notifikasi sedang keluar (animasi), lalu hapus setelah animasinya selesai.
  const removeToast = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, LEAVE_MS)
    );
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, duration = 3500 }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, title, message }].slice(-MAX_TOASTS));
      timers.current.set(id, setTimeout(() => removeToast(id), duration));
      return id;
    },
    [removeToast]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {createPortal(
        // Notifikasi tampil di atas tengah. Yang terbaru ada di paling atas.
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-3 z-[99999] flex flex-col-reverse items-center gap-2 px-3 sm:top-4"
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} {...t} onRemove={removeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
