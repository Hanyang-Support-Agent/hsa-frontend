import type {
  Channel,
  DocumentType,
  Inquiry,
  InquiryListFilters,
  InquiryStatus,
  InquiryType,
  KnowledgeDocument,
  LogEvent,
  LogEventType,
  ProcessingMode,
  Session,
} from '../types/domain';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
const DEFAULT_ADMIN_ID = Number(import.meta.env.VITE_ADMIN_ID ?? 1);
const DEFAULT_CHANNEL_ID = Number(import.meta.env.VITE_CHANNEL_ID ?? 1);
const DEFAULT_TEST_CUSTOMER_ID = Number(import.meta.env.VITE_TEST_CUSTOMER_ID ?? 1);

interface ApiEnvelope<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}

interface PageResponse<T> {
  content: T[];
}

type BackendChannelType = 'KAKAO' | 'WEB' | 'MAIL';
type BackendInquiryStatus = 'RECEIVED' | 'FIRST_CREATED' | 'ADMIN_REVIEW_REQUIRED' | 'AUTO_REPLIED' | 'SENT' | 'FAILED';
type BackendInquiryCategory = 'DELIVERY' | 'EXCHANGE_REFUND' | 'PRODUCT' | 'OTHER';
type BackendResponseStatus = 'DRAFTED' | 'MODIFIED' | 'READY_TO_SEND' | 'SENDING' | 'SENT' | 'SEND_FAILED' | 'CANCELLED';

interface BackendInquiryListItem {
  inquiryId: number;
  customerId: number;
  content: string;
  channelType: BackendChannelType;
  status: BackendInquiryStatus;
  createdTime: string;
}

interface BackendInquiryDetail extends BackendInquiryListItem {
  result: null | {
    category: BackendInquiryCategory;
    autoReply: boolean;
    adminReview: boolean;
    reason: string | null;
    riskTags: string | null;
    usedSources: string | null;
  };
  response: null | {
    responseId: number;
    draftContent: string | null;
    finalContent: string | null;
    status: BackendResponseStatus;
  };
}

interface BackendInquiryCreateResponse {
  inquiryId: number;
  customerId: number;
  content: string;
  status: BackendInquiryStatus;
  createdTime: string;
}

interface BackendProcessingLog {
  logId?: number;
  id?: number;
  inquiryId?: number;
  eventType?: string;
  message?: string;
  createdTime?: string;
  createdAt?: string;
  currentState?: string;
  detail?: string;
}

interface BackendResponseResponse {
  id: number;
  inquiryId: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const envelope = await request<ApiEnvelope<T>>(path, init);
  if (!envelope.isSuccess) {
    throw new Error(`${envelope.code}: ${envelope.message}`);
  }
  return envelope.result;
}

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function frontendChannelToBackend(channel?: Channel | 'all'): BackendChannelType | undefined {
  if (!channel || channel === 'all') return undefined;
  if (channel === 'kakao') return 'KAKAO';
  if (channel === 'email') return 'MAIL';
  return 'WEB';
}

function backendChannelToFrontend(channel: BackendChannelType): Channel {
  if (channel === 'KAKAO') return 'kakao';
  if (channel === 'MAIL') return 'email';
  return 'instagram';
}

function frontendStatusToBackend(status?: InquiryStatus | 'all'): BackendInquiryStatus | undefined {
  if (!status || status === 'all') return undefined;
  const statusMap: Partial<Record<InquiryStatus, BackendInquiryStatus>> = {
    received: 'RECEIVED',
    classified: 'FIRST_CREATED',
    draft_ready: 'FIRST_CREATED',
    review_required: 'ADMIN_REVIEW_REQUIRED',
    auto_replied: 'AUTO_REPLIED',
    sent: 'SENT',
    failed: 'FAILED',
  };
  return statusMap[status];
}

function backendStatusToFrontend(status: BackendInquiryStatus, responseStatus?: BackendResponseStatus): InquiryStatus {
  if (responseStatus === 'MODIFIED' || responseStatus === 'READY_TO_SEND') return 'saved';
  if (responseStatus === 'SENT') return 'sent';
  if (responseStatus === 'SEND_FAILED') return 'failed';

  const statusMap: Record<BackendInquiryStatus, InquiryStatus> = {
    RECEIVED: 'received',
    FIRST_CREATED: 'draft_ready',
    ADMIN_REVIEW_REQUIRED: 'review_required',
    AUTO_REPLIED: 'auto_replied',
    SENT: 'sent',
    FAILED: 'failed',
  };
  return statusMap[status];
}

function backendCategoryToFrontend(category?: BackendInquiryCategory | null): InquiryType {
  if (category === 'DELIVERY') return 'shipping';
  if (category === 'EXCHANGE_REFUND') return 'exchange_refund';
  if (category === 'PRODUCT') return 'product';
  return 'other';
}

function processingModeFor(status: InquiryStatus, result?: BackendInquiryDetail['result']): ProcessingMode {
  if (result?.autoReply || status === 'auto_replied') return 'auto_reply';
  if (result?.adminReview || status === 'review_required') return 'manual';
  return 'draft_review';
}

function parseSources(usedSources?: string | null) {
  if (!usedSources) return [];
  return usedSources
    .split(/[,\n]/)
    .map((source) => source.trim())
    .filter(Boolean)
    .map((title, index) => ({
      id: `SRC-${index + 1}`,
      title,
      type: 'faq' as DocumentType,
      excerpt: title,
    }));
}

function toInquiryFromList(item: BackendInquiryListItem): Inquiry {
  const status = backendStatusToFrontend(item.status);
  return {
    id: String(item.inquiryId),
    channel: backendChannelToFrontend(item.channelType),
    customer: { name: `고객 #${item.customerId}` },
    type: 'other',
    status,
    processingMode: processingModeFor(status),
    summary: item.content.slice(0, 60),
    body: item.content,
    receivedAt: item.createdTime,
    confidenceScore: 0,
  };
}

function toInquiryFromDetail(item: BackendInquiryDetail): Inquiry {
  const status = backendStatusToFrontend(item.status, item.response?.status);
  const type = backendCategoryToFrontend(item.result?.category);
  const draftText = item.response?.draftContent ?? item.result?.reason ?? undefined;
  const finalText = item.response?.finalContent ?? undefined;

  return {
    id: String(item.inquiryId),
    channel: backendChannelToFrontend(item.channelType),
    customer: { name: `고객 #${item.customerId}` },
    type,
    status,
    processingMode: processingModeFor(status, item.result),
    summary: item.content.slice(0, 60),
    body: item.content,
    receivedAt: item.createdTime,
    confidenceScore: item.result ? 0.9 : 0,
    autoReplyText: item.result?.autoReply ? (finalText ?? draftText) : undefined,
    draft: draftText || finalText
      ? {
          id: item.response?.responseId ? String(item.response.responseId) : `DRF-${item.inquiryId}`,
          inquiryId: String(item.inquiryId),
          draftText: draftText ?? finalText ?? '',
          finalText,
          sources: parseSources(item.result?.usedSources),
          createdAt: item.createdTime,
        }
      : undefined,
  };
}

function toLogEvent(log: BackendProcessingLog, fallbackInquiryId?: string): LogEvent {
  return {
    id: String(log.logId ?? log.id ?? `${fallbackInquiryId ?? 'LOG'}-${log.createdTime ?? log.createdAt ?? Date.now()}`),
    inquiryId: log.inquiryId ? String(log.inquiryId) : fallbackInquiryId,
    eventType: toLogEventType(log.eventType),
    message: log.message ?? log.detail ?? log.currentState ?? log.eventType ?? '처리 로그',
    createdAt: log.createdTime ?? log.createdAt ?? new Date().toISOString(),
  };
}

function toLogEventType(eventType?: string): LogEventType {
  const normalized = eventType?.toLowerCase();
  if (normalized?.includes('sent')) return 'response_sent';
  if (normalized?.includes('modify') || normalized?.includes('admin')) return 'draft_saved';
  if (normalized?.includes('confirm')) return 'draft_saved';
  if (normalized?.includes('review')) return 'review_required';
  if (normalized?.includes('auto')) return 'auto_replied';
  if (normalized?.includes('draft') || normalized?.includes('response')) return 'draft_generated';
  if (normalized?.includes('class')) return 'classified';
  return 'inquiry_received';
}

async function getBackendInquiry(id: string) {
  return backendRequest<BackendInquiryDetail>(`/api/admin/inquiries/${id}`);
}

async function getBackendResponseId(inquiryId: string) {
  const inquiry = await getBackendInquiry(inquiryId);
  if (!inquiry.response?.responseId) {
    throw new Error('이 문의에는 아직 백엔드 응답 초안 ID가 없습니다. 먼저 AI 처리를 완료해야 합니다.');
  }
  return inquiry.response.responseId;
}

async function saveBackendDraft(id: string, finalText: string) {
  const responseId = await getBackendResponseId(id);
  const response = await backendRequest<BackendResponseResponse>(`/api/admin/responses/${responseId}`, {
    method: 'PATCH',
    body: JSON.stringify({ adminId: DEFAULT_ADMIN_ID, finalContent: finalText }),
  });
  return toInquiryFromDetail(await getBackendInquiry(String(response.inquiryId)));
}

async function sendBackendResponse(id: string, finalText: string) {
  const responseId = await getBackendResponseId(id);
  await backendRequest<BackendResponseResponse>(`/api/admin/responses/${responseId}`, {
    method: 'PATCH',
    body: JSON.stringify({ adminId: DEFAULT_ADMIN_ID, finalContent: finalText }),
  });
  await backendRequest<BackendResponseResponse>(`/api/admin/responses/${responseId}/confirm`, {
    method: 'PATCH',
    body: JSON.stringify({ adminId: DEFAULT_ADMIN_ID }),
  });
  await backendRequest(`/api/admin/responses/${responseId}/send`, {
    method: 'POST',
    body: JSON.stringify({ channelId: DEFAULT_CHANNEL_ID, recipientIdentifier: `inquiry-${id}` }),
  });
  return toInquiryFromDetail(await getBackendInquiry(id));
}

async function createTestInquiry(payload: {
  channel: Channel;
  customerName: string;
  contact?: string;
  message: string;
  orderId?: string;
}) {
  const created = await backendRequest<BackendInquiryCreateResponse>('/api/inquiries', {
    method: 'POST',
    body: JSON.stringify({
      customerId: DEFAULT_TEST_CUSTOMER_ID,
      content: payload.message,
      channelType: frontendChannelToBackend(payload.channel),
    }),
  });

  await backendRequest(`/api/inquiries/${created.inquiryId}/ai-processing`, { method: 'POST' });
  return toInquiryFromDetail(await getBackendInquiry(String(created.inquiryId)));
}

const localSession: Session = {
  isAuthenticated: true,
  admin: { name: 'HSA 관리자', role: 'admin' },
};

async function unavailableDocumentUpload(_payload: { title: string; type: DocumentType; fileName: string }): Promise<never> {
  void _payload;
  throw new Error('백엔드 문서 관리 API 계약이 아직 없습니다. 문서 관리는 백엔드 API 확정 후 연결하세요.');
}

async function unavailableDocumentDelete(_id: string): Promise<never> {
  void _id;
  throw new Error('백엔드 문서 관리 API 계약이 아직 없습니다. 문서 관리는 백엔드 API 확정 후 연결하세요.');
}

export const api = {
  getSession: async () => localSession,
  login: async () => localSession,
  logout: async (): Promise<Session> => ({ isAuthenticated: false }),
  listInquiries: async (filters: InquiryListFilters = {}) => {
    const page = await backendRequest<PageResponse<BackendInquiryListItem>>(
      withQuery('/api/admin/inquiries', {
        channelType: frontendChannelToBackend(filters.channel),
        status: frontendStatusToBackend(filters.status),
        page: 0,
        size: 100,
      }),
    );
    const inquiries = page.content.map(toInquiryFromList);
    const query = filters.query?.trim().toLowerCase();
    const type = filters.type && filters.type !== 'all' ? filters.type : undefined;

    return inquiries.filter((inquiry) => {
      if (type && inquiry.type !== type) return false;
      if (!query) return true;
      return [inquiry.id, inquiry.customer.name, inquiry.summary, inquiry.body]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  },
  getInquiry: async (id: string) => toInquiryFromDetail(await getBackendInquiry(id)),
  saveDraft: saveBackendDraft,
  sendResponse: sendBackendResponse,
  markReviewRequired: async (id: string) => toInquiryFromDetail(await getBackendInquiry(id)),
  listLogs: async (query?: string) => {
    const page = await backendRequest<PageResponse<BackendInquiryListItem>>('/api/admin/inquiries?page=0&size=20');
    const logsByInquiry = await Promise.all(
      page.content.map(async (inquiry) => {
        try {
          const logs = await backendRequest<BackendProcessingLog[]>(`/api/admin/inquiries/${inquiry.inquiryId}/logs`);
          return logs.map((log) => toLogEvent(log, String(inquiry.inquiryId)));
        } catch {
          return [];
        }
      }),
    );
    const logs = logsByInquiry.flat().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const normalizedQuery = query?.trim().toLowerCase();
    if (!normalizedQuery) return logs;
    return logs.filter((log) => [log.id, log.inquiryId, log.message].filter(Boolean).some((value) => value!.toLowerCase().includes(normalizedQuery)));
  },
  listDocuments: async (): Promise<KnowledgeDocument[]> => [],
  uploadDocument: unavailableDocumentUpload,
  deleteDocument: unavailableDocumentDelete,
  createDevInquiry: createTestInquiry,
};
