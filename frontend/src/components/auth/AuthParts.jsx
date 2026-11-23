import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ImagePlus, Link2, QrCode } from 'lucide-react';
import SiteLogo from '../ui/SiteLogo';

// Kerangka halaman Masuk dan Daftar: logo, judul, kartu formulir, dan tautan pindah halaman di bawahnya.
export function AuthShell({ title, subtitle, children, footer }) {
  const { t } = useTranslation();
  return (
    <main className="flex w-full justify-center px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
      <section className="w-full max-w-[420px]">
        <div className="mb-5 flex flex-col items-center text-center sm:mb-6">
          {/* Logo OpenTools tanpa latar, sama seperti di navbar. */}
          <SiteLogo className="h-11 w-11 text-[#034AFC] dark:text-[#5B86FF]" title={t('auth.logo_title')} />
          <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-primary sm:text-[24px]">{title}</h1>
          {subtitle && <p className="mt-1 max-w-[340px] text-[13px] leading-relaxed text-secondary sm:text-[14px]">{subtitle}</p>}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">{children}</div>

        {footer && <p className="mt-4 text-center text-[13px] text-secondary">{footer}</p>}

        {/* Yang bisa dikelola dari satu akun */}
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-tertiary">
          {[
            [QrCode, 'QR Generator'],
            [Link2, 'Linktree'],
            [ImagePlus, 'Twibbon'],
          ].map(([Icon, label]) => (
            <li key={label} className="inline-flex items-center gap-1.5">
              <Icon size={13} strokeWidth={1.75} aria-hidden="true" /> {label}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

const INPUT =
  'ios-no-zoom h-11 w-full rounded-md border border-border bg-card pl-10 text-[14px] text-primary placeholder:text-tertiary transition-smooth hover:border-border-hover focus:border-border-focus focus:outline-none';

// Kolom isian dengan ikon di kiri. Untuk password, ada tombol mata di kanan untuk melihat atau menyembunyikan isinya.
export function AuthField({ id, label, icon: Icon, type = 'text', hint, error, className = '', ...props }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-medium text-secondary sm:text-[13px]">{label}</label>
      <div className="relative">
        {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary" />}
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || hint ? `${id}-note` : undefined}
          className={`${INPUT} ${isPassword ? 'pr-11' : 'pr-3'} ${error ? 'border-red-500 focus:border-red-500' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t('auth.hide_password') : t('auth.show_password')}
            aria-pressed={visible}
            title={visible ? t('auth.hide_password') : t('auth.show_password')}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-tertiary transition-smooth hover:bg-card-muted hover:text-primary"
          >
            {visible ? <EyeOff size={16} strokeWidth={1.75} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.75} aria-hidden="true" />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <p id={`${id}-note`} className={`mt-1 text-[11px] sm:text-[12px] ${error ? 'text-danger' : 'text-tertiary'}`}>{error || hint}</p>
      )}
    </div>
  );
}

// Keterangan singkat sesuai halaman yang dituju setelah masuk. t: fungsi terjemahan dari useTranslation.
export const purposeText = (t, nextPath, paket) => {
  if (nextPath?.startsWith('/dashboard/twibbon')) return t('auth.purpose_twibbon');
  if (nextPath?.startsWith('/dashboard/linktree')) return t('auth.purpose_linktree');
  if (paket) return t('auth.purpose_order');
  return t('auth.purpose_default');
};
