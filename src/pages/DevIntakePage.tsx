import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, PlusCircle, TerminalSquare, Wrench } from 'lucide-react';
import { api } from '../lib/api';
import type { Channel } from '../types/domain';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, Input, Textarea } from '../components/FormControls';
import { ChannelMark } from '../components/Badge';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/ToastContext';
import { channelMeta } from '../lib/meta';
import { cx } from '../lib/format';

const CHANNELS: Channel[] = ['kakao', 'instagram', 'email'];

export function DevIntakePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [channel, setChannel] = useState<Channel>('kakao');
  const [customerName, setCustomerName] = useState('테스트 고객');
  const [contact, setContact] = useState('test_user');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('주문한 상품 배송이 언제 도착하는지 알고 싶어요.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const inquiry = await api.createDevInquiry({
        channel,
        customerName,
        contact,
        orderId,
        message,
      });
      showToast('문의를 생성하고 AI 처리를 요청했습니다.', 'success');
      navigate(`/inquiries/${inquiry.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <>
            <TerminalSquare className="h-3 w-3" /> Development Tool
          </>
        }
        title="문의 접수 테스트"
        description="실제 채널 연동 전, 백엔드 문의 생성과 AI 처리 요청 흐름을 검증합니다."
      />

      {/* Dev warning strip */}
      <div className="flex items-start gap-3 rounded-lg border border-warn-100 bg-warn-50/70 px-4 py-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-warn-100 text-warn-700">
          <Wrench className="h-3.5 w-3.5" />
        </span>
        <div className="text-xs">
          <p className="font-semibold text-warn-700">PoC 개발/테스트 전용 화면</p>
          <p className="mt-0.5 leading-relaxed text-warn-700/80">
            실제 서비스에서는 노출되지 않으며, 운영 환경에서 비활성화됩니다. 이 화면으로 생성된
            문의는 일반 문의 목록과 동일하게 처리됩니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-5">
        <Card title="테스트 문의 접수" description="채널과 본문을 입력하면 백엔드에 문의를 생성하고 AI 처리를 요청한 뒤 상세 화면으로 이동합니다.">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Channel picker */}
            <Field label="채널">
              <div className="grid grid-cols-3 gap-2">
                {CHANNELS.map((ch) => (
                  <button
                    type="button"
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={cx(
                      'flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition',
                      channel === ch
                        ? 'border-ink-900 bg-ink-900/[0.03] shadow-xs ring-1 ring-ink-900/10'
                        : 'border-line bg-surface hover:border-line-strong',
                    )}
                  >
                    <ChannelMark channel={ch} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">
                        {channelMeta[ch].label}
                      </p>
                      <p className="text-[11px] text-ink-500">
                        {ch === 'kakao' ? '비즈니스 채널' : ch === 'instagram' ? 'DM' : 'CS 메일'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="고객명" required>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </Field>
              <Field
                label="연락처 / 핸들"
                hint="이메일 주소, 카카오 ID, 인스타 handle 등"
              >
                <Input value={contact} onChange={(e) => setContact(e.target.value)} />
              </Field>
            </div>

            <Field
              label="주문번호"
              hint="현재 백엔드 문의 생성 API는 주문번호를 받지 않아 참고용으로만 입력합니다."
            >
              <Input
                placeholder="HSA-240427-01"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </Field>

            <Field label="문의 본문" required>
              <Textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>

            <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
              <Button
                size="md"
                disabled={!customerName.trim() || !message.trim()}
                loading={isSubmitting}
                icon={<PlusCircle className="h-4 w-4" />}
              >
                문의 생성
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card title="백엔드 처리 흐름" description="문의 생성 후 백엔드가 AI 서버에 처리 요청을 전달합니다." flush>
            <ul className="divide-y divide-line">
              <Rule label="1" keywords="POST /api/inquiries" tone="info" />
              <Rule label="2" keywords="POST /api/inquiries/{id}/ai-processing" tone="warn" />
              <Rule label="3" keywords="GET /api/admin/inquiries/{id}" tone="success" />
              <Rule label="4" keywords="운영자 검토 · 수정 · 발송" tone="neutral" />
            </ul>
          </Card>

          <Card flush>
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <Bot className="h-3.5 w-3.5" />
              </span>
              <div className="text-xs">
                <p className="font-semibold text-ink-900">AI 처리 연결</p>
                <p className="mt-0.5 leading-relaxed text-ink-600">
                  문의 생성 직후 백엔드가 AI 처리 API를 호출하고, 저장된 결과를 상세 화면에서
                  답변 초안으로 확인합니다. 프론트는 AI 서버를 직접 호출하지 않습니다.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Rule({
  label,
  keywords,
  tone,
}: {
  label: string;
  keywords: string;
  tone: 'info' | 'warn' | 'success' | 'neutral';
}) {
  const dot = {
    info: 'bg-info-500',
    warn: 'bg-warn-500',
    success: 'bg-brand-500',
    neutral: 'bg-ink-400',
  }[tone];
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', dot)} />
      <p className="text-sm font-semibold text-ink-900">{label}</p>
      <p className="ml-auto truncate font-mono text-[11px] text-ink-500">{keywords}</p>
    </li>
  );
}

