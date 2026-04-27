import {
  channelLabels,
  inquiryStatusLabels,
  inquiryTypeLabels,
  processingModeLabels,
  type Channel,
  type InquiryStatus,
  type InquiryType,
  type ProcessingMode,
} from '../types/domain';
import { cx } from '../lib/format';

type BadgeTone = 'gray' | 'green' | 'blue' | 'amber' | 'red' | 'purple';

const toneClasses: Record<BadgeTone, string> = {
  gray: 'bg-ink-100 text-ink-700',
  green: 'bg-brand-50 text-brand-700',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-violet-50 text-violet-700',
};

const statusTone: Record<InquiryStatus, BadgeTone> = {
  received: 'gray',
  classified: 'blue',
  auto_replied: 'green',
  draft_ready: 'blue',
  review_required: 'amber',
  saved: 'purple',
  sent: 'green',
  failed: 'red',
};

const channelTone: Record<Channel, BadgeTone> = {
  kakao: 'green',
  instagram: 'purple',
  email: 'blue',
};

const typeTone: Record<InquiryType, BadgeTone> = {
  shipping: 'blue',
  exchange_refund: 'amber',
  product: 'green',
  other: 'gray',
};

export function Badge({ label, tone = 'gray' }: { label: string; tone?: BadgeTone }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold', toneClasses[tone])}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: InquiryStatus }) {
  return <Badge label={inquiryStatusLabels[status]} tone={statusTone[status]} />;
}

export function ChannelBadge({ channel }: { channel: Channel }) {
  return <Badge label={channelLabels[channel]} tone={channelTone[channel]} />;
}

export function InquiryTypeBadge({ type }: { type: InquiryType }) {
  return <Badge label={inquiryTypeLabels[type]} tone={typeTone[type]} />;
}

export function ProcessingBadge({ mode }: { mode: ProcessingMode }) {
  return <Badge label={processingModeLabels[mode]} tone={mode === 'auto_reply' ? 'green' : mode === 'draft_review' ? 'amber' : 'gray'} />;
}
