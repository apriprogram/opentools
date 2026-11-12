import React from 'react';
import { LOGO_PATH, LOGO_VIEWBOX } from '../../lib/qrCode';

// Logo Garudanexa (sayap). Warnanya mengikuti warna teks, jadi otomatis menyesuaikan mode terang dan gelap.
export default function BrandLogo({ className = '', title }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} fill="currentColor" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : 'true'}>
      <path d={LOGO_PATH} />
    </svg>
  );
}
