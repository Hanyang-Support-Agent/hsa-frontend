import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { api } from '../lib/api';
import type { Inquiry } from '../types/domain';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ChannelBadge, InquiryTypeBadge, ProcessingBadge, StatusBadge } from '../components/Badge';
import { Textarea } from '../components/FormControls';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/ToastContext';
import { formatDateTime } from '../lib/format';
import { documentTypeLabels } from '../types/domain';

export function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [finalText, setFinalText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const data = await api.getInquiry(id);
    setInquiry(data);
    setFinalText(data.draft?.finalText ?? data.draft?.draftText ?? data.autoReplyText ?? '');
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    if (!inquiry) return;
    setIsSaving(true);
    const next = await api.saveDraft(inquiry.id, finalText);
    setInquiry(next);
    setIsSaving(false);
    showToast('답변을 임시저장했습니다.');
  }

  async function handleSend() {
    if (!inquiry) return;
    setIsSaving(true);
    const next = await api.sendResponse(inquiry.id, finalText);
    setInquiry(next);
    setIsSaving(false);
    showToast('최종 답변을 발송 처리했습니다.');
  }

  if (isLoading) return <p className="text-sm font-bold text-ink-500">문의 상세를 불러오는 중입니다...</p>;
  if (!inquiry) return <EmptyState title="문의를 찾을 수 없습니다." action={<Link to="/inquiries">목록으로 돌아가기</Link>} />;

  return (
    <div className="space-y-6">
      <Link to="/inquiries" className="inline-flex items-center gap-2 text-sm font-bold text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" />
        문의 목록
      </Link>

      <Card>
        <div className="grid grid-cols-6 gap-4">
          <Meta label="ID" value={inquiry.id} />
          <Meta label="채널" value={<ChannelBadge channel={inquiry.channel} />} />
          <Meta label="고객명" value={inquiry.customer.name} />
          <Meta label="문의 유형" value={<InquiryTypeBadge type={inquiry.type} />} />
          <Meta label="처리방식" value={<ProcessingBadge mode={inquiry.processingMode} />} />
          <Meta label="상태" value={<StatusBadge status={inquiry.status} />} />
        </div>
      </Card>

      <div className="grid grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="space-y-6">
          <Card title="문의 원문" description={formatDateTime(inquiry.receivedAt)}>
            <p className="whitespace-pre-line text-sm leading-7 text-ink-900">{inquiry.body}</p>
            {inquiry.orderId && <p className="mt-4 rounded-lg bg-ink-50 p-3 text-sm font-bold text-ink-700">주문번호: {inquiry.orderId}</p>}
          </Card>

          <Card title="참고 문서 / 근거">
            {inquiry.draft?.sources.length ? (
              <div className="space-y-3">
                {inquiry.draft.sources.map((source) => (
                  <div key={source.id} className="rounded-xl border border-ink-200 bg-ink-50 p-4">
                    <p className="text-sm font-bold text-ink-900">{source.title}</p>
                    <p className="mt-1 text-xs font-semibold text-brand-700">{documentTypeLabels[source.type]}</p>
                    <p className="mt-2 text-sm leading-6 text-ink-500">{source.excerpt}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="연결된 근거 문서가 없습니다." description="자동응답 또는 수동 처리 문의일 수 있습니다." />
            )}
          </Card>
        </div>

        <Card
          title="AI 답변 초안 / 최종 답변"
          description="관리자는 초안을 수정한 뒤 임시저장하거나 발송할 수 있습니다."
          action={
            <div className="flex gap-2">
              <Button variant="secondary" icon={<Save className="h-4 w-4" />} disabled={isSaving || !finalText.trim()} onClick={handleSave}>
                임시저장
              </Button>
              <Button icon={<Send className="h-4 w-4" />} disabled={isSaving || !finalText.trim()} onClick={handleSend}>
                발송
              </Button>
            </div>
          }
        >
          <Textarea value={finalText} onChange={(event) => setFinalText(event.target.value)} placeholder="답변 내용을 작성하세요." className="min-h-[420px]" />
          {inquiry.autoReplyText && (
            <div className="mt-4 rounded-xl bg-brand-50 p-4 text-sm leading-6 text-brand-700">
              <p className="font-bold">자동응답 문구</p>
              <p className="mt-1">{inquiry.autoReplyText}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-ink-500">{label}</p>
      <div className="mt-2 text-sm font-bold text-ink-900">{value}</div>
    </div>
  );
}
