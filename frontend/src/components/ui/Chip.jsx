import React from 'react';

export default function Chip({
  label,
  selected = false,
  onClick,
  className = '',
  pill = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[24px] px-[10px] text-[11px] font-medium uppercase tracking-wider transition-smooth select-none flex items-center justify-center ${
        pill ? 'rounded-full' : 'rounded-sm'
      } ${
        selected
          ? 'bg-accent-black text-white'
          : 'bg-card-muted text-secondary hover:text-primary hover:bg-[#EAEAEB]'
      } ${className}`}
    >
      {label}
    </button>
  );
}
