import React from 'react';
import { BadgePercent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { discountLabel, rupiah } from '../../lib/pricing';

/** Label diskon berbentuk pil, mis. "Diskon 15%". tone: 'red' (bawaan) atau 'current' (ikut warna teks kartu). */
export function DiscountBadge({ discount, tone = 'red', className = '' }) {
  const { t } = useTranslation();
  if (!discount) return null;
  const color = tone === 'current' ? 'border border-current' : 'bg-red-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]';
  return (
    <span className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold ${color} ${className}`}>
      <BadgePercent size={13} strokeWidth={2} aria-hidden="true" />
      {discountLabel(discount, t)}
    </span>
  );
}

/**
 * Harga paket: harga normal dicoret (kalau ada diskon), lalu harga yang dibayar dan periodenya.
 * plan: { price, basePrice, discount }. muted: kelas warna teks pelengkap (harga coret, periode, tanggal).
 */
export default function PlanPrice({ plan, period, muted = 'text-secondary', className = '' }) {
  const { t, i18n } = useTranslation();
  const discounted = Boolean(plan?.discount) && plan.basePrice > plan.price;
  // Tanggal akhir diskon (YYYY-MM-DD, WIB) dalam bahasa yang sedang dipakai.
  const endDate = (ymd) =>
    ymd
      ? new Date(`${ymd}T00:00:00+07:00`).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Jakarta',
        })
      : '';
  return (
    <div className={className}>
      {discounted && (
        <p className={`text-[13px] leading-5 ${muted}`}>
          <span className="sr-only">{t('qr.price.normal')}</span>
          <s>{rupiah(plan.basePrice)}</s>
        </p>
      )}
      <p className="text-[26px] font-semibold leading-[30px] tabular-nums">
        {discounted && <span className="sr-only">{t('qr.price.afterDiscount')}</span>}
        {rupiah(plan?.price)} {period && <span className={`text-[13px] font-normal ${muted}`}>{period}</span>}
      </p>
      {discounted && plan.discount.endsAt && (
        <p className={`mt-1 text-[11px] ${muted}`}>{t('qr.price.discountUntil', { date: endDate(plan.discount.endsAt) })}</p>
      )}
    </div>
  );
}
