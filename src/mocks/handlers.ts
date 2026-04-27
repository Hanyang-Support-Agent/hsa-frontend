import { http, HttpResponse } from 'msw';
import { documents as initialDocuments, inquiries as initialInquiries, logs as initialLogs, sourceDocuments } from './data';
import type {
  Channel,
  DocumentType,
  Inquiry,
  InquiryStatus,
  InquiryType,
  KnowledgeDocument,
  LogEvent,
  Session,
} from '../types/domain';

let session: Session = { isAuthenticated: false };
let inquiries: Inquiry[] = structuredClone(initialInquiries);
let documents: KnowledgeDocument[] = structuredClone(initialDocuments);
let logs: LogEvent[] = structuredClone(initialLogs);

const now = () => new Date().toISOString();

function nextId(prefix: string, length: number) {
  return `${prefix}-${String(length + 1).padStart(3, '0')}`;
}

function appendLog(log: Omit<LogEvent, 'id' | 'createdAt'>) {
  logs = [
    {
      id: nextId('LOG', logs.length),
      createdAt: now(),
      ...log,
    },
    ...logs,
  ];
}

function inferType(body: string): InquiryType {
  const text = body.toLowerCase();
  if (text.includes('배송') || text.includes('송장') || text.includes('도착')) return 'shipping';
  if (text.includes('환불') || text.includes('교환') || text.includes('반품')) return 'exchange_refund';
  if (text.includes('원단') || text.includes('사이즈') || text.includes('색상') || text.includes('세탁')) return 'product';
  return 'other';
}

function confidenceFor(type: InquiryType, body: string) {
  const lengthBonus = Math.min(body.length / 300, 0.08);
  const base: Record<InquiryType, number> = {
    shipping: 0.91,
    exchange_refund: 0.88,
    product: 0.86,
    other: 0.62,
  };
  return Number(Math.min(base[type] + lengthBonus, 0.97).toFixed(2));
}

function createDraft(inquiry: Inquiry) {
  if (inquiry.type === 'shipping' && inquiry.orderId) {
    return undefined;
  }

  const source =
    inquiry.type === 'exchange_refund'
      ? sourceDocuments[0]
      : inquiry.type === 'shipping'
        ? sourceDocuments[1]
        : inquiry.type === 'product'
          ? sourceDocuments[2]
          : sourceDocuments[1];

  return {
    id: nextId('DRF', inquiries.length),
    inquiryId: inquiry.id,
    draftText:
      inquiry.type === 'other'
        ? '안녕하세요, 고객님. 문의 내용을 확인했습니다. 정확한 안내를 위해 담당자가 확인 후 답변드리겠습니다.'
        : `안녕하세요, 고객님. 문의 주신 내용은 ${source.title} 기준으로 확인이 필요합니다. 관련 정책을 검토한 뒤 아래 안내를 전달드립니다.`,
    sources: [source],
    createdAt: now(),
  };
}

export const handlers = [
  http.get('/api/auth/session', () => HttpResponse.json(session)),
  http.post('/api/auth/login', async () => {
    session = {
      isAuthenticated: true,
      admin: {
        name: 'HSA 관리자',
        role: 'admin',
      },
    };
    return HttpResponse.json(session);
  }),
  http.post('/api/auth/logout', () => {
    session = { isAuthenticated: false };
    return HttpResponse.json(session);
  }),
  http.get('/api/inquiries', ({ request }) => {
    const url = new URL(request.url);
    const channel = url.searchParams.get('channel');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const query = url.searchParams.get('query')?.trim().toLowerCase();

    const result = inquiries.filter((inquiry) => {
      if (channel && channel !== 'all' && inquiry.channel !== channel) return false;
      if (type && type !== 'all' && inquiry.type !== type) return false;
      if (status && status !== 'all' && inquiry.status !== status) return false;
      if (!query) return true;
      return [inquiry.id, inquiry.customer.name, inquiry.customer.email, inquiry.customer.handle, inquiry.summary, inquiry.body]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });

    return HttpResponse.json(result);
  }),
  http.get('/api/inquiries/:id', ({ params }) => {
    const inquiry = inquiries.find((item) => item.id === params.id);
    if (!inquiry) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(inquiry);
  }),
  http.patch('/api/inquiries/:id/draft', async ({ params, request }) => {
    const body = (await request.json()) as { finalText: string };
    const inquiry = inquiries.find((item) => item.id === params.id);
    if (!inquiry) return new HttpResponse(null, { status: 404 });

    const previousStatus = inquiry.status;
    inquiry.status = 'saved';
    inquiry.draft = {
      id: inquiry.draft?.id ?? nextId('DRF', inquiries.length),
      inquiryId: inquiry.id,
      draftText: inquiry.draft?.draftText ?? body.finalText,
      finalText: body.finalText,
      sources: inquiry.draft?.sources ?? [],
      createdAt: inquiry.draft?.createdAt ?? now(),
      updatedAt: now(),
    };

    appendLog({
      inquiryId: inquiry.id,
      eventType: 'draft_saved',
      channel: inquiry.channel,
      inquiryType: inquiry.type,
      processingMode: inquiry.processingMode,
      previousStatus,
      nextStatus: 'saved',
      message: '관리자가 답변 초안을 임시저장했습니다.',
    });

    return HttpResponse.json(inquiry);
  }),
  http.post('/api/inquiries/:id/send', async ({ params, request }) => {
    const body = (await request.json()) as { finalText: string };
    const inquiry = inquiries.find((item) => item.id === params.id);
    if (!inquiry) return new HttpResponse(null, { status: 404 });

    const previousStatus = inquiry.status;
    inquiry.status = 'sent';
    inquiry.draft = {
      id: inquiry.draft?.id ?? nextId('DRF', inquiries.length),
      inquiryId: inquiry.id,
      draftText: inquiry.draft?.draftText ?? body.finalText,
      finalText: body.finalText,
      sources: inquiry.draft?.sources ?? [],
      createdAt: inquiry.draft?.createdAt ?? now(),
      updatedAt: now(),
    };

    appendLog({
      inquiryId: inquiry.id,
      eventType: 'response_sent',
      channel: inquiry.channel,
      inquiryType: inquiry.type,
      processingMode: inquiry.processingMode,
      previousStatus,
      nextStatus: 'sent',
      message: '관리자가 최종 답변을 발송했습니다.',
    });

    return HttpResponse.json(inquiry);
  }),
  http.post('/api/inquiries/:id/review-required', ({ params }) => {
    const inquiry = inquiries.find((item) => item.id === params.id);
    if (!inquiry) return new HttpResponse(null, { status: 404 });

    const previousStatus = inquiry.status;
    inquiry.status = 'review_required';

    appendLog({
      inquiryId: inquiry.id,
      eventType: 'review_required',
      channel: inquiry.channel,
      inquiryType: inquiry.type,
      processingMode: inquiry.processingMode,
      previousStatus,
      nextStatus: 'review_required',
      message: '관리자가 해당 문의를 검토 필요 상태로 표시했습니다.',
    });

    return HttpResponse.json(inquiry);
  }),
  http.get('/api/logs', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query')?.trim().toLowerCase();
    const result = query
      ? logs.filter((log) => [log.id, log.inquiryId, log.message].filter(Boolean).some((value) => value!.toLowerCase().includes(query)))
      : logs;
    return HttpResponse.json(result);
  }),
  http.get('/api/documents', () => HttpResponse.json(documents)),
  http.post('/api/documents', async ({ request }) => {
    const body = (await request.json()) as { title: string; type: DocumentType; fileName: string };
    const document: KnowledgeDocument = {
      id: nextId('DOC', documents.length),
      title: body.title,
      type: body.type,
      uploadedAt: now(),
      status: 'processing',
      fileName: body.fileName,
      fileSize: 'mock',
    };
    documents = [document, ...documents];
    appendLog({
      eventType: 'document_uploaded',
      message: `${body.title} 문서를 등록했습니다.`,
    });
    return HttpResponse.json(document, { status: 201 });
  }),
  http.delete('/api/documents/:id', ({ params }) => {
    const document = documents.find((item) => item.id === params.id);
    documents = documents.filter((item) => item.id !== params.id);
    if (document) {
      appendLog({
        eventType: 'document_deleted',
        message: `${document.title} 문서를 삭제했습니다.`,
      });
    }
    return new HttpResponse(null, { status: 204 });
  }),
  http.post('/api/dev/intake', async ({ request }) => {
    const body = (await request.json()) as {
      channel: Channel;
      customerName: string;
      contact?: string;
      message: string;
      orderId?: string;
    };
    const type = inferType(body.message);
    const canAutoReply = type === 'shipping' && Boolean(body.orderId);
    const inquiry: Inquiry = {
      id: `INQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(inquiries.length + 1).padStart(3, '0')}`,
      channel: body.channel,
      customer: {
        name: body.customerName,
        email: body.channel === 'email' ? body.contact : undefined,
        handle: body.channel !== 'email' ? body.contact : undefined,
      },
      type,
      status: canAutoReply ? 'auto_replied' : 'review_required',
      processingMode: canAutoReply ? 'auto_reply' : 'draft_review',
      summary: body.message.slice(0, 38),
      body: body.message,
      receivedAt: now(),
      confidenceScore: confidenceFor(type, body.message),
      orderId: body.orderId,
      autoReplyText: canAutoReply ? '현재 주문은 배송 중이며 예상 도착일은 1~3영업일 내입니다.' : undefined,
    };
    inquiry.draft = createDraft(inquiry);
    inquiries = [inquiry, ...inquiries];
    appendLog({
      inquiryId: inquiry.id,
      eventType: canAutoReply ? 'auto_replied' : 'draft_generated',
      channel: inquiry.channel,
      inquiryType: inquiry.type,
      processingMode: inquiry.processingMode,
      previousStatus: 'received',
      nextStatus: inquiry.status as InquiryStatus,
      message: canAutoReply ? 'Mock 문의를 수집하고 자동응답 처리했습니다.' : 'Mock 문의를 수집하고 답변 초안을 생성했습니다.',
    });
    return HttpResponse.json(inquiry, { status: 201 });
  }),
];
