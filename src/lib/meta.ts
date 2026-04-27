import type {
  Channel,
  DocumentStatus,
  DocumentType,
  InquiryStatus,
  InquiryType,
  LogEventType,
  ProcessingMode,
} from '../types/domain';

/**
 * 채널·상태·유형별 시각 메타데이터.
 * 컴포넌트가 흩어진 분기 없이 한 곳에서 시그니처 컬러/아이콘을 가져오게 한다.
 */

export interface VisualMeta {
  label: string;
  /** Tailwind background color for the dot or accent. */
  dot: string;
  /** Subtle wash for badge/pill backgrounds. */
  wash: string;
  /** Contrasting text color for the wash. */
  ink: string;
  /** Solid foreground for filled badges. */
  solid?: string;
  /** Border color for outlined treatments. */
  border?: string;
}

export const channelMeta: Record<Channel, VisualMeta & { icon: 'kakao' | 'instagram' | 'email' }> = {
  kakao: {
    label: '카카오',
    icon: 'kakao',
    dot: 'bg-[#FEE500]',
    wash: 'bg-[#FEF9C2]',
    ink: 'text-[#3D2900]',
    border: 'border-[#FEE500]',
  },
  instagram: {
    label: '인스타',
    icon: 'instagram',
    dot: 'bg-[#DD2A7B]',
    wash: 'bg-violet-50',
    ink: 'text-[#7B1F4F]',
    border: 'border-[#DD2A7B]/30',
  },
  email: {
    label: '이메일',
    icon: 'email',
    dot: 'bg-info-500',
    wash: 'bg-info-50',
    ink: 'text-info-700',
    border: 'border-info-100',
  },
};

export const inquiryTypeMeta: Record<InquiryType, VisualMeta> = {
  shipping: {
    label: '배송',
    dot: 'bg-info-500',
    wash: 'bg-info-50',
    ink: 'text-info-700',
  },
  exchange_refund: {
    label: '교환/환불',
    dot: 'bg-warn-500',
    wash: 'bg-warn-50',
    ink: 'text-warn-700',
  },
  product: {
    label: '상품',
    dot: 'bg-brand-500',
    wash: 'bg-brand-50',
    ink: 'text-brand-700',
  },
  other: {
    label: '기타',
    dot: 'bg-ink-400',
    wash: 'bg-ink-100',
    ink: 'text-ink-700',
  },
};

export const statusMeta: Record<InquiryStatus, VisualMeta> = {
  received: {
    label: '접수',
    dot: 'bg-ink-400',
    wash: 'bg-ink-100',
    ink: 'text-ink-700',
  },
  classified: {
    label: '분류완료',
    dot: 'bg-info-500',
    wash: 'bg-info-50',
    ink: 'text-info-700',
  },
  auto_replied: {
    label: '자동응답',
    dot: 'bg-brand-500',
    wash: 'bg-brand-50',
    ink: 'text-brand-700',
  },
  draft_ready: {
    label: '초안완료',
    dot: 'bg-violet-500',
    wash: 'bg-violet-50',
    ink: 'text-violet-600',
  },
  review_required: {
    label: '검토필요',
    dot: 'bg-warn-500',
    wash: 'bg-warn-50',
    ink: 'text-warn-700',
  },
  saved: {
    label: '임시저장',
    dot: 'bg-ink-500',
    wash: 'bg-ink-100',
    ink: 'text-ink-700',
  },
  sent: {
    label: '발송완료',
    dot: 'bg-brand-700',
    wash: 'bg-brand-100',
    ink: 'text-brand-800',
  },
  failed: {
    label: '실패',
    dot: 'bg-danger-500',
    wash: 'bg-danger-50',
    ink: 'text-danger-700',
  },
};

export const processingModeMeta: Record<ProcessingMode, VisualMeta> = {
  auto_reply: {
    label: '자동응답',
    dot: 'bg-brand-500',
    wash: 'bg-brand-50',
    ink: 'text-brand-700',
  },
  draft_review: {
    label: '초안검토',
    dot: 'bg-violet-500',
    wash: 'bg-violet-50',
    ink: 'text-violet-600',
  },
  manual: {
    label: '수동처리',
    dot: 'bg-ink-400',
    wash: 'bg-ink-100',
    ink: 'text-ink-700',
  },
};

export const documentTypeMeta: Record<DocumentType, VisualMeta> = {
  refund_policy: {
    label: '교환/환불 정책',
    dot: 'bg-warn-500',
    wash: 'bg-warn-50',
    ink: 'text-warn-700',
  },
  shipping_policy: {
    label: '배송 정책',
    dot: 'bg-info-500',
    wash: 'bg-info-50',
    ink: 'text-info-700',
  },
  faq: {
    label: 'FAQ',
    dot: 'bg-ink-400',
    wash: 'bg-ink-100',
    ink: 'text-ink-700',
  },
  product_info: {
    label: '상품 정보',
    dot: 'bg-brand-500',
    wash: 'bg-brand-50',
    ink: 'text-brand-700',
  },
};

export const documentStatusMeta: Record<DocumentStatus, VisualMeta> = {
  active: {
    label: '활성',
    dot: 'bg-brand-500',
    wash: 'bg-brand-50',
    ink: 'text-brand-700',
  },
  processing: {
    label: '처리중',
    dot: 'bg-warn-500',
    wash: 'bg-warn-50',
    ink: 'text-warn-700',
  },
  archived: {
    label: '보관',
    dot: 'bg-ink-400',
    wash: 'bg-ink-100',
    ink: 'text-ink-700',
  },
};

export const logEventMeta: Record<LogEventType, { label: string; tone: 'neutral' | 'info' | 'success' | 'warn' | 'danger' | 'violet' }> = {
  inquiry_received: { label: '문의 접수', tone: 'neutral' },
  classified: { label: '분류 완료', tone: 'info' },
  auto_replied: { label: '자동응답 발송', tone: 'success' },
  draft_generated: { label: '초안 생성', tone: 'violet' },
  draft_saved: { label: '초안 저장', tone: 'neutral' },
  review_required: { label: '검토 필요 표시', tone: 'warn' },
  response_sent: { label: '응답 발송', tone: 'success' },
  document_uploaded: { label: '문서 업로드', tone: 'info' },
  document_deleted: { label: '문서 삭제', tone: 'danger' },
};
