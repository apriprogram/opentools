import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: TitleIcon,
  children,
  footer,
  maxWidth = 'max-w-[620px]',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-[2px] transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] bg-card rounded-xl border border-border shadow-subtle-modal flex flex-col overflow-hidden animate-in fade-in zoom-in-98 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border select-none">
          <div className="flex items-center gap-3">
            {TitleIcon && (
              <div className="w-8 h-8 rounded-md bg-card-muted border border-border flex items-center justify-center text-primary">
                <TitleIcon size={18} strokeWidth={1.75} />
              </div>
            )}
            <div>
              <h2 className="text-[18px] font-semibold text-primary leading-[24px]">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[12px] text-secondary leading-[16px] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <IconButton
            icon={X}
            size="sm"
            variant="ghost"
            title="Close"
            onClick={onClose}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-between gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
