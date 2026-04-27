import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../lib/api';
import type { LogEvent } from '../types/domain';
import { Card } from '../components/Card';
import { Field, Input } from '../components/FormControls';
import { Cell, Table } from '../components/Table';
import { ChannelBadge, InquiryTypeBadge, ProcessingBadge, StatusBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime } from '../lib/format';

export function LogsPage() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [query, setQuery] = useState('');
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink-900">로그 조회</h2>
        <p className="mt-2 text-sm text-ink-500">문의 접수, 분류, 초안 생성, 발송까지 처리 이벤트를 추적합니다.</p>
      </div>

      <Card>
        <Field label="로그 검색">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-ink-300" />
            <Input className="pl-10" placeholder="문의 ID 또는 메시지 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </Field>
      </Card>

      <Card title="로그 목록" description={`${logs.length}건의 이벤트가 있습니다.`}>
        {isLoading ? (
          <p className="text-sm font-bold text-ink-500">로그를 불러오는 중입니다...</p>
        ) : logs.length === 0 ? (
          <EmptyState title="검색 결과가 없습니다." />
        ) : (
          <Table headers={['ID', '문의 ID', '채널', '유형', '처리방식', '상태 변화', '메시지', '시간']}>
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-ink-50">
                <Cell className="font-bold text-ink-900">{log.id}</Cell>
                <Cell>{log.inquiryId ?? '-'}</Cell>
                <Cell>{log.channel ? <ChannelBadge channel={log.channel} /> : '-'}</Cell>
                <Cell>{log.inquiryType ? <InquiryTypeBadge type={log.inquiryType} /> : '-'}</Cell>
                <Cell>{log.processingMode ? <ProcessingBadge mode={log.processingMode} /> : '-'}</Cell>
                <Cell>
                  <div className="flex items-center gap-2">
                    {log.previousStatus && <StatusBadge status={log.previousStatus} />}
                    <span className="text-ink-300">→</span>
                    {log.nextStatus && <StatusBadge status={log.nextStatus} />}
                  </div>
                </Cell>
                <Cell className="max-w-sm leading-6">{log.message}</Cell>
                <Cell>{formatDateTime(log.createdAt)}</Cell>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
