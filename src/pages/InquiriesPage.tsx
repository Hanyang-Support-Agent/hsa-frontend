import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../lib/api';
import type { Channel, Inquiry, InquiryStatus, InquiryType } from '../types/domain';
import { channelLabels, inquiryStatusLabels, inquiryTypeLabels } from '../types/domain';
import { Card } from '../components/Card';
import { Cell, Table } from '../components/Table';
import { ChannelBadge, InquiryTypeBadge, ProcessingBadge, StatusBadge } from '../components/Badge';
import { Field, Input, Select } from '../components/FormControls';
import { EmptyState } from '../components/EmptyState';
import { formatDateTime } from '../lib/format';

export function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [channel, setChannel] = useState<Channel | 'all'>('all');
  const [type, setType] = useState<InquiryType | 'all'>('all');
  const [status, setStatus] = useState<InquiryStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await api.listInquiries({ channel, type, status, query });
    setInquiries(data);
    setIsLoading(false);
  }, [channel, query, status, type]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink-900">문의 목록</h2>
        <p className="mt-2 text-sm text-ink-500">채널, 유형, 상태, 검색어를 조합해 처리할 문의를 찾습니다.</p>
      </div>

      <Card>
        <div className="grid grid-cols-[1fr_180px_180px_180px] gap-3">
          <Field label="검색">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-ink-300" />
              <Input className="pl-10" placeholder="고객명, 문의 ID, 요약 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
          </Field>
          <Field label="채널">
            <Select value={channel} onChange={(event) => setChannel(event.target.value as Channel | 'all')}>
              <option value="all">전체</option>
              {Object.entries(channelLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="유형">
            <Select value={type} onChange={(event) => setType(event.target.value as InquiryType | 'all')}>
              <option value="all">전체</option>
              {Object.entries(inquiryTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="상태">
            <Select value={status} onChange={(event) => setStatus(event.target.value as InquiryStatus | 'all')}>
              <option value="all">전체</option>
              {Object.entries(inquiryStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card title="문의 목록" description={`${inquiries.length}건이 조건에 일치합니다.`}>
        {isLoading ? (
          <p className="text-sm font-bold text-ink-500">문의를 불러오는 중입니다...</p>
        ) : inquiries.length === 0 ? (
          <EmptyState title="조건에 맞는 문의가 없습니다." description="필터를 초기화하거나 DEV 수집함에서 mock 문의를 추가하세요." />
        ) : (
          <Table headers={['ID', '채널', '고객', '유형', '처리방식', '요약', '날짜/시간', '상태']}>
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id} className="hover:bg-ink-50">
                <Cell className="font-bold text-ink-900">
                  <Link to={`/inquiries/${inquiry.id}`}>{inquiry.id}</Link>
                </Cell>
                <Cell>
                  <ChannelBadge channel={inquiry.channel} />
                </Cell>
                <Cell>{inquiry.customer.name}</Cell>
                <Cell>
                  <InquiryTypeBadge type={inquiry.type} />
                </Cell>
                <Cell>
                  <ProcessingBadge mode={inquiry.processingMode} />
                </Cell>
                <Cell className="max-w-xs truncate">{inquiry.summary}</Cell>
                <Cell>{formatDateTime(inquiry.receivedAt)}</Cell>
                <Cell>
                  <StatusBadge status={inquiry.status} />
                </Cell>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
