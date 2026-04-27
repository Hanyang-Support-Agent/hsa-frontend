import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cx } from '../lib/format';

interface TableProps {
  headers: Array<{ label: string; align?: 'left' | 'right' | 'center'; width?: string } | string>;
  children: ReactNode;
  className?: string;
}

export function Table({ headers, children, className }: TableProps) {
  return (
    <div className={cx('overflow-hidden', className)}>
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-sunken/70">
            {headers.map((header, idx) => {
              const cfg = typeof header === 'string' ? { label: header, align: 'left' as const } : header;
              return (
                <th
                  key={idx}
                  scope="col"
                  className={cx(
                    'px-4 py-2.5 text-micro font-semibold uppercase tracking-wider text-ink-500',
                    cfg.align === 'right' && 'text-right',
                    cfg.align === 'center' && 'text-center',
                  )}
                  style={cfg.width ? { width: cfg.width } : undefined}
                >
                  {cfg.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white/76 text-ink-800">{children}</tbody>
      </table>
    </div>
  );
}

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  clickable?: boolean;
}

export function Row({ className, selected, clickable, ...props }: RowProps) {
  return (
    <tr
      className={cx(
        'transition-colors duration-fast',
        clickable && 'cursor-pointer',
        selected ? 'bg-brand-50/80 shadow-[inset_3px_0_0_var(--color-brand-500)]' : 'hover:bg-surface-muted/80',
        className,
      )}
      {...props}
    />
  );
}

interface CellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'right' | 'center';
  mono?: boolean;
}

export function Cell({ className, align, mono, children, ...props }: CellProps) {
  return (
    <td
      className={cx(
        'px-4 py-3 align-middle text-sm',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        mono && 'font-mono text-xs tabular',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export function HeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  return (
    <th
      className={cx(
        'px-4 py-2.5 text-micro font-semibold uppercase tracking-wider text-ink-500',
        className,
      )}
      {...props}
    />
  );
}
