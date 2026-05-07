import type { ReactNode } from 'react';
import { cx } from '../lib/format';

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cx(
        'inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-line bg-surface px-2 font-mono text-xs font-medium text-ink-600 shadow-xs',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
