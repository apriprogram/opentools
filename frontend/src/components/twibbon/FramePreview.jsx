import React from 'react';
import { ImagePlus, UserRound } from 'lucide-react';

// Pratinjau bingkai Twibbon di atas contoh foto (latar abu-abu dengan siluet),
// supaya area transparan untuk foto terlihat jelas.
export default function FramePreview({ src, alt = '', className = '', rounded = 'rounded-md' }) {
  return (
    <div className={`relative aspect-square w-full overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-400 dark:from-zinc-600 dark:to-zinc-800 ${rounded} ${className}`}>
      <span className="absolute inset-0 flex items-center justify-center text-white/70">
        <UserRound strokeWidth={1.25} aria-hidden="true" className="h-[42%] w-[42%]" />
      </span>
      {src ? (
        <img src={src} alt={alt} decoding="async" className="absolute inset-0 h-full w-full object-contain" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-card-muted text-tertiary">
          <ImagePlus size={28} strokeWidth={1.5} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
