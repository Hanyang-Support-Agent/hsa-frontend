import type { ReactNode } from 'react';
import { cx } from '../lib/format';

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cx('flex items-end justify-between gap-6 pb-6', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-[0.12em] text-ink-500">
            {eyebrow}
          </p>
        )}
        <h1 className="truncate text-display text-ink-900">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
