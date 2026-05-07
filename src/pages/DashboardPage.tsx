import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock4,
  FileText,
  Inbox,
  Sparkles,
  TerminalSquare,
  UserCheck,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Inquiry, LogEvent } from '../types/domain';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ChannelMark, InquiryTypeBadge, StatusBadge } from '../components/Badge';
import { PageHeader } from '../components/PageHeader';
import { Skeleton, SkeletonText } from '../components/Skeleton';
import { cx, formatRelativeTime, formatTime } from '../lib/format';
import { logEventMeta } from '../lib/meta';

export function DashboardPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [nextInquiries, nextLogs] = await Promise.all([api.listInquiries(), api.listLogs()]);
    setInquiries(nextInquiries);
    setLogs(nextLogs);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const total = inquiries.length;
    const classified = inquiries.filter((i) => i.status !== 'received').length;
    const responseReady = inquiries.filter((i) =>
      ['auto_replied', 'draft_ready', 'review_required', 'saved', 'sent'].includes(i.status),
    ).length;
    const review = inquiries.filter(isReviewTarget).length;
    const completed = inquiries.filter((i) => i.status === 'auto_replied' || i.status === 'sent').length;
    return { total, classified, responseReady, review, completed };
  }, [inquiries]);

  const queue = useMemo(
    () =>
      [...inquiries]
        .filter(isReviewTarget)
        .sort((a, b) => +new Date(a.receivedAt) - +new Date(b.receivedAt)),
    [inquiries],
  );

  const stages = useMemo(
    () => [
      {
        key: 'incoming',
        label: '신규 접수',
        count: stats.total,
        description: '전체 채널 유입',
        icon: <Inbox className="h-5 w-5" />,
        tone: 'blue' as const,
      },
      {
        key: 'classified',
        label: 'AI 분류',
        count: stats.classified,
        description: '유형과 우선순위 정리',
        icon: <Bot className="h-5 w-5" />,
        tone: 'blue' as const,
      },
      {
        key: 'response',
        label: '답변 준비',
        count: stats.responseReady,
        description: '자동응답 또는 초안 생성',
        icon: <FileText className="h-5 w-5" />,
        tone: 'teal' as const,
      },
      {
        key: 'review',
        label: '운영자 검토',
        count: stats.review,
        description: '사람의 판단이 필요한 단계',
        icon: <UserCheck className="h-5 w-5" />,
        tone: 'amber' as const,
        highlighted: stats.review > 0,
      },
      {
        key: 'done',
        label: '처리 완료',
        count: stats.completed,
        description: '자동응답 또는 발송 완료',
        icon: <CheckCircle2 className="h-5 w-5" />,
        tone: 'teal' as const,
      },
    ],
    [stats],
  );

  const oldestQueueItem = queue[0];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <>
            <Sparkles className="h-4 w-4" /> Overview
          </>
        }
        title="운영 대시보드"
        description="오늘 처리해야 할 CS만 먼저 확인하세요. AI가 문의 유형과 근거를 정리하고, 운영자는 필요한 판단에 집중합니다."
        actions={
          <>
            <Button variant="secondary" size="md" icon={<TerminalSquare className="h-4 w-4" />}>
              <Link to="/dev/intake">문의 주입</Link>
            </Button>
            <Button size="md" iconRight={<ArrowRight className="h-4 w-4" />}>
              <Link to="/inquiries">문의 처리하기</Link>
            </Button>
          </>
        }
      />

      <section className="overflow-hidden rounded-[28px] border border-white bg-white shadow-lg ring-1 ring-line/60">
        <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(440px,1.1fr)]">
          <div className="border-r border-line bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-8 py-8">
            <span className="inline-flex h-9 items-center rounded-full bg-brand-50 px-4 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
              오늘의 운영 포커스
            </span>
            <div className="mt-8">
              <p className="text-h3 text-ink-700">운영자 검토가 필요한 CS</p>
              <div className="mt-2 flex items-end gap-3">
                {isLoading ? (
                  <Skeleton className="h-20 w-28 rounded-xl" />
                ) : (
                  <span className="tabular text-[72px] font-black leading-none text-ink-900">
                    {stats.review}
                  </span>
                )}
                <span className="pb-3 text-h2 text-ink-500">건</span>
              </div>
              <p className="mt-5 max-w-xl text-[20px] font-bold leading-relaxed text-ink-900">
                오래 기다린 문의부터 확인하면 오늘의 CS 병목을 가장 빠르게 줄일 수 있습니다.
              </p>
              <p className="mt-3 max-w-xl text-body leading-relaxed text-ink-500">
                AI가 분류, 근거, 다음 액션을 먼저 정리했습니다. 운영자는 고객에게 보낼 최종 판단만 확인하면 됩니다.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-line bg-white px-5 py-4">
              <p className="text-sm font-bold text-ink-500">가장 오래 대기 중</p>
              {isLoading ? (
                <SkeletonText lines={2} className="mt-3" />
              ) : oldestQueueItem ? (
                <Link to={`/inquiries/${oldestQueueItem.id}`} className="group mt-3 block">
                  <p className="truncate text-h3 text-ink-900 group-hover:text-brand-700">
                    {oldestQueueItem.summary}
                  </p>
                  <p className="mt-2 text-sm text-ink-500">
                    {oldestQueueItem.customer.name} 고객 · {formatRelativeTime(oldestQueueItem.receivedAt)} 대기 · AI {Math.round(oldestQueueItem.confidenceScore * 100)}%
                  </p>
                </Link>
              ) : (
                <p className="mt-3 text-body text-ink-500">현재 운영자 검토가 필요한 문의가 없습니다.</p>
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-h2 text-ink-900">오늘 처리할 CS</h2>
                <p className="mt-1 text-sm text-ink-500">오래 대기한 문의 3건을 먼저 보여줍니다.</p>
              </div>
              <Link
                to="/inquiries"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
              >
                전체 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-line bg-surface-muted px-4 py-4">
                    <SkeletonText lines={2} />
                  </div>
                ))}
              </div>
            ) : queue.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface-muted px-5 py-10 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-info-600" />
                <p className="mt-3 text-h3 text-ink-900">검토 대기 문의가 없습니다.</p>
                <p className="mt-2 text-body text-ink-500">AI가 모든 문의를 정상 처리했습니다.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {queue.slice(0, 3).map((inquiry, index) => (
                  <li key={inquiry.id}>
                    <FocusCsRow inquiry={inquiry} index={index + 1} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <Card
        title="처리 단계 통계"
        description="문의가 어느 단계에 머무는지 숫자로 확인합니다."
        flush
        className="overflow-hidden"
      >
        <div className="grid grid-cols-5 divide-x divide-line">
          {stages.map((stage) => (
            <StageStat key={stage.key} stage={stage} loading={isLoading} />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-[1.15fr_0.85fr] gap-5">
        <Card
          title="검토 항목 요약"
          description="어떤 CS인지, 왜 멈춰 있는지, 다음에 무엇을 해야 하는지 정리했습니다."
          action={
            <span className="inline-flex h-9 items-center rounded-full border border-line bg-surface-muted px-3 text-sm font-bold text-ink-600">
              오래 대기순
            </span>
          }
          flush
        >
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonText key={index} lines={2} />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="px-5 py-10 text-center text-body text-ink-500">
              운영자 판단을 기다리는 문의가 없습니다.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {queue.slice(0, 5).map((inquiry) => (
                <li key={inquiry.id}>
                  <ReviewSummaryRow inquiry={inquiry} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="최근 처리 기록" description="AI와 운영자의 최근 작업 흐름" flush>
          {isLoading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonText key={index} lines={2} />
              ))}
            </div>
          ) : (
            <ol className="divide-y divide-line">
              {logs.slice(0, 5).map((log) => (
                <ActivityRow key={log.id} log={log} />
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}

function isReviewTarget(inquiry: Inquiry) {
  return ['review_required', 'draft_ready', 'classified', 'received', 'saved'].includes(inquiry.status);
}

function FocusCsRow({ inquiry, index }: { inquiry: Inquiry; index: number }) {
  return (
    <Link
      to={`/inquiries/${inquiry.id}`}
      className="group grid grid-cols-[40px_1fr_auto] items-center gap-4 rounded-2xl border border-line bg-surface-muted px-4 py-4 transition hover:border-brand-100 hover:bg-white hover:shadow-sm"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black tabular text-ink-800 ring-1 ring-line">
        {index}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <InquiryTypeBadge type={inquiry.type} size="xs" />
          <StatusBadge status={inquiry.status} size="xs" />
          <span className="text-sm font-bold text-ink-500">
            {formatRelativeTime(inquiry.receivedAt)} 대기
          </span>
        </div>
        <p className="mt-2 truncate text-h3 text-ink-900 group-hover:text-brand-700">
          {inquiry.summary}
        </p>
        <p className="mt-1 truncate text-body text-ink-500">
          {csReason(inquiry)} · {nextActionCopy(inquiry)}
        </p>
      </div>
      <span className="hidden h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-ink-900 ring-1 ring-line transition group-hover:bg-ink-900 group-hover:text-white xl:inline-flex">
        처리하기
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

type StageTone = 'blue' | 'teal' | 'amber';

interface StageInfo {
  key: string;
  label: string;
  count: number;
  description: string;
  icon: ReactNode;
  tone: StageTone;
  highlighted?: boolean;
}

function StageStat({ stage, loading }: { stage: StageInfo; loading: boolean }) {
  const tone = {
    blue: {
      icon: 'bg-brand-50 text-brand-700 ring-brand-100',
      count: 'text-brand-700',
      line: 'bg-brand-500',
    },
    teal: {
      icon: 'bg-info-50 text-info-700 ring-info-100',
      count: 'text-info-700',
      line: 'bg-info-500',
    },
    amber: {
      icon: 'bg-warn-50 text-warn-700 ring-warn-100',
      count: 'text-warn-700',
      line: 'bg-warn-500',
    },
  }[stage.tone];

  return (
    <div
      className={cx(
        'relative min-h-[158px] px-5 py-5 transition',
        stage.highlighted ? 'bg-warn-50/70' : 'bg-white',
      )}
    >
      <span className={cx('absolute inset-x-0 top-0 h-1', stage.highlighted ? 'bg-warn-500' : tone.line)} />
      <div className="flex items-center justify-between">
        <span className={cx('flex h-10 w-10 items-center justify-center rounded-xl ring-1', tone.icon)}>
          {stage.icon}
        </span>
        {stage.highlighted && (
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-warn-700 ring-1 ring-warn-100">
            현재 병목
          </span>
        )}
      </div>
      <p className="mt-5 text-sm font-bold text-ink-500">{stage.label}</p>
      <div className="mt-2 flex items-end gap-1">
        {loading ? (
          <Skeleton className="h-10 w-16 rounded-lg" />
        ) : (
          <span className={cx('tabular text-[44px] font-black leading-none', tone.count)}>
            {stage.count}
          </span>
        )}
        <span className="pb-1 text-body font-bold text-ink-400">건</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-500">{stage.description}</p>
    </div>
  );
}

function ReviewSummaryRow({ inquiry }: { inquiry: Inquiry }) {
  return (
    <Link
      to={`/inquiries/${inquiry.id}`}
      className="grid grid-cols-[auto_1fr_180px] items-center gap-4 px-5 py-4 transition hover:bg-surface-muted"
    >
      <ChannelMark channel={inquiry.channel} size="md" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <InquiryTypeBadge type={inquiry.type} size="xs" />
          <span className="text-sm font-bold text-ink-400">{inquiry.id}</span>
        </div>
        <p className="mt-2 truncate text-h3 text-ink-900">{inquiry.summary}</p>
        <p className="mt-1 truncate text-body text-ink-500">
          {csReason(inquiry)} · AI {Math.round(inquiry.confidenceScore * 100)}% · {nextActionCopy(inquiry)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-ink-500">{formatRelativeTime(inquiry.receivedAt)} 대기</p>
        <p className="mt-1 text-sm font-bold text-brand-700">상세 검토 →</p>
      </div>
    </Link>
  );
}

function ActivityRow({ log }: { log: LogEvent }) {
  const meta = logEventMeta[log.eventType];

  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-50 text-info-700 ring-1 ring-info-100">
          <Clock4 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-bold text-ink-500">{formatTime(log.createdAt)}</p>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-bold text-ink-600">
              {meta.label}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-body font-semibold text-ink-900">
            {narrativeLogMessage(log)}
          </p>
          {log.inquiryId && (
            <Link
              to={`/inquiries/${log.inquiryId}`}
              className="mt-2 inline-flex text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              {log.inquiryId}
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

function csReason(inquiry: Inquiry) {
  const copy: Record<Inquiry['type'], string> = {
    shipping: inquiry.orderId ? '주문 배송 상태 확인' : '주문 식별 필요',
    exchange_refund: '교환·환불 조건 확인',
    product: '상품 정보 또는 재입고 확인',
    other: inquiry.body.includes('매장') ? '오프라인 매장 정보 확인' : '운영자 판단 필요',
  };
  return copy[inquiry.type];
}

function nextActionCopy(inquiry: Inquiry) {
  if (inquiry.status === 'draft_ready') return '초안 확인 후 발송';
  if (inquiry.status === 'review_required' && inquiry.type === 'exchange_refund') return '환불 조건 확인';
  if (inquiry.status === 'review_required') return '정책 조건 확인';
  if (inquiry.status === 'saved') return '최종 발송 결정';
  if (inquiry.status === 'received' || inquiry.status === 'classified') return '문의 유형 재확인';
  if (inquiry.status === 'failed') return '실패 원인 확인';
  return '상태 확인';
}

function narrativeLogMessage(log: LogEvent) {
  const narratives: Partial<Record<LogEvent['eventType'], string>> = {
    auto_replied: 'AI가 배송 DB를 조회하고 고객에게 자동응답을 발송했습니다.',
    draft_generated: 'AI가 정책 문서를 근거로 운영자 검토용 답변 초안을 만들었습니다.',
    response_sent: '운영자가 초안을 확인한 뒤 최종 답변을 발송했습니다.',
    draft_saved: '운영자가 답변 문구를 다듬고 임시저장했습니다.',
    review_required: '추가 판단이 필요한 문의로 표시했습니다.',
    inquiry_received: '새 고객 문의가 접수되었습니다.',
    classified: 'AI가 문의 유형과 처리 경로를 분류했습니다.',
    document_uploaded: '새 지식 문서가 RAG 근거 후보로 등록되었습니다.',
    document_deleted: '사용하지 않는 지식 문서가 목록에서 제거되었습니다.',
  };
  return narratives[log.eventType] ?? log.message;
}
