export type Channel = 'kakao' | 'instagram' | 'email';
export type InquiryType = 'shipping' | 'exchange_refund' | 'product' | 'other';
export type ProcessingMode = 'auto_reply' | 'draft_review' | 'manual';
export type InquiryStatus =
  | 'received'
  | 'classified'
  | 'auto_replied'
  | 'draft_ready'
  | 'review_required'
  | 'saved'
  | 'sent'
  | 'failed';

export type DocumentType = 'refund_policy' | 'shipping_policy' | 'faq' | 'product_info';
export type DocumentStatus = 'active' | 'processing' | 'archived';
export type LogEventType =
  | 'inquiry_received'
  | 'classified'
  | 'auto_replied'
  | 'draft_generated'
  | 'draft_saved'
  | 'response_sent'
  | 'document_uploaded'
  | 'document_deleted';

export interface Customer {
  name: string;
  email?: string;
  handle?: string;
}

export interface SourceDocument {
  id: string;
  title: string;
  type: DocumentType;
  excerpt: string;
}

export interface ResponseDraft {
  id: string;
  inquiryId: string;
  draftText: string;
  finalText?: string;
  sources: SourceDocument[];
  createdAt: string;
  updatedAt?: string;
}

export interface Inquiry {
  id: string;
  channel: Channel;
  customer: Customer;
  type: InquiryType;
  status: InquiryStatus;
  processingMode: ProcessingMode;
  summary: string;
  body: string;
  receivedAt: string;
  orderId?: string;
  autoReplyText?: string;
  draft?: ResponseDraft;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  type: DocumentType;
  uploadedAt: string;
  status: DocumentStatus;
  fileName: string;
  fileSize: string;
}

export interface LogEvent {
  id: string;
  inquiryId?: string;
  eventType: LogEventType;
  channel?: Channel;
  inquiryType?: InquiryType;
  processingMode?: ProcessingMode;
  previousStatus?: InquiryStatus;
  nextStatus?: InquiryStatus;
  message: string;
  createdAt: string;
}

export interface Session {
  isAuthenticated: boolean;
  admin?: {
    name: string;
    role: 'admin' | 'operator';
  };
}

export interface InquiryListFilters {
  channel?: Channel | 'all';
  type?: InquiryType | 'all';
  status?: InquiryStatus | 'all';
  query?: string;
}

export const channelLabels: Record<Channel, string> = {
  kakao: '카카오',
  instagram: '인스타',
  email: '이메일',
};

export const inquiryTypeLabels: Record<InquiryType, string> = {
  shipping: '배송',
  exchange_refund: '교환/환불',
  product: '상품',
  other: '기타',
};

export const processingModeLabels: Record<ProcessingMode, string> = {
  auto_reply: '자동응답',
  draft_review: '초안검토',
  manual: '수동처리',
};

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  received: '접수',
  classified: '분류완료',
  auto_replied: '자동응답',
  draft_ready: '초안완료',
  review_required: '승인필요',
  saved: '임시저장',
  sent: '발송완료',
  failed: '실패',
};

export const documentTypeLabels: Record<DocumentType, string> = {
  refund_policy: '교환/환불 정책',
  shipping_policy: '배송 정책',
  faq: 'FAQ',
  product_info: '상품 정보',
};
