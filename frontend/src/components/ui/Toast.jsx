import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: {
    bar: 'bg-emerald-500',
    icon: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  error: {
    bar: 'bg-red-500',
    icon: 'text-red-400',
    border: 'border-red-500/20',
  },
  warning: {
    bar: 'bg-amber-400',
    icon: 'text-amber-400',
    border: 'border-amber-400/20',
  },
  info: {
    bar: 'bg-blue-500',
    icon: 'text-blue-400',
    border: 'border-blue-500/20',
  },
};

function ToastItem({ id, type = 'info', title, message, onRemove }) {
  const Icon = ICONS[type] || Info;
  const style = STYLES[type] || STYLES.info;

  return (
    <div
      className={`group relative flex items-start gap-3 w-full max-w-sm bg-card border ${style.border} rounded-xl shadow-2xl px-4 py-3 overflow-hidden animate-in slide-in-from-right-5 fade-in duration-300`}
    >
      {/* Left color bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar} rounded-l-xl`} />

      <Icon size={20} className={`${style.icon} shrink-0 mt-0.5`} />

      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-primary leading-tight">{title}</p>}
        {message && <p className="text-xs text-secondary mt-0.5 leading-relaxed">{message}</p>}
      </div>

      <button
        onClick={() => onRemove(id)}
        className="shrink-0 text-secondary hover:text-primary transition-colors p-0.5 opacity-0 group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 3500 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-24 right-4 z-[99999] flex flex-col gap-2 items-end pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem {...t} onRemove={removeToast} />
            </div>
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
