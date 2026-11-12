import React from 'react';

// Foto profil akun. Bila belum ada foto, tampil huruf pertama nama.
// className mengatur ukuran dan ukuran huruf, misalnya "h-8 w-8 text-[12px]".
export default function Avatar({ user, src, className = 'h-8 w-8 text-[12px]' }) {
  const image = src !== undefined ? src : user?.avatar;
  const name = user?.name || user?.username || user?.email || '';
  if (image) {
    return <img src={image} alt="" className={`shrink-0 rounded-full border border-border object-cover ${className}`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent-black font-semibold text-white dark:bg-white dark:text-black ${className}`}
    >
      {(name || 'A').slice(0, 1).toUpperCase()}
    </span>
  );
}
