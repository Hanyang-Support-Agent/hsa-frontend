import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowRight, Bot, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { Button } from '../components/Button';
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
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr] bg-bg">
      {/* Visual panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-shell p-12 text-shell-text">
        {/* Subtle backdrop pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Brand glow */}
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-[480px] w-[480px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, rgba(16,185,129,0.35), rgba(16,185,129,0))',
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white shadow-inner"
              style={{
                background: 'linear-gradient(135deg, var(--color-brand-400), var(--color-brand-700))',
              }}
            >
              H
            </div>
            <p className="text-sm font-semibold tracking-tight text-white">HSA Console</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-shell-line bg-shell-elev px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-400">
            <Sparkles className="h-3 w-3" /> CS Triage Agent · PoC
          </p>
          <h1 className="text-[40px] font-bold leading-[1.15] tracking-tight text-white">
            고객문의 응답을
            <br />
            <span className="text-brand-400">검토 가능한 흐름</span>으로.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-shell-text/80">
            카카오, 인스타그램, 이메일 문의를 한 곳에서 받고
            <br />
            AI가 만든 초안을 운영자가 다듬어 발송하는 콘솔입니다.
          </p>

          <ul className="mt-10 space-y-3 text-sm">
            <Feature icon={<Workflow className="h-4 w-4" />} title="자동 분류 + 자동응답">
              배송·교환·상품·기타 분류, DB 조회 가능 문의는 즉시 발송
            </Feature>
            <Feature icon={<Bot className="h-4 w-4" />} title="RAG 답변 초안">
              정책·FAQ·상품 문서를 검색해 인용 근거가 있는 초안 생성
            </Feature>
            <Feature icon={<ShieldCheck className="h-4 w-4" />} title="검토 가능한 발송">
              모든 응답은 운영자 확인 후 전송, 전 과정 로그 추적
            </Feature>
          </ul>
        </div>

        <div className="relative flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-shell-muted">
          <span>v0.1 · PoC Build</span>
          <span>·</span>
          <span>2026.04</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center px-12">
        <div className="w-full max-w-sm">
          <p className="text-micro font-semibold uppercase tracking-[0.16em] text-brand-700">
            HSA Admin
          </p>
          <h2 className="mt-2 text-h1 text-ink-900">콘솔 입장</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            현재는 mock 인증이 활성화되어 있어 그대로 입장할 수 있습니다.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Field label="이메일">
              <Input defaultValue="admin@hsa.local" readOnly />
            </Field>
            <Field label="비밀번호">
              <Input defaultValue="mock-password" type="password" readOnly />
            </Field>
            <Button
              size="lg"
              className="w-full"
              loading={isSubmitting}
              iconRight={<ArrowRight className="h-4 w-4" />}
            >
              {isSubmitting ? '로그인 중…' : '콘솔 입장'}
            </Button>
          </form>

          <p className="mt-6 text-xs leading-relaxed text-ink-500">
            실제 인증 연동은 백엔드 통합 단계에서 교체됩니다. 현재 화면은 PoC 디자인 검증
            용도입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/20">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-xs leading-relaxed text-shell-text/70">{children}</p>
      </div>
    </li>
  );
}
