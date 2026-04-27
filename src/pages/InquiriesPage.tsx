import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, Search, SortDesc, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Channel, Inquiry, InquiryStatus, InquiryType } from '../types/domain';
import { Card } from '../components/Card';
import { Cell, Row, Table } from '../components/Table';
import {
  ChannelMark,
  InquiryTypeBadge,
  ProcessingBadge,
  StatusBadge,
} from '../components/Badge';
import { FilterChip, Input } from '../components/FormControls';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { Skeleton } from '../components/Skeleton';
import { Avatar } from '../components/Avatar';
import { Kbd } from '../components/Kbd';
import { cx, formatRelativeTime, truncate } from '../lib/format';
import {
  channelMeta,
  inquiryTypeMeta,
  statusMeta,
} from '../lib/meta';

type StatusFilter = 'all' | 'open' | 'auto' | 'sent';

const STATUS_PRESETS: Record<StatusFilter, { label: string; statuses?: InquiryStatus[] }> = {
  all: { label: '전체' },
  open: {
    label: '검토 필요',
    statuses: ['received', 'classified', 'draft_ready', 'review_required', 'saved'],
  },
  auto: { label: '자동응답', statuses: ['auto_replied'] },
  sent: { label: '발송 완료', statuses: ['sent'] },
};

export function InquiriesPage() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [channel, setChannel] = useState<Channel | 'all'>('all');
  const [type, setType] = useState<InquiryType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [focusIdx, setFocusIdx] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await api.listInquiries({ channel, type, query });
    setInquiries(data);
    setIsLoading(false);
  }, [channel, type, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const preset = STATUS_PRESETS[statusFilter];
    if (!preset.statuses) return inquiries;
    return inquiries.filter((i) => preset.statuses!.includes(i.status));
  }, [inquiries, statusFilter]);

  // J/K keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[focusIdx]) {
        navigate(`/inquiries/${filtered[focusIdx].id}`);
      } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById('inquiry-search')?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, focusIdx, navigate]);

  useEffect(() => setFocusIdx(0), [statusFilter, channel, type, query]);

  const hasFilter =
    channel !== 'all' || type !== 'all' || statusFilter !== 'all' || query.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <>
            <Filter className="h-3 w-3" /> Inbox
          </>
        }
        title="문의 처리함"
        description="무엇이 들어왔는지, AI가 어떻게 분류했는지, 지금 자동 처리인지 검토 대상인지 빠르게 판단합니다."
      />

      {/* Filter bar */}
      <Card flush>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              id="inquiry-search"
              placeholder="고객명, 문의 ID, 본문 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9 pr-12"
            />
            <Kbd className="absolute right-2 top-1/2 -translate-y-1/2">/</Kbd>
          </div>
          <div className="hidden items-center gap-1.5 text-xs text-ink-500 lg:flex">
            <Kbd>J</Kbd>
            <Kbd>K</Kbd>
            <span>이동</span>
            <Kbd>↵</Kbd>
            <span>열기</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              상태
            </span>
            {(Object.keys(STATUS_PRESETS) as StatusFilter[]).map((key) => (
              <FilterChip
                key={key}
                active={statusFilter === key}
                onClick={() => setStatusFilter(key)}
              >
                {STATUS_PRESETS[key].label}
              </FilterChip>
            ))}
          </div>

          <div className="h-5 w-px bg-line" />

          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              채널
            </span>
            <FilterChip active={channel === 'all'} onClick={() => setChannel('all')}>
              전체
            </FilterChip>
            {(Object.keys(channelMeta) as Channel[]).map((ch) => (
              <FilterChip
                key={ch}
                active={channel === ch}
                onClick={() => setChannel(ch)}
              >
                <span className={cx('h-1.5 w-1.5 rounded-full', channelMeta[ch].dot)} />
                {channelMeta[ch].label}
              </FilterChip>
            ))}
          </div>

          <div className="h-5 w-px bg-line" />

          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              유형
            </span>
            <FilterChip active={type === 'all'} onClick={() => setType('all')}>
              전체
            </FilterChip>
            {(Object.keys(inquiryTypeMeta) as InquiryType[]).map((t) => (
              <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
                <span className={cx('h-1.5 w-1.5 rounded-full', inquiryTypeMeta[t].dot)} />
                {inquiryTypeMeta[t].label}
              </FilterChip>
            ))}
          </div>

          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                setChannel('all');
                setType('all');
                setStatusFilter('all');
                setQuery('');
              }}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-ink-500 transition hover:text-ink-900"
            >
              <X className="h-3 w-3" /> 필터 초기화
            </button>
          )}
        </div>
      </Card>

      {/* Result */}
      <Card
        flush
        title={
          <span className="flex items-center gap-2">
            결과
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold tabular text-ink-700">
              {filtered.length}
            </span>
          </span>
        }
        action={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900"
          >
            <SortDesc className="h-3.5 w-3.5" /> 최신순
          </button>
        }
      >
        {isLoading ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-3.5 flex-1" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10">
            <EmptyState
              compact
              title="조건에 맞는 문의가 없어요"
              description="필터를 초기화하거나 DEV 수집함에서 mock 문의를 추가해 보세요."
            />
          </div>
        ) : (
          <Table
            headers={[
              { label: '유입 문의', width: '40%' },
              { label: 'AI 분류', width: '150px' },
              { label: '신뢰도', width: '120px' },
              { label: '처리 상태', width: '150px' },
              { label: '다음 액션', width: '150px' },
              { label: '접수', width: '110px', align: 'right' },
            ]}
          >
            {filtered.map((inquiry, idx) => (
              <Row
                key={inquiry.id}
                clickable
                selected={idx === focusIdx}
                onClick={() => navigate(`/inquiries/${inquiry.id}`)}
                onMouseEnter={() => setFocusIdx(idx)}
              >
                <Cell className="relative">
                  {/* priority indicator */}
                  <span
                    className={cx(
                      'absolute inset-y-0 left-0 w-0.5',
                      statusMeta[inquiry.status].dot,
                    )}
                  />
                  <div className="flex min-w-0 items-center gap-3 pl-2">
                    <ChannelMark channel={inquiry.channel} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/inquiries/${inquiry.id}`}
                          className="truncate text-sm font-semibold text-ink-900 hover:text-brand-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {inquiry.summary}
                        </Link>
                        <span className="font-mono text-[10.5px] text-ink-400">
                          {inquiry.id.slice(-7)}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-500">
                        <Avatar name={inquiry.customer.name} size="sm" className="!h-4 !w-4 !text-[9px]" />
                        <span className="font-medium text-ink-700">{inquiry.customer.name}</span>
                        <span>·</span>
                        <span className="truncate">{truncate(inquiry.body, 80)}</span>
                      </p>
                    </div>
                  </div>
                </Cell>
                <Cell>
                  <div className="space-y-1.5">
                    <InquiryTypeBadge type={inquiry.type} size="xs" />
                    <p className="text-[11px] leading-snug text-ink-500">
                      {classificationCopy(inquiry.type)}
                    </p>
                  </div>
                </Cell>
                <Cell>
                  <ConfidenceMeter value={inquiry.confidenceScore} />
                </Cell>
                <Cell>
                  <div className="flex flex-col items-start gap-1.5">
                    <StatusBadge status={inquiry.status} size="xs" />
                    <ProcessingBadge mode={inquiry.processingMode} size="xs" />
                  </div>
                </Cell>
                <Cell>
                  <NextAction status={inquiry.status} />
                </Cell>
                <Cell align="right" className="tabular text-xs text-ink-500">
                  {formatRelativeTime(inquiry.receivedAt)}
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = pct >= 90 ? 'bg-brand-500' : pct >= 75 ? 'bg-info-500' : pct >= 60 ? 'bg-warn-500' : 'bg-danger-500';
  return (
    <div className="w-full max-w-[92px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold tabular text-ink-800">{pct}%</span>
        <span className="text-[10px] font-medium text-ink-400">AI</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
        <div className={cx('h-full rounded-full', tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function NextAction({ status }: { status: InquiryStatus }) {
  const copy: Record<InquiryStatus, { label: string; tone: string }> = {
    received: { label: '분류 확인', tone: 'text-info-700 bg-info-50' },
    classified: { label: '초안 생성 대기', tone: 'text-violet-600 bg-violet-50' },
    auto_replied: { label: '모니터링', tone: 'text-brand-700 bg-brand-50' },
    draft_ready: { label: '초안 검토', tone: 'text-violet-600 bg-violet-50' },
    review_required: { label: '관리자 검토', tone: 'text-warn-700 bg-warn-50' },
    saved: { label: '발송 결정', tone: 'text-ink-700 bg-ink-100' },
    sent: { label: '완료', tone: 'text-brand-800 bg-brand-100' },
    failed: { label: '원인 확인', tone: 'text-danger-700 bg-danger-50' },
  };
  return (
    <span className={cx('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold', copy[status].tone)}>
      {copy[status].label}
    </span>
  );
}

function classificationCopy(type: InquiryType) {
  const copy: Record<InquiryType, string> = {
    shipping: '배송 DB 조회 가능성 확인',
    exchange_refund: '정책 근거 검토 필요',
    product: '상품/FAQ 문서 참조',
    other: '운영자 판단 필요',
  };
  return copy[type];
}
