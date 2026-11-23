import React from 'react';
import { Gauge, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PRESETS = [25, 50, 75];

/**
 * Pengatur ukuran hasil kompresi.
 * value null = Otomatis (kualitas seimbang). Angka 10 sampai 90 = ukuran hasil dibidik sekian persen dari file asli.
 */
export default function SizeTarget({ value, onChange, disabled = false }) {
  const { t } = useTranslation();
  const custom = value != null;
  const percent = value ?? 50;

  return (
    <div className="rounded-md border border-border bg-card-muted p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="block text-[13px] font-semibold text-primary">{t('converter.size_title')}</span>
          <span className="text-[12px] text-secondary">
            {custom ? t('converter.size_custom_hint', { percent }) : t('converter.size_auto_hint')}
          </span>
        </div>
        <div role="radiogroup" aria-label={t('converter.size_mode')} className="inline-flex shrink-0 gap-1 self-start rounded-lg bg-card p-1 sm:self-auto">
          {[
            [false, t('converter.size_auto'), Sparkles],
            [true, t('converter.size_custom'), Gauge],
          ].map(([isCustom, label, Icon]) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={custom === isCustom}
              disabled={disabled}
              onClick={() => onChange(isCustom ? percent : null)}
              className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 ${
                custom === isCustom ? 'bg-blue-500 text-white' : 'text-secondary hover:text-primary'
              }`}
            >
              <Icon size={13} strokeWidth={2} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {custom && (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <label htmlFor="size-target" className="sr-only">{t('converter.size_slider')}</label>
            <input
              id="size-target"
              type="range"
              min={10}
              max={90}
              step={5}
              value={percent}
              disabled={disabled}
              onChange={(e) => onChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-blue-500 disabled:cursor-not-allowed"
            />
            <span className="w-12 shrink-0 text-right text-[15px] font-semibold tabular-nums text-primary">{percent}%</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={disabled}
                onClick={() => onChange(p)}
                aria-pressed={percent === p}
                className={`h-7 rounded-full border px-2.5 text-[11px] font-medium transition-smooth ${
                  percent === p ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-border text-secondary hover:text-primary'
                }`}
              >
                {p}%
              </button>
            ))}
            <span className="text-[11px] text-tertiary">{t('converter.size_note')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
