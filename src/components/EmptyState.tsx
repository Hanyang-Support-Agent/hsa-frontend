import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cx } from '../lib/format';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Compact variant (no big illustration) */
  compact?: boolean;
}

export function EmptyState({ title, description, icon, action, className, compact }: EmptyStateProps) {
  if (compact) {
    return (
      <div
        className={cx(
          'flex flex-col items-center justify-center rounded-lg bg-surface-muted/60 px-6 py-10 text-center',
          className,
        )}
      >
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-400 ring-1 ring-line">
          {icon ?? <Inbox className="h-4 w-4" />}
        </div>
        <p className="text-sm font-semibold text-ink-800">{title}</p>
        {description && <p className="mt-1 text-xs text-ink-500">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface-muted/40 px-8 py-14 text-center',
        className,
      )}
    >
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-brand-50 blur-md opacity-60" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface text-ink-400 shadow-sm">
          {icon ?? <Inbox className="h-6 w-6" />}
        </div>
      </div>
      <p className="text-h3 text-ink-900">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
