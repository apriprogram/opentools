import React, { useEffect, useState } from 'react';

// Hitung mundur sampai waktu berakhir. Diperbarui setiap detik.
export function formatRemaining(ms) {
  if (ms <= 0) return 'Berakhir';
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return days > 0 ? `${days} hari ${clock}` : clock;
}

export default function Countdown({ expiresAt, expiredText = 'Berakhir', className = '' }) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return <span className={className}>Gratis, tidak berakhir</span>;
  const remaining = target - now;
  if (remaining <= 0) return <span className={`text-danger ${className}`}>{expiredText}</span>;
  return <span className={`tabular-nums ${className}`}>{formatRemaining(remaining)}</span>;
}
