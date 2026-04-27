import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutList, ListTree, Search } from 'lucide-react';
import { api } from '../lib/api';
import type { LogEvent } from '../types/domain';
import { Card } from '../components/Card';
import { Input } from '../components/FormControls';
import { Cell, Row, Table } from '../components/Table';
import {
  ChannelBadge,
  InquiryTypeBadge,
  Pill,
  ProcessingBadge,
  StatusBadge,
} from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { Skeleton } from '../components/Skeleton';
import { cx, formatDateTime, formatTime } from '../lib/format';
import { logEventMeta } from '../lib/meta';

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
    for (const log of logs) {
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

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <>
            <ListTree className="h-3 w-3" /> Activity
          </>
        }
        title="로그 조회"
        description="문의 처리 흐름을 이벤트 단위로 추적합니다. 자동응답·초안 생성·발송 이력을 확인하세요."
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
          <span className="flex items-center gap-2">
            이벤트
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold tabular text-ink-700">
              {logs.length}
            </span>
          </span>
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
          <div className="px-5 py-2">
            {grouped.map(([day, events]) => (
              <section key={day} className="py-3">
                <div className="sticky top-0 z-10 -mx-5 mb-2 flex items-center gap-2 bg-surface/90 px-5 py-1.5 backdrop-blur">
                  <span className="text-xs font-semibold tracking-tight text-ink-700">{day}</span>
                  <span className="text-[11px] tabular text-ink-400">{events.length}건</span>
                </div>
                <ol className="relative">
                  <span className="absolute bottom-3 left-3 top-3 w-px bg-line" aria-hidden />
                  {events.map((log) => (
                    <TimelineItem key={log.id} log={log} />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        ) : (
          <Table
            headers={[
              { label: '시각', width: '130px' },
              { label: '이벤트', width: '160px' },
              '문의',
              { label: '채널', width: '90px' },
              { label: '유형', width: '110px' },
              { label: '상태 변화', width: '180px' },
            ]}
          >
            {logs.map((log) => (
              <Row key={log.id}>
                <Cell mono className="text-ink-500">
                  {formatTime(log.createdAt)}
                </Cell>
                <Cell>
                  <Pill
                    label={logEventMeta[log.eventType].label}
                    tone={logEventMeta[log.eventType].tone}
                    size="xs"
                  />
                </Cell>
                <Cell>
                  <p className="line-clamp-1 text-sm text-ink-800">{log.message}</p>
                  {log.inquiryId && (
                    <Link
                      to={`/inquiries/${log.inquiryId}`}
                      className="font-mono text-[11px] text-ink-500 hover:text-brand-700"
                    >
                      {log.inquiryId}
                    </Link>
                  )}
                </Cell>
                <Cell>{log.channel ? <ChannelBadge channel={log.channel} size="xs" /> : '-'}</Cell>
                <Cell>
                  {log.inquiryType ? (
                    <InquiryTypeBadge type={log.inquiryType} size="xs" />
                  ) : (
                    '-'
                  )}
                </Cell>
                <Cell>
                  <div className="flex items-center gap-1.5">
                    {log.previousStatus ? (
                      <StatusBadge status={log.previousStatus} size="xs" />
                    ) : (
                      <span className="text-ink-300">·</span>
                    )}
                    <ArrowRight className="h-3 w-3 text-ink-300" />
                    {log.nextStatus ? (
                      <StatusBadge status={log.nextStatus} size="xs" />
                    ) : (
                      <span className="text-ink-300">·</span>
                    )}
                  </div>
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

function TimelineItem({ log }: { log: LogEvent }) {
  const meta = logEventMeta[log.eventType];
  const toneRing = {
    success: 'bg-brand-100 text-brand-700 ring-brand-50',
    info: 'bg-info-100 text-info-700 ring-info-50',
    warn: 'bg-warn-100 text-warn-700 ring-warn-50',
    danger: 'bg-danger-100 text-danger-700 ring-danger-50',
    violet: 'bg-violet-50 text-violet-600 ring-violet-50',
    neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  }[meta.tone];

  return (
    <li className="relative flex items-start gap-3 py-2">
      <span
        className={cx(
          'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-surface',
          toneRing,
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      <div className="min-w-0 flex-1 rounded-md px-2 py-1.5 transition hover:bg-surface-muted/50">
        <div className="flex items-center gap-2">
          <Pill label={meta.label} tone={meta.tone} size="xs" />
          {log.channel && <ChannelBadge channel={log.channel} size="xs" />}
          {log.inquiryType && <InquiryTypeBadge type={log.inquiryType} size="xs" />}
          {log.processingMode && <ProcessingBadge mode={log.processingMode} size="xs" />}
          <span className="ml-auto font-mono text-[11px] tabular text-ink-400">
            {formatTime(log.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm leading-snug text-ink-800">{log.message}</p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-500">
          {log.inquiryId && (
            <Link
              to={`/inquiries/${log.inquiryId}`}
              className="font-mono hover:text-brand-700"
            >
              {log.inquiryId}
            </Link>
          )}
          {log.previousStatus && log.nextStatus && (
            <span className="inline-flex items-center gap-1">
              <span className="text-ink-400">·</span>
              <StatusBadge status={log.previousStatus} size="xs" />
              <ArrowRight className="h-3 w-3 text-ink-300" />
              <StatusBadge status={log.nextStatus} size="xs" />
            </span>
          )}
          <span className="ml-auto tabular text-ink-400">{formatDateTime(log.createdAt)}</span>
        </div>
      </div>
    </li>
  );
}
