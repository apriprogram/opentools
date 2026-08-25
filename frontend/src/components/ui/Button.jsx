import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  pill = false,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  // Size classes
  const sizeStyles = {
    sm: 'h-[32px] px-[14px] text-[12px] font-medium leading-[16px]',
    md: 'h-[40px] px-[18px] text-[14px] font-medium leading-[20px]',
    lg: 'h-[44px] px-[22px] text-[14px] font-medium leading-[20px]',
  };

  // Radius classes
  const radiusStyle = pill ? 'rounded-full' : 'rounded-md';

  // Variant classes
  const variantStyles = {
    primary:
      'bg-accent-black dark:bg-white text-white dark:text-black hover:bg-accent-black-hover dark:hover:bg-zinc-200 active:scale-[0.98] disabled:bg-[#D4D4D8] dark:disabled:bg-zinc-800 disabled:text-white/80 dark:disabled:text-black/80 disabled:cursor-not-allowed disabled:active:scale-100',
    secondary:
      'bg-card dark:bg-[#18181b] border border-border text-primary hover:border-border-hover hover:bg-card-muted active:bg-[#ECECED] dark:active:bg-zinc-800 disabled:text-tertiary disabled:border-border disabled:cursor-not-allowed',
    ghost:
      'bg-transparent text-primary hover:bg-card-muted active:bg-[#ECECED] disabled:text-tertiary disabled:cursor-not-allowed',
    danger:
      'bg-danger text-white hover:bg-[#B91C1C] active:scale-[0.98] disabled:bg-[#FCA5A5] disabled:cursor-not-allowed',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-sans select-none transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-black focus-visible:ring-offset-2 ${sizeStyles[size] || sizeStyles.md} ${radiusStyle} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={1.75} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={1.75} />}
    </button>
  );
}
