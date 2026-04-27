import type { ReactNode } from 'react';
import { cx } from '../lib/format';

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Removes default padding around children. Useful for tables. */
  flush?: boolean;
  /** Variant: surface (default), sunken, or dark signal panel */
  tone?: 'surface' | 'sunken' | 'dark';
}

export function Card({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  flush,
  tone = 'surface',
}: CardProps) {
  const hasHeader = title || description || action;
  return (
    <section
      className={cx(
        'rounded-xl border shadow-xs',
        tone === 'surface' && 'border-white/70 bg-white/86 backdrop-blur-xl ring-1 ring-line/60',
        tone === 'sunken' && 'border-line bg-surface-muted',
        tone === 'dark' && 'border-shell-line bg-shell text-shell-text shadow-lg',
        className,
      )}
    >
      {hasHeader && (
        <header
          className={cx(
            'flex items-start justify-between gap-4 border-b px-5 py-4',
            tone === 'dark' ? 'border-shell-line' : 'border-line',
          )}
        >
          <div className="min-w-0">
            {title && <h2 className={cx('text-h3', tone === 'dark' ? 'text-white' : 'text-ink-900')}>{title}</h2>}
            {description && <p className={cx('mt-1 text-sm', tone === 'dark' ? 'text-shell-muted' : 'text-ink-500')}>{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cx(flush ? '' : 'px-5 py-5', bodyClassName)}>{children}</div>
    </section>
  );
}
