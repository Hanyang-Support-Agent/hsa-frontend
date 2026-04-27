import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, PlusCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { Channel } from '../types/domain';
import { channelLabels } from '../types/domain';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, Input, Select, Textarea } from '../components/FormControls';
import { useToast } from '../components/ToastContext';

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
    const inquiry = await api.createDevInquiry({
      channel,
      customerName,
      contact,
      orderId,
      message,
    });
    setIsSubmitting(false);
    showToast('Mock 문의를 생성했습니다.');
    navigate(`/inquiries/${inquiry.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink-900">DEV 수집함</h2>
        <p className="mt-2 text-sm text-ink-500">실제 채널 연동 전, 카카오/인스타/이메일 문의 수집을 mock으로 검증합니다.</p>
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-6">
        <Card title="Mock 문의 주입" description="문의 본문 키워드로 유형을 추론하고, 배송+주문번호 조합은 자동응답 처리합니다.">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="채널">
                <Select value={channel} onChange={(event) => setChannel(event.target.value as Channel)}>
                  {Object.entries(channelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="고객명">
                <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="연락처 / 핸들">
                <Input value={contact} onChange={(event) => setContact(event.target.value)} />
              </Field>
              <Field label="주문번호" hint="배송 문의 자동응답 검증에 사용합니다.">
                <Input placeholder="HSA-240427-01" value={orderId} onChange={(event) => setOrderId(event.target.value)} />
              </Field>
            </div>
            <Field label="문의 본문">
              <Textarea value={message} onChange={(event) => setMessage(event.target.value)} />
            </Field>
            <Button disabled={isSubmitting || !customerName.trim() || !message.trim()} icon={<PlusCircle className="h-4 w-4" />}>
              {isSubmitting ? '생성 중...' : '문의 생성'}
            </Button>
          </form>
        </Card>

        <Card title="분류 규칙" description="백엔드 AI 분류 전까지 UX 검증용으로만 사용합니다.">
          <div className="space-y-4 text-sm leading-6 text-ink-700">
            <Rule title="배송" description="배송, 송장, 도착 키워드 포함" />
            <Rule title="교환/환불" description="환불, 교환, 반품 키워드 포함" />
            <Rule title="상품" description="원단, 사이즈, 색상, 세탁 키워드 포함" />
            <Rule title="기타" description="그 외 운영자 수동 확인 대상" />
          </div>
          <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm leading-6 text-brand-700">
            <div className="mb-2 flex items-center gap-2 font-bold">
              <Bot className="h-4 w-4" />
              자동응답 조건
            </div>
            배송 문의이고 주문번호가 있으면 `auto_replied`, 그 외는 `review_required`로 생성됩니다.
          </div>
        </Card>
      </div>
    </div>
  );
}

function Rule({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
      <p className="font-bold text-ink-900">{title}</p>
      <p className="mt-1 text-ink-500">{description}</p>
    </div>
  );
}
