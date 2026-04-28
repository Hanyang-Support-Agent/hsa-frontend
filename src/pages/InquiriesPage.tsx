import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Filter, Search, SortDesc, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Channel, Inquiry, InquiryStatus, InquiryType } from '../types/domain';
import { Card } from '../components/Card';
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
import { Kbd } from '../components/Kbd';
import { cx, formatRelativeTime } from '../lib/format';
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
            <Filter className="h-3 w-3" /> Review Inbox
          </>
        }
        title="AI 검토함"
        description="검토가 필요한 문의부터 빠르게 확인하고 응답을 마무리하세요."
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
          <div>
            <span className="flex items-center gap-2">
              Review Queue
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold tabular text-ink-700">
                {filtered.length}
              </span>
            </span>
            <p className="mt-1 text-xs font-normal text-ink-500">
              현재 조건에 맞는 문의 {filtered.length}건
            </p>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface-muted px-2.5 text-[11px] font-semibold text-ink-600">
              <SortDesc className="h-3.5 w-3.5" />
              우선순위순
            </span>
            <span className="hidden h-7 items-center gap-1.5 rounded-full border border-line bg-white px-2.5 text-[11px] font-semibold text-ink-500 xl:inline-flex">
              <Kbd>J</Kbd>/<Kbd>K</Kbd> 이동 · <Kbd>↵</Kbd> 열기 · <Kbd>/</Kbd> 검색
            </span>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-white/80 px-4 py-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
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
          <div className="p-4">
            <div className="grid grid-cols-[minmax(360px,1.45fr)_180px_140px_150px_170px_90px] gap-3 px-4 pb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-400">
              <span>문의</span>
              <span>AI 판단</span>
              <span>신뢰도</span>
              <span>상태</span>
              <span>다음 액션</span>
              <span className="text-right">대기</span>
            </div>
            <div className="space-y-2.5">
              {filtered.map((inquiry, idx) => (
                <InquiryQueueRow
                  key={inquiry.id}
                  inquiry={inquiry}
                  selected={idx === focusIdx}
                  onFocus={() => setFocusIdx(idx)}
                  onOpen={() => navigate(`/inquiries/${inquiry.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function InquiryQueueRow({
  inquiry,
  selected,
  onFocus,
  onOpen,
}: {
  inquiry: Inquiry;
  selected?: boolean;
  onFocus: () => void;
  onOpen: () => void;
}) {
  const action = nextActionCopy(inquiry);
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={onFocus}
      className={cx(
        'group relative grid w-full grid-cols-[minmax(360px,1.45fr)_180px_140px_150px_170px_90px] items-center gap-3 rounded-2xl border bg-white/86 px-4 py-3.5 text-left shadow-xs backdrop-blur transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-md',
        selected ? 'border-brand-100 ring-1 ring-brand-100' : 'border-line',
      )}
    >
      <span className={cx('absolute inset-y-4 left-0 w-1 rounded-r-full', statusMeta[inquiry.status].dot)} />
      <div className="flex min-w-0 items-center gap-3 pl-2">
        <ChannelMark channel={inquiry.channel} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-ink-900 group-hover:text-brand-800">
              {inquiry.summary}
            </p>
            <span className="font-mono text-[10.5px] text-ink-400">{inquiry.id}</span>
          </div>
          <p className="mt-1 truncate text-xs leading-snug text-ink-500">
            <span className="font-semibold text-ink-700">{inquiry.customer.name} 고객</span>
            <span className="mx-1.5 text-ink-300">·</span>
            {inquiryListSummary(inquiry)}
          </p>
        </div>
      </div>
      <div className="min-w-0 space-y-1.5">
        <InquiryTypeBadge type={inquiry.type} size="xs" />
        <p className="truncate text-[11px] font-medium leading-snug text-ink-500">
          {classificationCopy(inquiry)}
        </p>
      </div>
      <ConfidenceMeter inquiry={inquiry} />
      <div className="flex flex-col items-start gap-1.5">
        <StatusBadge status={inquiry.status} size="xs" />
        <ProcessingBadge mode={inquiry.processingMode} size="xs" />
      </div>
      <span className={cx('inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition group-hover:shadow-sm', action.tone)}>
        {action.label}
        <ArrowRight className="h-3.5 w-3.5 opacity-70" />
      </span>
      <span className="text-right text-xs font-semibold tabular text-ink-500">
        {formatRelativeTime(inquiry.receivedAt)}
      </span>
    </button>
  );
}

function ConfidenceMeter({ inquiry }: { inquiry: Inquiry }) {
  const value = inquiry.confidenceScore;
  const pct = Math.round(value * 100);
  const tone = pct >= 90 ? 'bg-brand-500' : pct >= 75 ? 'bg-info-500' : pct >= 60 ? 'bg-warn-500' : 'bg-danger-500';
  const label = confidenceLabel(inquiry);
  return (
    <div className="w-full max-w-[116px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold tabular text-ink-800">{pct}%</span>
        <span className="text-[10px] font-semibold text-ink-500">{label.short}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
        <div className={cx('h-full rounded-full', tone)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 truncate text-[11px] font-medium text-ink-500">{label.detail}</p>
    </div>
  );
}

function nextActionCopy(inquiry: Inquiry) {
  if (inquiry.status === 'failed') return { label: '원인 확인', tone: 'bg-danger-600 text-white' };
  if (inquiry.status === 'review_required' && inquiry.type === 'exchange_refund') {
    return { label: '환불 조건 확인', tone: 'bg-danger-50 text-danger-700 hover:bg-danger-100' };
  }
  if (inquiry.status === 'review_required') {
    return { label: '정책 조건 확인', tone: 'bg-danger-50 text-danger-700 hover:bg-danger-100' };
  }
  if (inquiry.status === 'draft_ready') return { label: '초안 확인 후 발송', tone: 'bg-warn-50 text-warn-700 hover:bg-warn-100' };
  if (inquiry.status === 'saved') return { label: '최종 발송', tone: 'bg-ink-900 text-white hover:bg-ink-800' };
  if (inquiry.status === 'received' || inquiry.status === 'classified') return { label: '문의 유형 재확인', tone: 'bg-info-50 text-info-700 hover:bg-info-100' };
  if (inquiry.status === 'auto_replied') return { label: '자동응답 확인', tone: 'bg-brand-50 text-brand-700 hover:bg-brand-100' };
  return { label: '처리 완료', tone: 'bg-brand-100 text-brand-800 hover:bg-brand-100' };
}

function classificationCopy(inquiry: Inquiry) {
  const copy: Record<InquiryType, string> = {
    shipping: inquiry.orderId ? '배송 · DB 조회 가능' : '배송 · 주문 식별 필요',
    exchange_refund: '교환/환불 · 정책 근거 필요',
    product: '상품 · FAQ/상품 문서 참조',
    other: '기타 · 운영자 판단 필요',
  };
  return copy[inquiry.type];
}

function inquiryListSummary(inquiry: Inquiry) {
  if (inquiry.type === 'shipping' && inquiry.body.includes('여러')) {
    return '여러 주문 중 현재 배송 중인 송장번호 확인을 요청했습니다.';
  }
  const copy: Record<InquiryType, string> = {
    shipping: '주문 배송 상태와 예상 도착일을 문의했습니다.',
    exchange_refund: '수령한 상품의 핏/사이즈 차이로 교환·환불 가능 여부를 문의했습니다.',
    product: '상품 옵션, 재입고 또는 관리 방법을 문의했습니다.',
    other: inquiry.body.includes('매장')
      ? '서울 오프라인 매장 방문 가능 여부를 문의했습니다.'
      : '운영자 확인이 필요한 기타 문의를 남겼습니다.',
  };
  return copy[inquiry.type];
}

function confidenceLabel(inquiry: Inquiry) {
  const pct = Math.round(inquiry.confidenceScore * 100);
  if (pct >= 90) return { short: '높음', detail: inquiry.draft?.sources.length ? '근거 확인됨' : '자동화 가능' };
  if (pct >= 75) return { short: '검토 권장', detail: inquiry.draft?.sources.length ? '정책 근거 확인' : '초안 확인 필요' };
  if (pct >= 60) return { short: '확인 필요', detail: '운영자 판단 필요' };
  return { short: '낮음', detail: '근거 확인 필요' };
}
