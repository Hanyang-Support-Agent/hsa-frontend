import type { ReactNode } from 'react';
import { cx } from '../lib/format';

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cx(
        'inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-line bg-surface px-1.5 font-mono text-[10px] font-medium text-ink-600 shadow-xs',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
