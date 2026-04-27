import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  CornerDownLeft,
  FileText,
  History,
  Mail,
  Save,
  Send,
  Sparkles,
  User2,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Inquiry, SourceDocument } from '../types/domain';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
  ChannelBadge,
  ChannelMark,
  InquiryTypeBadge,
  Pill,
  ProcessingBadge,
  StatusBadge,
} from '../components/Badge';
import { Kbd } from '../components/Kbd';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { useToast } from './../components/ToastContext';
import { cx, formatDateTime, formatRelativeTime } from '../lib/format';
import { documentTypeMeta, statusMeta } from '../lib/meta';

const FLOW_STEPS: Array<{ key: string; label: string; matches: (i: Inquiry) => boolean }> = [
  { key: 'received', label: '접수', matches: () => true },
  {
    key: 'classified',
    label: '분류',
    matches: (i) => i.status !== 'received',
  },
  {
    key: 'draft',
    label: '응답 생성',
    matches: (i) =>
      ['draft_ready', 'review_required', 'saved', 'auto_replied', 'sent'].includes(i.status),
  },
  {
    key: 'sent',
    label: '발송',
    matches: (i) => i.status === 'sent' || i.status === 'auto_replied',
  },
];

export function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [finalText, setFinalText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await api.getInquiry(id);
      setInquiry(data);
      setFinalText(data.draft?.finalText ?? data.draft?.draftText ?? data.autoReplyText ?? '');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = useCallback(async () => {
    if (!inquiry || !finalText.trim()) return;
    setIsSaving(true);
    try {
      const next = await api.saveDraft(inquiry.id, finalText);
      setInquiry(next);
      showToast('답변을 임시저장했습니다.', 'success');
    } finally {
      setIsSaving(false);
    }
  }, [inquiry, finalText, showToast]);

  const handleSend = useCallback(async () => {
    if (!inquiry || !finalText.trim()) return;
    setIsSaving(true);
    try {
      const next = await api.sendResponse(inquiry.id, finalText);
      setInquiry(next);
      showToast('최종 답변을 발송 처리했습니다.', 'success');
    } finally {
      setIsSaving(false);
    }
  }, [inquiry, finalText, showToast]);

  const handleMarkReviewRequired = useCallback(async () => {
    if (!inquiry || isFinalStatus(inquiry.status)) return;
    setIsSaving(true);
    try {
      const next = await api.markReviewRequired(inquiry.id);
      setInquiry(next);
      showToast('검토 필요 상태로 표시했습니다.', 'warn');
    } finally {
      setIsSaving(false);
    }
  }, [inquiry, showToast]);

  // Cmd/Ctrl + S → save, Cmd/Ctrl + Enter → send, Esc → back
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSave();
      } else if (mod && e.key === 'Enter') {
        e.preventDefault();
        void handleSend();
      } else if (e.key === 'Escape') {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag !== 'TEXTAREA' && tag !== 'INPUT') navigate('/inquiries');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave, handleSend, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-[0.95fr_1.05fr] gap-5">
          <Skeleton className="h-[420px] rounded-xl" />
          <Skeleton className="h-[420px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <EmptyState
        title="문의를 찾을 수 없습니다"
        description="삭제되었거나 잘못된 ID일 수 있어요."
        action={
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            <Link to="/inquiries">목록으로 돌아가기</Link>
          </Button>
        }
      />
    );
  }

  const isFinal = inquiry.status === 'sent' || inquiry.status === 'auto_replied';
  const draft = inquiry.draft;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link to="/inquiries" className="inline-flex items-center gap-1 hover:text-ink-900">
          <ArrowLeft className="h-3.5 w-3.5" /> 문의 목록
        </Link>
        <ChevronRight className="h-3 w-3 text-ink-300" />
        <span className="font-mono text-ink-400">{inquiry.id}</span>
      </div>

      {/* Header card with flow */}
      <Card flush className="overflow-hidden border-brand-100 bg-[linear-gradient(135deg,rgba(236,254,255,0.96),rgba(255,255,255,0.92)_42%,rgba(244,241,255,0.82))]">
        <div className="flex items-start gap-5 px-6 py-5">
          <ChannelMark channel={inquiry.channel} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ChannelBadge channel={inquiry.channel} size="xs" />
              <InquiryTypeBadge type={inquiry.type} size="xs" />
              <ProcessingBadge mode={inquiry.processingMode} size="xs" />
              <span className="text-xs text-ink-400">·</span>
              <span className="text-xs tabular text-ink-500">
                {formatDateTime(inquiry.receivedAt)} ({formatRelativeTime(inquiry.receivedAt)})
              </span>
            </div>
            <h1 className="mt-2 text-h1 text-ink-900">{inquiry.summary}</h1>
            <div className="mt-2 flex items-center gap-4 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <User2 className="h-3.5 w-3.5" />
                <span className="font-medium text-ink-700">{inquiry.customer.name}</span>
              </span>
              {inquiry.customer.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="font-mono text-[11px]">{inquiry.customer.email}</span>
                </span>
              )}
              {inquiry.customer.handle && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono text-[11px]">@{inquiry.customer.handle}</span>
                </span>
              )}
              {inquiry.orderId && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-ink-400">주문</span>
                  <span className="font-mono text-[11px] text-ink-700">{inquiry.orderId}</span>
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={inquiry.status} />
          </div>
        </div>
        <FlowBar inquiry={inquiry} />
      </Card>

      <AIInsightGrid inquiry={inquiry} />

      <div className="grid grid-cols-[0.95fr_1.05fr] gap-5">
        {/* LEFT: original + sources + history */}
        <div className="space-y-5">
          <Card
            title={
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-ink-500" /> 문의 원문
              </span>
            }
            description={`${formatDateTime(inquiry.receivedAt)} · ${inquiry.channel === 'email' ? '이메일' : inquiry.channel === 'kakao' ? '카카오톡' : '인스타그램 DM'}`}
          >
            <p className="whitespace-pre-line text-sm leading-7 text-ink-800">
              {inquiry.body}
            </p>
            {inquiry.orderId && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-line bg-surface-muted px-3 py-2 text-xs">
                <span className="text-ink-500">주문번호</span>
                <span className="font-mono font-medium text-ink-900">{inquiry.orderId}</span>
                <span className="ml-auto text-ink-400">DB 조회 사용</span>
              </div>
            )}
          </Card>

          <Card
            title={
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-ink-500" /> 참고 문서 / 근거
              </span>
            }
            description={
              draft?.sources.length
                ? `${draft.sources.length}건의 문서가 답변 생성에 인용되었습니다.`
                : '근거 문서가 연결되지 않은 문의예요.'
            }
            flush
          >
            {draft?.sources.length ? (
              <ul className="divide-y divide-line">
                {draft.sources.map((source, idx) => (
                  <SourceItem key={source.id} source={source} index={idx + 1} />
                ))}
              </ul>
            ) : (
              <div className="px-5 py-6">
                <EmptyState
                  compact
                  title="근거 문서 없음"
                  description="자동응답 또는 운영자 수동 처리 대상입니다."
                />
              </div>
            )}
          </Card>

          <Card
            title={
              <span className="inline-flex items-center gap-1.5">
                <History className="h-4 w-4 text-ink-500" /> 처리 이력
              </span>
            }
            flush
          >
            <ProcessHistory inquiry={inquiry} />
          </Card>
        </div>

        {/* RIGHT: composer */}
        <div className="space-y-5">
          <Card
            title={
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-600" />
                {isFinal ? '발송된 답변' : 'AI 답변 초안'}
              </span>
            }
            description={
              isFinal
                ? '발송이 완료된 응답입니다.'
                : draft
                  ? `${formatRelativeTime(draft.createdAt)} 생성됨 · 검토 후 발송하세요.`
                  : '초안 없음 — 직접 작성해 발송할 수 있습니다.'
            }
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Save className="h-3.5 w-3.5" />}
                  disabled={isSaving || !finalText.trim() || isFinal}
                  onClick={handleSave}
                >
                  임시저장
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  icon={<AlertTriangle className="h-3.5 w-3.5" />}
                  disabled={isSaving || isFinal}
                  onClick={handleMarkReviewRequired}
                >
                  검토필요
                </Button>
                <Button
                  size="sm"
                  icon={<Send className="h-3.5 w-3.5" />}
                  disabled={isSaving || !finalText.trim() || isFinal}
                  onClick={handleSend}
                  loading={isSaving}
                >
                  발송
                </Button>
              </div>
            }
          >
            {/* AI suggestion banner */}
            {!isFinal && draft?.draftText && (
              <div className="mb-3 flex items-start gap-2.5 rounded-md border border-violet-50 bg-violet-50/60 px-3 py-2.5 text-xs">
                <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-violet-600">RAG 초안 제안</p>
                  <p className="mt-0.5 text-violet-600/80">{draft.draftText}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFinalText(draft.draftText)}
                  className="shrink-0 rounded border border-violet-50 bg-white px-2 py-0.5 text-[11px] font-medium text-violet-600 transition hover:bg-violet-50"
                >
                  제안 채택
                </button>
              </div>
            )}

            {inquiry.autoReplyText && !isFinal && (
              <div className="mb-3 flex items-start gap-2.5 rounded-md border border-brand-100 bg-brand-50/70 px-3 py-2.5 text-xs">
                <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-800">DB 자동응답 안</p>
                  <p className="mt-0.5 text-brand-700">{inquiry.autoReplyText}</p>
                </div>
              </div>
            )}

            <div
              className={cx(
                'rounded-md border bg-surface transition focus-within:border-brand-500 focus-within:shadow-focus',
                'border-line',
              )}
            >
              <textarea
                ref={textareaRef}
                value={finalText}
                onChange={(e) => setFinalText(e.target.value)}
                disabled={isFinal}
                placeholder="고객에게 보낼 최종 답변을 작성하세요…"
                className="block min-h-[340px] w-full resize-y rounded-md bg-transparent px-4 py-3 text-sm leading-7 text-ink-900 outline-none placeholder:text-ink-400 disabled:cursor-not-allowed disabled:text-ink-500"
              />
              <div className="flex items-center justify-between border-t border-line bg-surface-muted/40 px-3 py-2">
                <div className="flex items-center gap-3 text-[11px] text-ink-500">
                  <span className="tabular">
                    {finalText.length} / {Math.max(finalText.length, 800)} 자
                  </span>
                  {draft?.sources.length ? (
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      근거 {draft.sources.length}건
                    </span>
                  ) : null}
                </div>
                {!isFinal && (
                  <div className="flex items-center gap-2 text-[11px] text-ink-500">
                    <span>저장</span>
                    <Kbd>⌘</Kbd>
                    <Kbd>S</Kbd>
                    <span className="ml-1">발송</span>
                    <Kbd>⌘</Kbd>
                    <Kbd>
                      <CornerDownLeft className="h-3 w-3" />
                    </Kbd>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {isFinal ? (
            <div className="flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-800">
              <Check className="h-4 w-4" />
              {inquiry.status === 'auto_replied'
                ? 'DB 기반 자동응답으로 즉시 발송되었습니다.'
                : '관리자 검토 후 최종 발송이 완료되었습니다.'}
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3 text-xs text-ink-500">
              <span>응답 신중히 검토하세요. 발송 후에는 수정할 수 없습니다.</span>
              <Pill
                label={isSaving ? '처리 중…' : '준비됨'}
                tone={isSaving ? 'info' : 'success'}
                size="xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function isFinalStatus(status: Inquiry['status']) {
  return status === 'sent' || status === 'auto_replied';
}

function AIInsightGrid({ inquiry }: { inquiry: Inquiry }) {
  const next = nextActionCopy(inquiry.status);
  const confidence = Math.round(inquiry.confidenceScore * 100);
  return (
    <div className="grid grid-cols-4 gap-3">
      <InsightCard
        label="무엇이 들어왔나"
        value={inquiry.summary}
        caption={`${inquiry.customer.name} · ${inquiry.channel === 'kakao' ? '카카오톡' : inquiry.channel === 'instagram' ? '인스타그램 DM' : '이메일'}`}
      />
      <InsightCard
        label="AI 분류"
        value={<InquiryTypeBadge type={inquiry.type} />}
        caption={`분류 신뢰도 ${confidence}%`}
        meter={confidence}
      />
      <InsightCard
        label="처리 판단"
        value={<StatusBadge status={inquiry.status} />}
        caption={inquiry.processingMode === 'auto_reply' ? 'DB 조회로 자동응답 가능' : 'RAG 초안 또는 운영자 검토 필요'}
      />
      <InsightCard
        label="다음 액션"
        value={next.title}
        caption={next.caption}
        accent
      />
    </div>
  );
}

function InsightCard({
  label,
  value,
  caption,
  meter,
  accent,
}: {
  label: string;
  value: ReactNode;
  caption: string;
  meter?: number;
  accent?: boolean;
}) {
  return (
    <div
      className={cx(
        'min-h-[118px] rounded-xl border bg-white/86 px-4 py-4 shadow-xs backdrop-blur',
        accent ? 'border-warn-100 ring-1 ring-warn-100' : 'border-white/70 ring-1 ring-line/60',
      )}
    >
      <p className="text-[11px] font-bold uppercase text-ink-400">{label}</p>
      <div className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-ink-900">{value}</div>
      {meter !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${meter}%` }} />
        </div>
      )}
      <p className="mt-2 line-clamp-2 text-xs leading-snug text-ink-500">{caption}</p>
    </div>
  );
}

function nextActionCopy(status: Inquiry['status']) {
  const copy: Record<Inquiry['status'], { title: string; caption: string }> = {
    received: { title: '분류 결과 확인', caption: 'AI 분류가 완료되면 응답 경로를 결정합니다.' },
    classified: { title: '응답 경로 선택', caption: '자동응답 또는 RAG 초안 생성으로 이동합니다.' },
    auto_replied: { title: '모니터링', caption: '자동 발송 완료. 로그에서 결과를 확인하세요.' },
    draft_ready: { title: '초안 검토 후 발송', caption: '오른쪽 편집기에서 문구를 다듬고 발송하세요.' },
    review_required: { title: '관리자 판단 필요', caption: '정책/주문 확인 후 초안을 수정하거나 저장하세요.' },
    saved: { title: '최종 발송 결정', caption: '저장된 답변을 확인하고 고객에게 발송하세요.' },
    sent: { title: '완료', caption: '최종 응답이 발송되었습니다.' },
    failed: { title: '실패 원인 확인', caption: '로그에서 실패 사유를 확인하고 재처리하세요.' },
  };
  return copy[status];
}

function FlowBar({ inquiry }: { inquiry: Inquiry }) {
  const currentIdx = FLOW_STEPS.reduce(
    (acc, step, idx) => (step.matches(inquiry) ? idx : acc),
    0,
  );
  return (
    <div className="flex items-center gap-0 border-t border-line bg-surface-muted/30 px-6 py-3">
      {FLOW_STEPS.map((step, idx) => {
        const isActive = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step.key} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={cx(
                'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface text-ink-400 ring-1 ring-line',
                isCurrent && 'ring-2 ring-brand-200',
              )}
            >
              {isActive ? <Check className="h-3 w-3" /> : idx + 1}
            </span>
            <span
              className={cx(
                'text-xs font-medium',
                isActive ? 'text-ink-900' : 'text-ink-400',
              )}
            >
              {step.label}
            </span>
            {idx < FLOW_STEPS.length - 1 && (
              <span
                className={cx(
                  'mx-2 h-px flex-1',
                  idx < currentIdx ? 'bg-brand-400' : 'bg-line',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SourceItem({ source, index }: { source: SourceDocument; index: number }) {
  const meta = documentTypeMeta[source.type];
  return (
    <li className="flex gap-3 px-5 py-3.5">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-ink-900 text-[10px] font-bold tabular text-white">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink-900">{source.title}</p>
          <Pill label={meta.label} meta={meta} size="xs" />
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">
          “{source.excerpt}”
        </p>
      </div>
    </li>
  );
}

function ProcessHistory({ inquiry }: { inquiry: Inquiry }) {
  const events: Array<{ label: string; time: string; tone?: ReactNode; note?: string }> = [
    { label: '문의 접수', time: inquiry.receivedAt, note: `${inquiry.channel} 채널` },
  ];
  if (inquiry.status !== 'received') {
    events.push({ label: '유형 분류', time: inquiry.receivedAt, note: inquiry.type });
  }
  if (inquiry.draft) {
    events.push({
      label: 'AI 초안 생성',
      time: inquiry.draft.createdAt,
      note: `${inquiry.draft.sources.length}건 인용`,
    });
    if (inquiry.draft.updatedAt) {
      events.push({ label: '관리자 수정', time: inquiry.draft.updatedAt });
    }
  }
  if (inquiry.status === 'auto_replied') {
    events.push({ label: '자동응답 발송', time: inquiry.receivedAt });
  }
  if (inquiry.status === 'sent') {
    events.push({
      label: '최종 발송',
      time: inquiry.draft?.updatedAt ?? inquiry.receivedAt,
    });
  }
  return (
    <ol className="relative px-5 py-2">
      <span className="absolute bottom-3 left-[26px] top-3 w-px bg-line" aria-hidden />
      {events.map((event, idx) => (
        <li key={idx} className="relative flex items-start gap-3 py-2">
          <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface ring-4 ring-surface">
            <span className={cx('h-2 w-2 rounded-full', statusMeta[inquiry.status].dot)} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-ink-900">{event.label}</p>
            <p className="text-[11px] tabular text-ink-500">{formatDateTime(event.time)}</p>
            {event.note && <p className="mt-0.5 text-[11px] text-ink-500">{event.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
