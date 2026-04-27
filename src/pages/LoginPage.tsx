import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Bot, LockKeyhole } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, Input } from '../components/FormControls';
import type { Session } from '../types/domain';

export function LoginPage({ session, onLogin }: { session: Session; onLogin: () => Promise<void> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session.isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    await onLogin();
    setIsSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-ink-100 p-8">
      <div className="grid w-full max-w-5xl grid-cols-[1.1fr_0.9fr] overflow-hidden rounded-[2rem] border border-ink-200 bg-white shadow-card">
        <div className="bg-ink-900 p-12 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500">
            <Bot className="h-7 w-7" />
          </div>
          <h1 className="mt-10 text-4xl font-black leading-tight">고객문의 응답을 검토 가능한 운영 흐름으로 만듭니다.</h1>
          <p className="mt-5 text-base leading-7 text-ink-200">
            카카오, 인스타그램, 이메일 문의를 한 곳에서 확인하고 AI 초안을 운영자가 수정·발송하는 PoC 관리자 콘솔입니다.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3 text-sm">
            {['자동분류', '초안검토', '로그추적'].map((item) => (
              <div key={item} className="rounded-xl bg-white/10 p-4 font-bold">
                {item}
              </div>
            ))}
          </div>
        </div>
        <Card className="rounded-none border-0 p-12 shadow-none">
          <div className="mb-8">
            <p className="text-sm font-bold text-brand-600">HSA ADMIN</p>
            <h2 className="mt-2 text-2xl font-black text-ink-900">Mock 관리자 로그인</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">실제 인증은 백엔드 연동 단계에서 교체합니다.</p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label="이메일">
              <Input defaultValue="admin@hsa.local" readOnly />
            </Field>
            <Field label="비밀번호">
              <Input defaultValue="mock-password" type="password" readOnly />
            </Field>
            <Button className="w-full" disabled={isSubmitting} icon={<LockKeyhole className="h-4 w-4" />}>
              {isSubmitting ? '로그인 중...' : '콘솔 입장'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
