import { NavLink, Outlet } from 'react-router-dom';
import { FileText, Gauge, Inbox, LayoutDashboard, LogOut, ScrollText, Settings } from 'lucide-react';
import type { Session } from '../types/domain';
import { Button } from '../components/Button';
import { cx } from '../lib/format';

const navItems = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/inquiries', label: '문의목록', icon: Inbox },
  { to: '/logs', label: '로그조회', icon: ScrollText },
  { to: '/documents', label: '문서관리', icon: FileText },
  { to: '/dev/intake', label: 'DEV 수집함', icon: Settings },
];

export function AppShell({ session, onLogout }: { session: Session; onLogout: () => void }) {
  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="fixed inset-y-0 left-0 flex w-72 flex-col border-r border-ink-200 bg-white">
        <div className="flex h-20 items-center gap-3 border-b border-ink-200 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white">H</div>
          <div>
            <p className="text-lg font-black text-ink-900">HSA</p>
            <p className="text-xs font-semibold text-ink-500">AI 문의 응답 콘솔</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-200 p-4">
          <div className="mb-3 rounded-xl bg-ink-50 p-4">
            <p className="text-sm font-bold text-ink-900">{session.admin?.name ?? '관리자'}</p>
            <p className="text-xs text-ink-500">Mock session · {session.admin?.role ?? 'admin'}</p>
          </div>
          <Button variant="secondary" className="w-full" icon={<LogOut className="h-4 w-4" />} onClick={onLogout}>
            로그아웃
          </Button>
        </div>
      </aside>
      <div className="ml-72 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-ink-200 bg-white/90 px-8 backdrop-blur">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-brand-600">
              <Gauge className="h-4 w-4" />
              PoC Admin
            </p>
            <h1 className="mt-1 text-xl font-black text-ink-900">고객문의 분류/답변 초안 에이전트</h1>
          </div>
          <div className="rounded-full border border-ink-200 bg-ink-50 px-4 py-2 text-sm font-bold text-ink-700">ADMIN</div>
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
