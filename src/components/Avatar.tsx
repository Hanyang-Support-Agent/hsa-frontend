import { cx, initials } from '../lib/format';

const colors = [
  'bg-brand-100 text-brand-700',
  'bg-info-100 text-info-700',
  'bg-warn-100 text-warn-700',
  'bg-violet-50 text-violet-600',
  'bg-danger-100 text-danger-700',
  'bg-ink-200 text-ink-700',
];

function pickColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length];
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dim =
    size === 'sm'
      ? 'h-7 w-7 text-[11px]'
      : size === 'lg'
        ? 'h-10 w-10 text-sm'
        : 'h-8 w-8 text-xs';
  return (
    <span
      className={cx(
        'inline-flex items-center justify-center rounded-full font-semibold tracking-tight',
        dim,
        pickColor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
