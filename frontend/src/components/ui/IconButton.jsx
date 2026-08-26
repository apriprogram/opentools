import React from 'react';

export default function IconButton({
  icon: Icon,
  size = 'md', // 'sm' (32x32) | 'md' (40x40)
  variant = 'bordered', // 'bordered' | 'ghost' | 'black' | 'danger'
  onClick,
  title,
  disabled = false,
  className = '',
  ...props
}) {
  const sizeStyles = {
    sm: 'w-[32px] h-[32px]',
    md: 'w-[40px] h-[40px]',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
  };

  const variantStyles = {
    bordered:
      'bg-card dark:bg-zinc-900 border border-border text-primary hover:border-border-hover hover:bg-card-muted dark:hover:bg-zinc-800 active:bg-[#ECECED] dark:active:bg-zinc-800',
    ghost:
      'bg-transparent text-primary hover:bg-card-muted active:bg-[#ECECED]',
    black:
      'bg-accent-black text-white hover:bg-accent-black-hover active:scale-95',
    danger:
      'bg-transparent text-tertiary hover:text-danger hover:bg-[#FEE2E2] active:bg-[#FECACA]',
  };

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-black disabled:opacity-40 disabled:cursor-not-allowed ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.bordered} ${className}`}
      {...props}
    >
      {Icon && <Icon size={iconSizes[size] || 20} strokeWidth={1.75} />}
    </button>
  );
}
