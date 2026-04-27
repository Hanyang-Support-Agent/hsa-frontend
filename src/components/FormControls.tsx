import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cx } from '../lib/format';

function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cx('mb-2 block text-sm font-semibold text-ink-700', className)} {...props} />;
}

interface FieldProps {
  label?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="mt-2 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        'h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-500 focus:shadow-focus',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        'h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm font-medium text-ink-700 outline-none transition focus:border-brand-500 focus:shadow-focus',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        'min-h-36 w-full resize-y rounded-lg border border-ink-200 bg-white p-3 text-sm leading-6 text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-500 focus:shadow-focus',
        className,
      )}
      {...props}
    />
  );
}
