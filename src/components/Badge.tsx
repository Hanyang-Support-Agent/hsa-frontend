import type { ReactNode } from 'react';
import {
  channelMeta,
  documentStatusMeta,
  documentTypeMeta,
  inquiryTypeMeta,
  processingModeMeta,
  statusMeta,
  type VisualMeta,
} from '../lib/meta';
import type {
  Channel,
  DocumentStatus,
  DocumentType,
  InquiryStatus,
  InquiryType,
  ProcessingMode,
} from '../types/domain';
import { cx } from '../lib/format';

type Tone = 'neutral' | 'info' | 'success' | 'warn' | 'danger' | 'violet';

const toneMeta: Record<Tone, { wash: string; ink: string; dot: string }> = {
  neutral: { wash: 'bg-ink-100', ink: 'text-ink-700', dot: 'bg-ink-400' },
  info: { wash: 'bg-info-50', ink: 'text-info-700', dot: 'bg-info-500' },
  success: { wash: 'bg-brand-50', ink: 'text-brand-700', dot: 'bg-brand-500' },
  warn: { wash: 'bg-warn-50', ink: 'text-warn-700', dot: 'bg-warn-500' },
  danger: { wash: 'bg-danger-50', ink: 'text-danger-700', dot: 'bg-danger-500' },
  violet: { wash: 'bg-violet-50', ink: 'text-violet-600', dot: 'bg-violet-500' },
};

interface BasePillProps {
  label: ReactNode;
  meta?: VisualMeta;
  tone?: Tone;
  withDot?: boolean;
  size?: 'xs' | 'sm';
  className?: string;
}

export function Pill({
  label,
  meta,
  tone = 'neutral',
  withDot = true,
  size = 'sm',
  className,
}: BasePillProps) {
  const wash = meta?.wash ?? toneMeta[tone].wash;
  const ink = meta?.ink ?? toneMeta[tone].ink;
  const dot = meta?.dot ?? toneMeta[tone].dot;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border border-white/70 font-semibold tracking-tight whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]',
        size === 'xs' ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-xs',
        wash,
        ink,
        className,
      )}
    >
      {withDot && <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />}
      {label}
    </span>
  );
}

export function StatusBadge({ status, size = 'sm' }: { status: InquiryStatus; size?: 'xs' | 'sm' }) {
  const meta = statusMeta[status];
  return <Pill label={meta.label} meta={meta} size={size} />;
}

export function ChannelBadge({ channel, size = 'sm' }: { channel: Channel; size?: 'xs' | 'sm' }) {
  const meta = channelMeta[channel];
  return <Pill label={meta.label} meta={meta} size={size} />;
}

export function InquiryTypeBadge({ type, size = 'sm' }: { type: InquiryType; size?: 'xs' | 'sm' }) {
  const meta = inquiryTypeMeta[type];
  return <Pill label={meta.label} meta={meta} size={size} />;
}

export function ProcessingBadge({ mode, size = 'sm' }: { mode: ProcessingMode; size?: 'xs' | 'sm' }) {
  const meta = processingModeMeta[mode];
  return <Pill label={meta.label} meta={meta} size={size} />;
}

export function DocumentTypeBadge({ type, size = 'sm' }: { type: DocumentType; size?: 'xs' | 'sm' }) {
  const meta = documentTypeMeta[type];
  return <Pill label={meta.label} meta={meta} size={size} />;
}

export function DocumentStatusBadge({ status, size = 'sm' }: { status: DocumentStatus; size?: 'xs' | 'sm' }) {
  const meta = documentStatusMeta[status];
  return <Pill label={meta.label} meta={meta} size={size} />;
}

/** Channel signature mark — uses brand-recognizable colour blocks. */
export function ChannelMark({ channel, size = 'md' }: { channel: Channel; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-6 w-6 text-[11px]' : size === 'lg' ? 'h-10 w-10 text-base' : 'h-8 w-8 text-xs';
  if (channel === 'kakao') {
    return (
      <span className={cx('inline-flex items-center justify-center rounded-lg bg-[#FEE500] font-black text-[#181600] shadow-sm ring-1 ring-black/5', dim)}>
        K
      </span>
    );
  }
  if (channel === 'instagram') {
    return (
      <span
        className={cx(
          'inline-flex items-center justify-center rounded-lg font-black text-white shadow-sm ring-1 ring-white/40',
          dim,
        )}
        style={{
          background:
            'linear-gradient(135deg, #f58529 0%, #dd2a7b 50%, #8134af 100%)',
        }}
      >
        IG
      </span>
    );
  }
  return (
    <span className={cx('inline-flex items-center justify-center rounded-lg bg-info-100 font-black text-info-700 shadow-sm ring-1 ring-info-100', dim)}>
      @
    </span>
  );
}
