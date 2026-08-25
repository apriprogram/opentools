import React from 'react';

export default function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  muted = false,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-border transition-smooth animate-in fade-in zoom-in-95 duration-300 fill-mode-forwards ${
        muted ? 'bg-card-muted' : 'bg-card'
      } ${
        hoverable
          ? 'cursor-pointer hover:border-border-hover'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
