import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/format';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-ink-900 to-shell-elev text-white shadow-sm hover:from-ink-800 hover:to-shell-elev active:bg-black focus-visible:shadow-focus border border-ink-900',
  secondary:
    'bg-white/88 text-ink-800 border border-line shadow-xs backdrop-blur hover:bg-white hover:border-line-strong active:bg-ink-100 focus-visible:shadow-focus',
  subtle:
    'bg-surface-muted text-ink-700 border border-transparent hover:bg-ink-100 active:bg-ink-200 focus-visible:shadow-focus',
  ghost:
    'bg-transparent text-ink-600 border border-transparent hover:bg-surface-muted hover:text-ink-900 active:bg-ink-100 focus-visible:shadow-focus',
  danger:
    'bg-danger-600 text-white border border-danger-600 shadow-xs hover:bg-danger-700 active:bg-danger-700 focus-visible:shadow-focus-danger',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-sm',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-md',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center font-medium tracking-tight whitespace-nowrap',
        'transition-[background-color,border-color,box-shadow,transform] duration-fast ease-out',
        'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex h-3.5 w-3.5 items-center justify-center">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
        </span>
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  );
}
