import { forwardRef } from 'react';
import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '../lib/format';

function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cx('mb-1.5 block text-xs font-semibold tracking-tight text-ink-700', className)}
      {...props}
    />
  );
}

interface FieldProps {
  label?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  required?: boolean;
}

export function Field({ label, hint, error, children, className, required }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <Label>
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

const baseInput =
  'w-full rounded-md border border-line bg-surface text-ink-900 outline-none transition placeholder:text-ink-400 hover:border-line-strong focus:border-brand-500 focus:shadow-focus disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-400';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cx(baseInput, 'h-9 px-3 text-sm', className)}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cx(
          baseInput,
          'h-9 appearance-none pl-3 pr-9 text-sm font-medium text-ink-800',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    </div>
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        baseInput,
        'min-h-32 resize-y px-3 py-2.5 text-sm leading-6',
        className,
      )}
      {...props}
    />
  );
}

/** Compact filter control — chip-style trigger */
export function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition',
        active
          ? 'border-ink-900 bg-ink-900 text-white shadow-xs'
          : 'border-line bg-surface text-ink-600 hover:border-line-strong hover:text-ink-900',
      )}
    >
      {children}
    </button>
  );
}
