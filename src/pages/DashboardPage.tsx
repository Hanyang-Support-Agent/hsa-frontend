import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  AlertTriangle,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock4,
  FileText,
  Inbox,
  Route,
  ShieldCheck,
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
    const review = inquiries.filter((i) =>
      ['review_required', 'draft_ready', 'classified', 'received'].includes(i.status),
    ).length;
    const auto = inquiries.filter((i) => i.status === 'auto_replied').length;
    const sent = inquiries.filter((i) => i.status === 'sent').length;
    const risk = inquiries.filter((i) => i.status === 'failed' || i.status === 'review_required').length;
    const automationRate = total === 0 ? 0 : Math.round(((auto + sent) / total) * 100);
    const classified = inquiries.filter((i) => i.status !== 'received').length;
    const generated = inquiries.filter((i) =>
      ['auto_replied', 'draft_ready', 'review_required', 'saved', 'sent'].includes(i.status),
    ).length;
    return { total, review, auto, sent, risk, automationRate, classified, generated };
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

  const oldestQueueItem = queue[0];
  const heroSentence =
    stats.review > 0
      ? `AI가 ${stats.classified}건의 문의를 분류했고, ${stats.review}건은 운영자 검토를 기다리고 있습니다.`
      : `AI가 ${stats.classified}건의 문의를 분류했고, 현재 검토 대기 중인 문의는 없습니다.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <>
            <Sparkles className="h-3 w-3" /> Overview
          </>
        }
        title="AI 응답 관제실"
        description="반복 문의는 AI가 처리하고, 애매한 문의는 근거와 함께 운영자에게 전달됩니다."
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
        <div className="relative grid grid-cols-[1.15fr_0.85fr] gap-8 px-7 py-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.24),transparent_30%),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,36px_36px,36px_36px]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-400/10 px-3 py-1 text-xs font-semibold text-brand-100">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-400" />
              Calm Intelligence · Live Queue
            </p>
            <p className="mt-5 max-w-2xl text-[17px] font-semibold leading-relaxed text-brand-50">
              {heroSentence}
            </p>
            <div className="mt-6 flex items-end gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-shell-muted">
                  운영자 검토 필요
                </p>
                <span className="mt-2 inline-flex h-6 items-center rounded-full border border-warn-400/25 bg-warn-500/15 px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-warn-100">
                  High Priority Queue
                </span>
                <p className="mt-2 flex items-baseline gap-2">
                  {isLoading ? (
                    <Skeleton className="h-20 w-28 bg-white/10" />
                  ) : (
                    <span className="text-[92px] font-black leading-none tracking-tight text-white">
                      {stats.review}
                    </span>
                  )}
                  <span className="pb-2 text-xl font-bold text-shell-muted">건</span>
                </p>
              </div>
              <div className="mb-2 h-14 w-px bg-white/12" />
              <div className="mb-1 min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-shell-muted">
                  가장 오래 대기 중
                </p>
                {oldestQueueItem ? (
                  <Link to={`/inquiries/${oldestQueueItem.id}`} className="group mt-2 block max-w-lg">
                    <p className="truncate text-lg font-bold text-white group-hover:text-brand-100">
                      {oldestQueueItem.summary}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-shell-muted">
                      <span>{oldestQueueItem.customer.name} 고객</span>
                      <span>·</span>
                      <span>{formatRelativeTime(oldestQueueItem.receivedAt)} 대기</span>
                      <span>·</span>
                      <span>AI 신뢰도 {Math.round(oldestQueueItem.confidenceScore * 100)}%</span>
                    </p>
                  </Link>
                ) : (
                  <p className="mt-2 text-sm text-shell-muted">
                    현재 운영자 판단을 기다리는 문의가 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-shell-muted">
                Next Best Action
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-tight text-white">
                {stats.review > 0 ? '가장 오래 대기한 문의부터 처리하세요.' : '모든 문의가 안정적으로 처리 중입니다.'}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-shell-muted">
                {stats.review > 0
                  ? 'AI가 유형과 근거를 정리했습니다. 운영자는 최종 판단에만 집중하면 됩니다.'
                  : '새 문의가 들어오면 AI가 분류, 자동응답, 초안 생성을 순서대로 진행합니다.'}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Link to="/inquiries" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink-900 shadow-lg transition hover:bg-brand-50">
                검토 큐 열기 <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/dev/intake" className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
                Mock 문의 주입
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-5 gap-3">
        <PulseMetricCard
          label="오늘 유입량"
          value={stats.total}
          unit="건"
          caption="전체 채널에서 감지된 문의"
          tone="neutral"
          icon={<Inbox className="h-4 w-4" />}
          loading={isLoading}
        />
        <PulseMetricCard
          label="운영자 판단 필요"
          value={stats.review}
          unit="건"
          caption="우선순위 큐에 남은 문의"
          tone="warn"
          icon={<Clock4 className="h-4 w-4" />}
          loading={isLoading}
          emphasis
        />
        <PulseMetricCard
          label="AI가 해결한 문의"
          value={stats.auto + stats.sent}
          unit="건"
          caption="자동응답 + 발송 완료"
          tone="success"
          icon={<ShieldCheck className="h-4 w-4" />}
          loading={isLoading}
        />
        <PulseMetricCard
          label="주의가 필요한 흐름"
          value={stats.risk}
          unit="건"
          caption="실패 또는 검토필요 상태"
          tone="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
          loading={isLoading}
        />
        <PulseMetricCard
          label="AI 처리 효율"
          value={stats.automationRate}
          unit="%"
          caption="반복 문의 자동화 체감치"
          tone="info"
          icon={<Bot className="h-4 w-4" />}
          loading={isLoading}
        />
      </div>

      <PipelinePanel inquiries={inquiries} />

      <div className="grid grid-cols-[1.6fr_1fr] gap-5">
        <Card
          title="검토 큐"
          description="우선순위와 다음 액션 기준으로 정렬된 검토 목록입니다."
          action={
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 items-center rounded-full border border-line bg-surface-muted px-2.5 text-[11px] font-semibold text-ink-600">
                정렬: 오래 대기한 문의 먼저
              </span>
              <Link
                to="/inquiries"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600 hover:text-ink-900"
              >
                전체 보기
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          }
          flush
        >
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-white/70 px-4 py-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <SkeletonText lines={2} className="flex-1" />
                </div>
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-bold text-ink-900">현재 검토 대기 중인 문의가 없습니다.</p>
              <p className="mt-1 text-xs text-ink-500">AI가 모든 문의를 정상 처리했습니다.</p>
            </div>
          ) : (
            <ul className="space-y-3 p-4">
              {queue.map((inquiry) => (
                <li key={inquiry.id}>
                  <QueueCaseCard inquiry={inquiry} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="운영 타임라인"
          description="AI와 운영자가 남긴 처리 흐름"
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
              {logs.slice(0, 6).map((log) => <ActivityTimelineItem key={log.id} log={log} />)}
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

interface PulseMetricCardProps {
  label: string;
  value: number;
  unit: string;
  caption: string;
  icon?: ReactNode;
  tone?: 'neutral' | 'warn' | 'success' | 'info' | 'danger';
  emphasis?: boolean;
  loading?: boolean;
}

function PulseMetricCard({
  label,
  value,
  unit,
  caption,
  icon,
  tone = 'neutral',
  emphasis,
  loading,
}: PulseMetricCardProps) {
  const toneMeta = {
    neutral: {
      panel: 'border-line bg-white/86',
      icon: 'bg-ink-100 text-ink-600 ring-ink-200',
      bar: 'bg-ink-400',
    },
    warn: {
      panel: 'border-warn-100 bg-warn-50/80 ring-1 ring-warn-100',
      icon: 'bg-warn-100 text-warn-700 ring-warn-100',
      bar: 'bg-warn-500',
    },
    success: {
      panel: 'border-brand-100 bg-brand-50/70',
      icon: 'bg-brand-100 text-brand-700 ring-brand-100',
      bar: 'bg-brand-500',
    },
    info: {
      panel: 'border-info-100 bg-info-50/72',
      icon: 'bg-info-100 text-info-700 ring-info-100',
      bar: 'bg-info-500',
    },
    danger: {
      panel: 'border-danger-100 bg-danger-50/70',
      icon: 'bg-danger-100 text-danger-700 ring-danger-100',
      bar: 'bg-danger-500',
    },
  }[tone];

  return (
    <div
      className={cx(
        'group relative min-h-[132px] overflow-hidden rounded-xl border px-4 py-4 shadow-xs backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md',
        toneMeta.panel,
        emphasis && 'shadow-md',
      )}
    >
      <span className={cx('absolute inset-x-0 top-0 h-1', toneMeta.bar)} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-tight text-ink-600">{label}</p>
        <span className={cx('flex h-7 w-7 items-center justify-center rounded-lg ring-1', toneMeta.icon)}>
          {icon}
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <span className="text-display tabular leading-none text-ink-900">{value}</span>
        )}
        <span className="text-sm font-bold text-ink-400">{unit}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-snug text-ink-500">{caption}</p>
    </div>
  );
}

function QueueCaseCard({ inquiry }: { inquiry: Inquiry }) {
  const priority = priorityMeta(inquiry);
  const evidence = evidenceCopy(inquiry);
  const next = nextActionCopy(inquiry);
  const confidence = Math.round(inquiry.confidenceScore * 100);
  const aiJudgement = confidenceJudgement(inquiry);

  return (
    <Link
      to={`/inquiries/${inquiry.id}`}
      className="group block rounded-2xl border border-line bg-white/82 p-4 shadow-xs backdrop-blur transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <ChannelMark channel={inquiry.channel} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <InquiryTypeBadge type={inquiry.type} size="xs" />
            <StatusBadge status={inquiry.status} size="xs" />
            <span className={cx('inline-flex h-5 items-center rounded-full px-2 text-[11px] font-bold', priority.className)}>
              {priority.label}
            </span>
          </div>
          <h3 className="mt-2 truncate text-base font-bold tracking-tight text-ink-900 group-hover:text-brand-800">
            {inquiry.summary}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-600">
            {caseSummary(inquiry)}
          </p>
        </div>
        <div className="hidden shrink-0 text-right xl:block">
          <p className="text-[11px] font-semibold uppercase text-ink-400">대기 시간</p>
          <p className="mt-1 text-sm font-bold tabular text-ink-900">
            {formatRelativeTime(inquiry.receivedAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-3 rounded-xl border border-line bg-surface-muted/70 px-3 py-2.5">
        <CaseSignal icon={<Activity className="h-3.5 w-3.5" />} label="AI 판단" value={`${confidence}% 확신 · ${aiJudgement}`} />
        <CaseSignal icon={<BookOpen className="h-3.5 w-3.5" />} label="근거" value={evidence} />
        <CaseSignal icon={<Route className="h-3.5 w-3.5" />} label="다음 액션" value={next} />
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink-900 px-3 text-xs font-bold text-white shadow-sm transition group-hover:bg-brand-700">
          {priority.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function CaseSignal({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-ink-400">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-semibold text-ink-800">{value}</p>
    </div>
  );
}

function ActivityTimelineItem({ log }: { log: LogEvent }) {
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
    <li className="relative flex items-start gap-3 py-3">
      <span
        className={cx(
          'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-surface',
          toneClass,
        )}
      >
        <CheckCircle2 className="h-3 w-3" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="flex items-center gap-2 text-xs font-bold text-ink-900">
          <span className="font-mono tabular text-ink-500">{formatTime(log.createdAt)}</span>
          {meta.label}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-600">
          {narrativeLogMessage(log)}
        </p>
        {log.inquiryId && (
          <Link
            to={`/inquiries/${log.inquiryId}`}
            className="mt-1 inline-flex font-mono text-[11px] text-ink-400 hover:text-brand-700"
          >
            {log.inquiryId}
          </Link>
        )}
      </div>
    </li>
  );
}

function PipelinePanel({ inquiries }: { inquiries: Inquiry[] }) {
  const steps = [
    {
      label: 'Incoming',
      title: '문의 유입',
      caption: '카카오 · 인스타 · 이메일',
      count: inquiries.length,
      tone: 'info',
      icon: <Inbox className="h-5 w-5" />,
    },
    {
      label: 'Classified',
      title: 'AI 분류',
      caption: '유형과 우선순위 감지',
      count: inquiries.filter((i) => i.status !== 'received').length,
      tone: 'violet',
      icon: <Bot className="h-5 w-5" />,
    },
    {
      label: 'Response',
      title: '응답 생성',
      caption: 'DB 자동응답 또는 RAG 초안',
      count: inquiries.filter((i) => ['auto_replied', 'draft_ready', 'review_required', 'saved', 'sent'].includes(i.status)).length,
      tone: 'success',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: 'Human Loop',
      title: '운영자 액션',
      caption: '검토 · 저장 · 발송',
      count: inquiries.filter((i) => ['draft_ready', 'review_required', 'saved'].includes(i.status)).length,
      tone: 'warn',
      icon: <Activity className="h-5 w-5" />,
    },
  ];
  const bottleneck = steps[3].count > 0 ? steps[3] : steps[2];

  return (
    <Card
      title="Response Pipeline"
      description="문의 흐름과 병목 지점을 한눈에 확인합니다."
      flush
      className="overflow-hidden"
    >
      <div className="grid grid-cols-[1fr_240px] gap-0">
        <div className="relative flex items-center gap-0 px-6 py-7">
          <span className="absolute left-[84px] right-[84px] top-[58px] h-px bg-line" />
          <span className="absolute left-[84px] right-[84px] top-[58px] h-px bg-gradient-to-r from-info-500 via-violet-500 to-warn-500 opacity-45" />
          {steps.map((step, idx) => (
            <div key={step.label} className="relative z-10 flex flex-1 flex-col items-center text-center">
              <FlowNode step={step} active={step.count > 0} highlighted={step.label === bottleneck.label && step.count > 0} />
              {idx < steps.length - 1 && (
                <ArrowRight className="absolute right-[-10px] top-[27px] h-5 w-5 rounded-full bg-white p-1 text-ink-300 ring-1 ring-line" />
              )}
            </div>
          ))}
        </div>
        <div className="border-l border-line bg-surface-muted/60 px-5 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">현재 병목</p>
          <p className="mt-2 text-h2 text-ink-900">{bottleneck.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            {bottleneck.count > 0
              ? `${bottleneck.count}건이 이 단계에 머물러 있습니다.`
              : '현재 병목 구간 없이 안정적으로 처리 중입니다.'}
          </p>
          <div className="mt-4 rounded-xl border border-line bg-white px-3 py-3">
            <p className="text-xs font-bold text-ink-900">Flow Summary</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              {steps[0].count} Incoming → {steps[1].count} Classified → {steps[2].count} Response → {steps[3].count} Human Loop
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function FlowNode({
  step,
  active,
  highlighted,
}: {
  step: {
    label: string;
    title: string;
    caption: string;
    count: number;
    tone: string;
    icon: ReactNode;
  };
  active?: boolean;
  highlighted?: boolean;
}) {
  const toneClass: Record<string, { node: string; wash: string; text: string }> = {
    info: { node: 'bg-info-500 text-white', wash: 'bg-info-50', text: 'text-info-700' },
    violet: { node: 'bg-violet-500 text-white', wash: 'bg-violet-50', text: 'text-violet-600' },
    success: { node: 'bg-brand-500 text-white', wash: 'bg-brand-50', text: 'text-brand-700' },
    warn: { node: 'bg-warn-500 text-white', wash: 'bg-warn-50', text: 'text-warn-700' },
  };
  const tone = toneClass[step.tone] ?? toneClass.info;

  return (
    <>
      <span
        className={cx(
          'flex h-14 w-14 items-center justify-center rounded-2xl shadow-md ring-8 ring-white transition',
          active ? tone.node : 'bg-ink-100 text-ink-400',
          highlighted && 'scale-110 shadow-lg ring-warn-100 shadow-warn-500/20',
        )}
      >
        {step.icon}
      </span>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">{step.label}</p>
      <p className="mt-1 text-sm font-bold text-ink-900">{step.title}</p>
      <p className="mt-1 min-h-[32px] max-w-[120px] text-xs leading-snug text-ink-500">{step.caption}</p>
      <span className={cx('mt-3 inline-flex h-7 min-w-12 items-center justify-center rounded-full px-3 text-sm font-black tabular', tone.wash, tone.text)}>
        {step.count}
      </span>
    </>
  );
}

function priorityMeta(inquiry: Inquiry) {
  if (inquiry.status === 'failed') {
    return { label: '즉시 개입', className: 'bg-danger-50 text-danger-700', cta: '즉시 확인' };
  }
  if (inquiry.status === 'review_required') {
    return { label: '우선순위 높음', className: 'bg-warn-50 text-warn-700', cta: '우선 검토' };
  }
  if (inquiry.confidenceScore < 0.7) {
    return { label: '확인 필요', className: 'bg-info-50 text-info-700', cta: '확인하기' };
  }
  return { label: '일반 검토', className: 'bg-ink-100 text-ink-700', cta: '검토하기' };
}

function evidenceCopy(inquiry: Inquiry) {
  if (inquiry.draft?.sources.length) return `근거 ${inquiry.draft.sources.length}건 연결`;
  if (inquiry.autoReplyText) return 'DB 조회 완료';
  return '근거 확인 필요';
}

function nextActionCopy(inquiry: Inquiry) {
  if (inquiry.status === 'draft_ready') return '초안 검토 후 발송';
  if (inquiry.status === 'review_required') return '정책/주문 조건 확인';
  if (inquiry.status === 'saved') return '최종 발송 결정';
  if (inquiry.status === 'received' || inquiry.status === 'classified') return 'AI 판단 결과 확인';
  if (inquiry.status === 'failed') return '실패 원인 확인';
  return '모니터링';
}

function confidenceJudgement(inquiry: Inquiry) {
  if (inquiry.confidenceScore < 0.7) return '운영자 확인 필요';
  if (inquiry.draft?.sources.length) return '정책 근거 확인됨';
  if (inquiry.autoReplyText) return 'DB 조회 완료';
  if (inquiry.status === 'draft_ready' || inquiry.status === 'review_required') return '초안 검토 권장';
  return '안정적';
}

function caseSummary(inquiry: Inquiry) {
  const name = `${inquiry.customer.name} 고객님`;
  const copy: Record<Inquiry['type'], string> = {
    shipping: `${name}이 주문 배송 상태와 도착 일정을 문의했습니다.`,
    exchange_refund: `${name}이 교환/환불 가능 여부와 처리 절차를 문의했습니다.`,
    product: `${name}이 상품 정보, 옵션 또는 관리 방법을 문의했습니다.`,
    other: `${name}이 추가 확인이 필요한 문의를 남겼습니다.`,
  };
  return copy[inquiry.type];
}

function narrativeLogMessage(log: LogEvent) {
  const fallback = log.message;
  const narratives: Partial<Record<LogEvent['eventType'], string>> = {
    auto_replied: 'AI가 배송 DB를 조회하고 고객에게 자동응답을 발송했습니다.',
    draft_generated: 'AI가 정책/상품 문서를 확인해 운영자가 검토할 답변 초안을 만들었습니다.',
    response_sent: '운영자가 초안을 확인한 뒤 최종 답변을 고객에게 발송했습니다.',
    draft_saved: '운영자가 답변 문구를 다듬고 임시저장했습니다.',
    review_required: '운영자가 추가 판단이 필요하다고 표시했습니다.',
    document_uploaded: '새로운 지식 문서가 RAG 근거 후보로 등록되었습니다.',
    document_deleted: '사용하지 않는 지식 문서가 목록에서 제거되었습니다.',
  };
  return narratives[log.eventType] ?? fallback;
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
  const channelCopy = {
    kakao: '빠른 응답이 중요한 실시간 문의 채널입니다.',
    instagram: '상품과 재입고 문의가 가볍게 들어오는 DM 채널입니다.',
    email: '환불, 매장, 상세 조건 확인이 많은 장문 문의 채널입니다.',
  }[channelKey];
  const dominantType = dominantInquiryType(items);

  return (
    <Card flush className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3 px-5 py-4">
        <ChannelMark channel={channelKey} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink-900">{label}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">{channelCopy}</p>
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase text-ink-400">주요 문의 성격</p>
              <p className="mt-0.5 text-xs font-semibold text-ink-700">{dominantType}</p>
            </div>
            <div className="flex items-center gap-2">
              {items.slice(0, 4).map((i) => (
                <Avatar key={i.id} name={i.customer.name} size="sm" className="ring-2 ring-surface" />
              ))}
              {items.length > 4 && (
                <span className="text-[11px] tabular text-ink-500">+{items.length - 4}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function dominantInquiryType(items: Inquiry[]) {
  if (items.length === 0) return '아직 유입 없음';
  const counts = items.reduce<Record<Inquiry['type'], number>>(
    (acc, item) => ({ ...acc, [item.type]: acc[item.type] + 1 }),
    { shipping: 0, exchange_refund: 0, product: 0, other: 0 },
  );
  const [type] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] as [Inquiry['type'], number];
  const labels: Record<Inquiry['type'], string> = {
    shipping: '배송 상태 확인 중심',
    exchange_refund: '교환/환불 정책 확인 중심',
    product: '상품 정보와 재입고 문의 중심',
    other: '운영자 판단이 필요한 기타 문의',
  };
  return labels[type];
}
