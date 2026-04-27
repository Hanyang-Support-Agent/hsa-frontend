import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/format';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:shadow-focus',
  secondary: 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50 focus:shadow-focus',
  ghost: 'text-ink-500 hover:bg-ink-100 hover:text-ink-900 focus:shadow-focus',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:shadow-focus',
};

export function Button({ className, variant = 'primary', size = 'md', icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-sm',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
