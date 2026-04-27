import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Inbox, Send, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import type { Inquiry, LogEvent } from '../types/domain';
import { Card } from '../components/Card';
import { Cell, Table } from '../components/Table';
import { ChannelBadge, InquiryTypeBadge, StatusBadge } from '../components/Badge';
import { formatShortDate } from '../lib/format';

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

  const stats = useMemo(
    () => ({
      total: inquiries.length,
      review: inquiries.filter((item) => ['review_required', 'draft_ready', 'saved'].includes(item.status)).length,
      auto: inquiries.filter((item) => item.status === 'auto_replied').length,
      sent: inquiries.filter((item) => item.status === 'sent').length,
    }),
    [inquiries],
  );

  if (isLoading) return <p className="text-sm font-bold text-ink-500">대시보드를 불러오는 중입니다...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black text-ink-900">대시보드</h2>
          <p className="mt-2 text-sm text-ink-500">문의 접수부터 발송까지 PoC 운영 상태를 확인합니다.</p>
        </div>
        <Link
          to="/dev/intake"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 focus:shadow-focus"
        >
          Mock 문의 주입
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={<Inbox />} label="전체 문의" value={stats.total} />
        <MetricCard icon={<AlertTriangle />} label="승인 필요" value={stats.review} tone="amber" />
        <MetricCard icon={<Sparkles />} label="자동응답" value={stats.auto} tone="green" />
        <MetricCard icon={<Send />} label="발송 완료" value={stats.sent} tone="blue" />
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-6">
        <Card
          title="현재 미처리 문의 목록"
          description="검토 또는 임시저장이 필요한 문의를 먼저 보여줍니다."
          action={
            <Link to="/inquiries" className="text-sm font-bold text-brand-700">
              전체 보기
            </Link>
          }
        >
          <Table headers={['ID', '고객', '채널', '유형', '요약', '시간', '상태']}>
            {inquiries.slice(0, 5).map((inquiry) => (
              <tr key={inquiry.id} className="hover:bg-ink-50">
                <Cell className="font-bold text-ink-900">
                  <Link to={`/inquiries/${inquiry.id}`}>{inquiry.id}</Link>
                </Cell>
                <Cell>{inquiry.customer.name}</Cell>
                <Cell>
                  <ChannelBadge channel={inquiry.channel} />
                </Cell>
                <Cell>
                  <InquiryTypeBadge type={inquiry.type} />
                </Cell>
                <Cell>{inquiry.summary}</Cell>
                <Cell>{formatShortDate(inquiry.receivedAt)}</Cell>
                <Cell>
                  <StatusBadge status={inquiry.status} />
                </Cell>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="최근 처리 로그" description="상태 변화와 발송 이벤트를 추적합니다.">
          <div className="space-y-4">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="rounded-xl border border-ink-100 bg-ink-50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {formatShortDate(log.createdAt)}
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink-900">{log.message}</p>
                {log.inquiryId && <p className="mt-1 text-xs text-ink-500">{log.inquiryId}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone = 'gray',
}: {
  icon: ReactElement;
  label: string;
  value: number;
  tone?: 'gray' | 'amber' | 'green' | 'blue';
}) {
  const toneClass = {
    gray: 'bg-ink-100 text-ink-700',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-brand-50 text-brand-700',
    blue: 'bg-blue-50 text-blue-600',
  }[tone];

  return (
    <Card className="p-5">
      <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${toneClass}`}>{icon}</div>
      <p className="text-sm font-bold text-ink-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink-900">{value}</p>
    </Card>
  );
}
