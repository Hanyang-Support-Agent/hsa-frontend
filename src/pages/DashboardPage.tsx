import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock4,
  Inbox,
  Sparkles,
  TerminalSquare,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Inquiry, LogEvent } from '../types/domain';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ChannelMark, InquiryTypeBadge, Pill, StatusBadge } from '../components/Badge';
import { Avatar } from '../components/Avatar';
import { PageHeader } from '../components/PageHeader';
import { Skeleton, SkeletonText } from '../components/Skeleton';
import { cx, formatRelativeTime, formatTime, truncate } from '../lib/format';
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
    const review = inquiries.filter((i) =>
      ['review_required', 'draft_ready', 'classified', 'received'].includes(i.status),
    ).length;
    const auto = inquiries.filter((i) => i.status === 'auto_replied').length;
    const sent = inquiries.filter((i) => i.status === 'sent').length;
    const risk = inquiries.filter((i) => i.status === 'failed' || i.status === 'review_required').length;
    const automationRate = total === 0 ? 0 : Math.round(((auto + sent) / total) * 100);
    return { total, review, auto, sent, risk, automationRate };
  }, [inquiries]);

  const queue = useMemo(
    () =>
      [...inquiries]
        .filter((i) =>
          ['review_required', 'draft_ready', 'classified', 'received', 'saved'].includes(i.status),
        )
        .sort((a, b) => +new Date(a.receivedAt) - +new Date(b.receivedAt))
        .slice(0, 6),
    [inquiries],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <>
            <Sparkles className="h-3 w-3" /> Overview
          </>
        }
        title="AI 문의 운영 센터"
        description="채널에서 들어온 문의를 AI가 분류하고, 자동응답·RAG 초안·운영자 검토로 이어지는 흐름을 한 화면에서 통제합니다."
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

      <section className="overflow-hidden rounded-2xl border border-shell-line bg-shell text-white shadow-xl">
        <div className="relative grid grid-cols-[1.05fr_1.4fr] gap-6 px-6 py-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(34,211,238,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:auto,36px_36px]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-100">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-400" />
              Live AI Control Room
            </p>
            <h2 className="mt-4 max-w-lg text-[32px] font-bold leading-tight tracking-tight">
              오늘 들어온 문의가 어디에서 막히는지 즉시 확인하세요.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-shell-muted">
              자동응답 가능한 문의는 DB 조회로 종료하고, 애매한 문의는 근거 문서가 연결된 초안으로 운영자에게 전달합니다.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link to="/inquiries" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink-900 shadow-lg transition hover:bg-brand-50">
                검토 큐 열기 <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/dev/intake" className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
                Mock 문의 주입
              </Link>
            </div>
          </div>
          <div className="relative grid grid-cols-4 gap-3">
            <MetricCard
              label="전체 문의"
              value={stats.total}
              delta="+12% / 7일"
              tone="neutral"
              icon={<Inbox className="h-3.5 w-3.5" />}
              loading={isLoading}
            />
            <MetricCard
              label="검토 대기"
              value={stats.review}
              subtitle="운영자 액션"
              tone="warn"
              icon={<Clock4 className="h-3.5 w-3.5" />}
              loading={isLoading}
              accent
            />
            <MetricCard
              label="자동응답"
              value={stats.auto}
              subtitle="DB 조회 종료"
              tone="success"
              icon={<Bot className="h-3.5 w-3.5" />}
              loading={isLoading}
            />
            <MetricCard
              label="실패/검토필요"
              value={stats.risk}
              subtitle="관리 필요"
              tone="danger"
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              loading={isLoading}
            />
          </div>
        </div>
      </section>

      {/* Automation rate strip */}
      <Card flush className="overflow-hidden">
        <div className="flex items-center gap-6 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-micro font-semibold uppercase tracking-[0.12em] text-ink-500">
              자동화 비율
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-display tabular leading-none text-ink-900">
                {stats.automationRate}
              </span>
              <span className="text-h3 text-ink-500">%</span>
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                <ArrowUpRight className="h-3.5 w-3.5" /> 지난 주 대비 +5p
              </span>
            </p>
          </div>
          <div className="hidden flex-1 items-center gap-3 sm:flex">
            <Sparkline values={[12, 18, 15, 22, 26, 31, 28, 34, 38, 42, 39, 46]} />
          </div>
          <div className="hidden lg:block">
            <p className="text-right text-xs text-ink-500">자동응답 + 발송 완료</p>
            <p className="text-right text-sm font-medium text-ink-900">
              {stats.auto + stats.sent} / {stats.total} 건
            </p>
          </div>
        </div>
      </Card>

      <PipelinePanel inquiries={inquiries} />

      <div className="grid grid-cols-[1.6fr_1fr] gap-5">
        <Card
          title="처리 큐"
          description="접수 시각이 오래된 순서로, 검토가 필요한 문의입니다."
          action={
            <Link
              to="/inquiries"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600 hover:text-ink-900"
            >
              전체 보기
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          flush
        >
          {isLoading ? (
            <div className="divide-y divide-line">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <SkeletonText lines={2} className="flex-1" />
                </div>
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-ink-500">
              모든 문의가 처리 완료 상태예요. 🎉
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {queue.map((inquiry) => (
                <li key={inquiry.id}>
                  <Link
                    to={`/inquiries/${inquiry.id}`}
                    className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-surface-muted/70"
                  >
                    <ChannelMark channel={inquiry.channel} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {inquiry.summary}
                        </p>
                        <InquiryTypeBadge type={inquiry.type} size="xs" />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        <span className="font-medium text-ink-700">{inquiry.customer.name}</span>{' '}
                        · {truncate(inquiry.body, 60)}
                      </p>
                    </div>
                    <div className="hidden flex-col items-end gap-1.5 md:flex">
                      <StatusBadge status={inquiry.status} size="xs" />
                      <span className="text-[11px] tabular text-ink-500">
                        {formatRelativeTime(inquiry.receivedAt)}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-600" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="최근 활동"
          description="처리 이벤트 타임라인"
          flush
        >
          {isLoading ? (
            <div className="space-y-3 px-5 py-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonText key={i} lines={2} />
              ))}
            </div>
          ) : (
            <ol className="relative px-5 py-2">
              <span className="absolute bottom-3 left-[26px] top-3 w-px bg-line" aria-hidden />
              {logs.slice(0, 6).map((log) => {
                const meta = logEventMeta[log.eventType];
                const toneClass = {
                  success: 'bg-brand-100 text-brand-700 ring-brand-200',
                  info: 'bg-info-100 text-info-700 ring-info-100',
                  warn: 'bg-warn-100 text-warn-700 ring-warn-100',
                  danger: 'bg-danger-100 text-danger-700 ring-danger-100',
                  violet: 'bg-violet-50 text-violet-600 ring-violet-50',
                  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
                }[meta.tone];
                return (
                  <li key={log.id} className="relative flex items-start gap-3 py-3">
                    <span
                      className={cx(
                        'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-surface',
                        toneClass,
                      )}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-xs font-semibold text-ink-900">{meta.label}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-ink-600">
                        {log.message}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] tabular text-ink-400">
                        {log.inquiryId && (
                          <span className="font-mono">{log.inquiryId.slice(-7)}</span>
                        )}
                        <span>·</span>
                        <span>{formatTime(log.createdAt)}</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <ChannelStatCard
          inquiries={inquiries}
          channelKey="kakao"
          label="카카오톡"
        />
        <ChannelStatCard
          inquiries={inquiries}
          channelKey="instagram"
          label="인스타그램"
        />
        <ChannelStatCard
          inquiries={inquiries}
          channelKey="email"
          label="이메일"
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  subtitle?: string;
  delta?: string;
  icon?: ReactNode;
  tone?: 'neutral' | 'warn' | 'success' | 'info' | 'danger';
  accent?: boolean;
  loading?: boolean;
}

function MetricCard({ label, value, subtitle, delta, icon, tone = 'neutral', accent, loading }: MetricCardProps) {
  const toneIcon = {
    neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
    warn: 'bg-warn-50 text-warn-700 ring-warn-100',
    success: 'bg-brand-50 text-brand-700 ring-brand-100',
    info: 'bg-info-50 text-info-700 ring-info-100',
    danger: 'bg-danger-50 text-danger-700 ring-danger-100',
  }[tone];

  return (
    <div
      className={cx(
        'group relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.08] px-4 py-4 text-white shadow-xs backdrop-blur transition hover:bg-white/[0.11]',
        accent ? 'border-warn-100 ring-1 ring-warn-100' : 'border-white/12',
      )}
    >
      {accent && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warn-500 to-transparent opacity-60" />
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-tight text-shell-muted">{label}</p>
        <span className={cx('flex h-6 w-6 items-center justify-center rounded-md ring-1', toneIcon)}>
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <span className="text-display tabular leading-none text-white">{value}</span>
        )}
        <span className="text-h3 text-shell-muted">건</span>
      </div>
      {(subtitle || delta) && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-shell-muted">
          {delta && (
            <span className="inline-flex items-center gap-0.5 text-brand-100">
              <ArrowUpRight className="h-3 w-3" />
              <span className="font-medium tabular">{delta}</span>
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </p>
      )}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 240;
  const h = 36;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-full max-w-[280px]" aria-hidden>
      <defs>
        <linearGradient id="spark-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill="url(#spark-gradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-brand-600)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PipelinePanel({ inquiries }: { inquiries: Inquiry[] }) {
  const steps = [
    {
      label: '1. 유입',
      caption: '카카오 · 인스타 · 이메일',
      count: inquiries.length,
      tone: 'bg-info-500',
    },
    {
      label: '2. AI 분류',
      caption: '배송 · 교환/환불 · 상품 · 기타',
      count: inquiries.filter((i) => i.status !== 'received').length,
      tone: 'bg-violet-500',
    },
    {
      label: '3. 응답 생성',
      caption: 'DB 자동응답 또는 RAG 초안',
      count: inquiries.filter((i) => ['auto_replied', 'draft_ready', 'review_required', 'saved', 'sent'].includes(i.status)).length,
      tone: 'bg-brand-500',
    },
    {
      label: '4. 운영자 액션',
      caption: '검토 · 저장 · 발송',
      count: inquiries.filter((i) => ['draft_ready', 'review_required', 'saved'].includes(i.status)).length,
      tone: 'bg-warn-500',
    },
  ];

  return (
    <Card
      title="문의 처리 파이프라인"
      description="문의가 들어온 뒤 AI 판단과 운영자 액션으로 이어지는 현재 상태입니다."
      flush
      className="overflow-hidden"
    >
      <div className="grid grid-cols-4 divide-x divide-line">
        {steps.map((step, idx) => (
          <div key={step.label} className="relative px-5 py-5">
            {idx < steps.length - 1 && (
              <ArrowRight className="absolute right-[-10px] top-1/2 z-10 h-5 w-5 -translate-y-1/2 rounded-full bg-white p-1 text-ink-300 ring-1 ring-line" />
            )}
            <div className="flex items-center justify-between">
              <span className={cx('h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.8)]', step.tone)} />
              <span className="font-mono text-[11px] tabular text-ink-400">{String(idx + 1).padStart(2, '0')}</span>
            </div>
            <p className="mt-4 text-sm font-bold text-ink-900">{step.label}</p>
            <p className="mt-1 min-h-[32px] text-xs leading-snug text-ink-500">{step.caption}</p>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-h1 tabular text-ink-900">{step.count}</span>
              <span className="text-xs text-ink-400">건</span>
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ChannelStatCard({
  inquiries,
  channelKey,
  label,
}: {
  inquiries: Inquiry[];
  channelKey: 'kakao' | 'instagram' | 'email';
  label: string;
}) {
  const items = inquiries.filter((i) => i.channel === channelKey);
  const auto = items.filter((i) => i.status === 'auto_replied' || i.status === 'sent').length;
  const review = items.filter((i) =>
    ['review_required', 'draft_ready', 'classified', 'received'].includes(i.status),
  ).length;
  const ratio = items.length === 0 ? 0 : Math.round((auto / items.length) * 100);

  return (
    <Card flush>
      <div className="flex items-center gap-3 px-5 py-4">
        <ChannelMark channel={channelKey} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-ink-500">{label}</p>
          <p className="mt-0.5 flex items-baseline gap-1">
            <span className="text-h1 tabular leading-none text-ink-900">{items.length}</span>
            <span className="text-xs text-ink-400">건</span>
          </p>
        </div>
        <div className="text-right">
          <Pill
            label={`자동화 ${ratio}%`}
            tone={ratio >= 50 ? 'success' : ratio >= 20 ? 'info' : 'neutral'}
            size="xs"
          />
          {review > 0 && (
            <p className="mt-1 text-[11px] text-warn-700">검토 {review}건</p>
          )}
        </div>
      </div>
      {items.length > 0 && (
        <div className="border-t border-line bg-surface-muted/40 px-5 py-3">
          <div className="flex items-center gap-2">
            {items.slice(0, 4).map((i) => (
              <Avatar key={i.id} name={i.customer.name} size="sm" className="ring-2 ring-surface" />
            ))}
            {items.length > 4 && (
              <span className="text-[11px] tabular text-ink-500">+{items.length - 4}</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
