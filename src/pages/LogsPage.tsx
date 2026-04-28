import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bot, LayoutList, ListTree, Search, UserCheck } from 'lucide-react';
import { api } from '../lib/api';
import type { LogEvent, LogEventType } from '../types/domain';
import { Card } from '../components/Card';
import { Input } from '../components/FormControls';
import { Cell, Row, Table } from '../components/Table';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { Skeleton } from '../components/Skeleton';
import { cx, formatTime } from '../lib/format';
import { logEventMeta } from '../lib/meta';
import { channelLabels, inquiryTypeLabels, processingModeLabels } from '../types/domain';

type ViewMode = 'timeline' | 'table';

export function LogsPage() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('timeline');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await api.listLogs(query);
    setLogs(data);
    setIsLoading(false);
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  // Group by day for timeline
  const grouped = useMemo(() => {
    const map = new Map<string, LogEvent[]>();
    for (const log of [...logs].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))) {
      const key = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(log.createdAt));
      const list = map.get(key) ?? [];
      list.push(log);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [logs]);

  const summary = useMemo(() => {
    const ai = logs.filter((log) => actorMeta(log).kind === 'ai').length;
    const operator = logs.filter((log) => actorMeta(log).kind === 'operator').length;
    const failed = logs.filter((log) => log.nextStatus === 'failed' || log.eventType === 'document_deleted').length;
    return { total: logs.length, ai, operator, failed };
  }, [logs]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <>
            <ListTree className="h-3 w-3" /> Activity
          </>
        }
        title="처리 기록"
        description="문의가 접수된 순간부터 응답이 발송되기까지의 작업 흐름을 시간순으로 확인합니다."
      />

      <Card flush>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              className="h-9 pl-9"
              placeholder="문의 ID 또는 메시지 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-line bg-surface p-0.5">
            <ToggleButton active={view === 'timeline'} onClick={() => setView('timeline')}>
              <ListTree className="h-3.5 w-3.5" />
              타임라인
            </ToggleButton>
            <ToggleButton active={view === 'table'} onClick={() => setView('table')}>
              <LayoutList className="h-3.5 w-3.5" />
              표
            </ToggleButton>
          </div>
        </div>
      </Card>

      <Card
        flush
        title={
          <div>
            <span className="flex items-center gap-2">
              오늘 처리 기록
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold tabular text-ink-700">
                {logs.length}
              </span>
            </span>
            <p className="mt-1 text-xs font-normal text-ink-500">
              AI와 운영자의 처리 흐름을 시간순으로 확인합니다.
            </p>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-3 px-5 py-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-10">
            <EmptyState compact title="검색 결과가 없습니다" />
          </div>
        ) : view === 'timeline' ? (
          <div>
            <ActivitySummary summary={summary} />
            {grouped.map(([day, events]) => (
              <section key={day}>
                <div className="flex items-center justify-between border-b border-line bg-surface-muted/50 px-6 py-3">
                  <span className="text-sm font-bold tracking-tight text-ink-800">{day}</span>
                  <span className="text-[11px] font-semibold tabular text-ink-400">{events.length} events</span>
                </div>
                <ol className="divide-y divide-line">
                  {events.map((log) => (
                    <ActivityStreamRow key={log.id} log={log} />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        ) : (
          <Table
            headers={[
              { label: '시각', width: '130px' },
              { label: '주체', width: '120px' },
              '작업',
              { label: '결과', width: '110px' },
              { label: '연결 문의', width: '180px' },
            ]}
          >
            {logs.map((log) => (
              <Row key={log.id}>
                <Cell mono className="text-ink-500">
                  {formatTime(log.createdAt)}
                </Cell>
                <Cell>
                  <span className="text-xs font-semibold text-ink-800">{actorMeta(log).label}</span>
                </Cell>
                <Cell>
                  <p className="line-clamp-1 text-sm font-semibold text-ink-900">{eventTitle(log)}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{eventDescription(log)}</p>
                </Cell>
                <Cell>
                  <ResultBadge log={log} />
                </Cell>
                <Cell>
                  {log.inquiryId && (
                    <Link
                      to={`/inquiries/${log.inquiryId}`}
                      className="font-mono text-[11px] text-ink-500 hover:text-brand-700"
                    >
                      {log.inquiryId}
                    </Link>
                  )}
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition',
        active ? 'bg-ink-900 text-white shadow-xs' : 'text-ink-500 hover:bg-surface-muted hover:text-ink-900',
      )}
    >
      {children}
    </button>
  );
}

function ActivitySummary({ summary }: { summary: { total: number; ai: number; operator: number; failed: number } }) {
  return (
    <div className="grid grid-cols-4 gap-0 border-b border-line bg-white/72 px-6 py-4">
      <SummaryItem label="events" value={summary.total} />
      <SummaryItem label="AI 처리" value={summary.ai} />
      <SummaryItem label="운영자 처리" value={summary.operator} />
      <SummaryItem label="실패" value={summary.failed} tone={summary.failed > 0 ? 'danger' : 'neutral'} />
    </div>
  );
}

function SummaryItem({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'danger' }) {
  return (
    <div className="border-r border-line px-4 last:border-r-0 first:pl-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">{label}</p>
      <p className={cx('mt-1 text-xl font-black tabular', tone === 'danger' && value > 0 ? 'text-danger-600' : 'text-ink-900')}>
        {value}
        <span className="ml-1 text-xs font-bold text-ink-400">건</span>
      </p>
    </div>
  );
}

function ActivityStreamRow({ log }: { log: LogEvent }) {
  const actor = actorMeta(log);

  return (
    <li className="grid grid-cols-[76px_1fr_110px] gap-5 px-6 py-5 transition hover:bg-surface-muted/50">
      <div className="pt-0.5 text-right font-mono text-xs font-semibold tabular text-ink-500">
        {formatTime(log.createdAt)}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cx('flex h-6 w-6 items-center justify-center rounded-full', actor.className)}>
            {actor.icon}
          </span>
          <span className="text-xs font-bold text-ink-800">{actor.label}</span>
        </div>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-ink-900">{eventTitle(log)}</h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-600">
              {eventDescription(log)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {log.inquiryId && (
            <Link
              to={`/inquiries/${log.inquiryId}`}
              className="inline-flex h-5 items-center rounded-full bg-ink-100 px-2 font-mono text-[11px] font-semibold text-ink-600 hover:text-brand-700"
            >
              {log.inquiryId}
            </Link>
          )}
          {metadataChips(log).map((chip) => (
            <span
              key={chip}
              className="inline-flex h-5 items-center rounded-full bg-ink-100 px-2 text-[11px] font-semibold text-ink-600"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-8">
        <ResultBadge log={log} />
      </div>
    </li>
  );
}

function actorMeta(log: LogEvent) {
  const aiEvents: LogEventType[] = ['inquiry_received', 'classified', 'auto_replied', 'draft_generated'];
  const operatorEvents: LogEventType[] = ['draft_saved', 'review_required', 'response_sent'];
  if (aiEvents.includes(log.eventType)) {
    return {
      kind: 'ai' as const,
      label: 'AI Agent',
      icon: <Bot className="h-3.5 w-3.5" />,
      className: 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
    };
  }
  if (operatorEvents.includes(log.eventType)) {
    return {
      kind: 'operator' as const,
      label: 'HSA 관리자',
      icon: <UserCheck className="h-3.5 w-3.5" />,
      className: 'bg-info-50 text-info-700 ring-1 ring-info-100',
    };
  }
  return {
    kind: 'system' as const,
    label: 'System',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className: 'bg-ink-100 text-ink-600 ring-1 ring-ink-200',
  };
}

function eventTitle(log: LogEvent) {
  const titles: Partial<Record<LogEventType, string>> = {
    auto_replied: '배송 문의 자동응답 완료',
    draft_generated: log.inquiryType === 'exchange_refund' ? '환불 문의 답변 초안 생성' : '답변 초안 생성',
    response_sent: '운영자 최종 답변 발송',
    draft_saved: '운영자 답변 초안 저장',
    review_required: '운영자 검토 필요 표시',
    inquiry_received: '신규 문의 접수',
    classified: 'AI 문의 분류 완료',
    document_uploaded: '지식 문서 등록',
    document_deleted: '지식 문서 삭제',
  };
  return titles[log.eventType] ?? logEventMeta[log.eventType].label;
}

function eventDescription(log: LogEvent) {
  const descriptions: Partial<Record<LogEventType, string>> = {
    auto_replied: 'AI Agent가 배송 DB에서 송장 정보를 확인해 고객에게 자동응답을 발송했습니다.',
    draft_generated: 'AI Agent가 교환/환불 정책 문서를 근거로 운영자 검토용 답변 초안을 만들었습니다.',
    response_sent: 'HSA 관리자가 AI 초안을 수정한 뒤 고객에게 최종 답변을 발송했습니다.',
    draft_saved: 'HSA 관리자가 고객에게 보낼 답변 문구를 다듬고 임시저장했습니다.',
    review_required: 'HSA 관리자가 추가 정책 확인이 필요하다고 표시했습니다.',
    inquiry_received: '새 고객 문의가 수집되어 AI 처리 흐름에 등록되었습니다.',
    classified: 'AI Agent가 문의 유형과 처리 경로를 분류했습니다.',
    document_uploaded: 'RAG 답변 생성에 사용할 지식 문서가 등록되었습니다.',
    document_deleted: '사용하지 않는 지식 문서가 문서 목록에서 제거되었습니다.',
  };
  return descriptions[log.eventType] ?? log.message;
}

function metadataChips(log: LogEvent) {
  const chips: string[] = [];
  if (log.channel) chips.push(channelLabels[log.channel]);
  if (log.inquiryType) chips.push(inquiryTypeLabels[log.inquiryType]);
  if (log.processingMode) {
    const modeLabel = log.eventType === 'draft_generated' ? 'RAG 초안' : processingModeLabels[log.processingMode];
    chips.push(modeLabel);
  }
  return chips.slice(0, 3);
}

function ResultBadge({ log }: { log: LogEvent }) {
  const result = resultMeta(log);
  return (
    <span className={cx('inline-flex h-7 items-center rounded-full px-3 text-xs font-bold whitespace-nowrap', result.className)}>
      {result.label}
    </span>
  );
}

function resultMeta(log: LogEvent) {
  if (log.nextStatus === 'failed') return { label: '실패', className: 'bg-danger-50 text-danger-700' };
  if (log.eventType === 'draft_generated' || log.nextStatus === 'review_required' || log.nextStatus === 'draft_ready') {
    return { label: '검토 대기', className: 'bg-warn-50 text-warn-700' };
  }
  if (log.eventType === 'response_sent' || log.nextStatus === 'sent') {
    return { label: '발송 완료', className: 'bg-brand-100 text-brand-800' };
  }
  if (log.eventType === 'auto_replied' || log.nextStatus === 'auto_replied') {
    return { label: '완료', className: 'bg-brand-50 text-brand-700' };
  }
  if (log.eventType === 'document_deleted') {
    return { label: '삭제됨', className: 'bg-danger-50 text-danger-700' };
  }
  return { label: '기록됨', className: 'bg-ink-100 text-ink-700' };
}
