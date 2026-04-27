import type {
  Channel,
  DocumentType,
  Inquiry,
  InquiryListFilters,
  KnowledgeDocument,
  LogEvent,
  Session,
} from '../types/domain';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
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

function withQuery(path: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export const api = {
  getSession: () => request<Session>('/api/auth/session'),
  login: () => request<Session>('/api/auth/login', { method: 'POST' }),
  logout: () => request<Session>('/api/auth/logout', { method: 'POST' }),
  listInquiries: (filters: InquiryListFilters = {}) =>
    request<Inquiry[]>(
      withQuery('/api/inquiries', {
        channel: filters.channel,
        type: filters.type,
        status: filters.status,
        query: filters.query,
      }),
    ),
  getInquiry: (id: string) => request<Inquiry>(`/api/inquiries/${id}`),
  saveDraft: (id: string, finalText: string) =>
    request<Inquiry>(`/api/inquiries/${id}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({ finalText }),
    }),
  sendResponse: (id: string, finalText: string) =>
    request<Inquiry>(`/api/inquiries/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({ finalText }),
    }),
  markReviewRequired: (id: string) =>
    request<Inquiry>(`/api/inquiries/${id}/review-required`, {
      method: 'POST',
    }),
  listLogs: (query?: string) => request<LogEvent[]>(withQuery('/api/logs', { query })),
  listDocuments: () => request<KnowledgeDocument[]>('/api/documents'),
  uploadDocument: (payload: { title: string; type: DocumentType; fileName: string }) =>
    request<KnowledgeDocument>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteDocument: (id: string) => request<void>(`/api/documents/${id}`, { method: 'DELETE' }),
  createDevInquiry: (payload: {
    channel: Channel;
    customerName: string;
    contact?: string;
    message: string;
    orderId?: string;
  }) =>
    request<Inquiry>('/api/dev/intake', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
