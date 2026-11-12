import React from 'react';
import { QR_MARK_PATH, QR_MARK_VIEWBOX } from '../../lib/qrCode';

// Logo OpenTools (garis silang), sama dengan logo di tengah QR. Digambar sebagai SVG satu warna yang mengikuti
// warna teks (currentColor), jadi warnanya bisa diganti lewat kelas warna teks.
export default function SiteLogo({ className = '', title }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={QR_MARK_VIEWBOX}
      className={className}
      fill="currentColor"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      <path d={QR_MARK_PATH} />
    </svg>
  );
}
