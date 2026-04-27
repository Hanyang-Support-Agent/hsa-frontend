import type { ReactNode } from 'react';

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50 p-8 text-center">
      <p className="text-base font-bold text-ink-900">{title}</p>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
