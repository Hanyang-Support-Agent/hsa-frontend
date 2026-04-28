import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Search,
  TerminalSquare,
} from 'lucide-react';
import type { Inquiry, Session } from '../types/domain';
import { Avatar } from '../components/Avatar';
import { Kbd } from '../components/Kbd';
import { api } from '../lib/api';
import { cx } from '../lib/format';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Inbox;
  count?: (inquiries: Inquiry[]) => number;
  countTone?: 'neutral' | 'warn' | 'success';
  group: 'main' | 'dev';
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard, group: 'main' },
  {
    to: '/inquiries',
    label: '문의 목록',
    icon: Inbox,
    group: 'main',
    count: (items) =>
      items.filter((i) => ['review_required', 'draft_ready', 'classified', 'received'].includes(i.status)).length,
    countTone: 'warn',
  },
  { to: '/logs', label: '처리 기록', icon: ScrollText, group: 'main' },
  { to: '/documents', label: '문서 관리', icon: FileText, group: 'main' },
  { to: '/dev/intake', label: '문의 주입', icon: TerminalSquare, group: 'dev' },
];

export function AppShell({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    void api.listInquiries().then((data) => {
      if (mounted) setInquiries(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // ⌘/Ctrl + K → 문의 목록 검색 진입
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/inquiries');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const adminName = session.admin?.name ?? '관리자';
  const adminRole = session.admin?.role ?? 'admin';
  const reviewCount = inquiries.filter((i) =>
    ['review_required', 'draft_ready', 'classified', 'received', 'saved'].includes(i.status),
  ).length;
  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="shell-scroll fixed inset-y-0 left-0 flex w-[272px] flex-col overflow-hidden bg-shell text-shell-text">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),transparent_28%),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,32px_32px,32px_32px]" />
        {/* Brand */}
        <div className="relative flex h-20 items-center gap-3 px-5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white shadow-lg ring-1 ring-white/15"
            style={{
              background: 'linear-gradient(135deg, #22d3ee 0%, #2563eb 54%, #7c3aed 100%)',
            }}
          >
            H
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold tracking-tight text-white">HSA Frontend</p>
            <p className="truncate text-[10.5px] uppercase text-shell-muted">
              AI Response Operations
            </p>
          </div>
        </div>

        {/* Search trigger (purely visual cue) */}
        <button
          type="button"
          onClick={() => navigate('/inquiries')}
          className="relative mx-4 flex h-9 items-center gap-2 rounded-lg border border-shell-line bg-white/[0.045] px-3 text-left text-[12px] text-shell-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-brand-400/40 hover:bg-white/[0.07] hover:text-shell-text"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 truncate">문의 검색</span>
          <Kbd className="border-shell-line bg-shell text-shell-muted">⌘K</Kbd>
        </button>

        {/* Nav */}
        <nav className="relative mt-5 flex-1 overflow-y-auto px-4 pb-3">
          <NavGroup label="MAIN">
            {navItems
              .filter((i) => i.group === 'main')
              .map((item) => (
                <NavItemLink key={item.to} item={item} inquiries={inquiries} />
              ))}
          </NavGroup>
          <NavGroup label="DEVELOPMENT" className="mt-5">
            {navItems
              .filter((i) => i.group === 'dev')
              .map((item) => (
                <NavItemLink key={item.to} item={item} inquiries={inquiries} />
              ))}
          </NavGroup>
        </nav>

        {/* User + logout */}
        <div className="relative border-t border-shell-line p-4">
          <div className="mb-3 rounded-xl border border-brand-400/20 bg-brand-400/10 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase text-brand-100">
                <Activity className="h-3 w-3" />
                Live Queue
              </span>
              <span className="rounded-full bg-warn-500/20 px-2 py-0.5 text-[11px] font-bold tabular text-warn-100">
                {reviewCount}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-shell-muted">검토 대기 문의가 운영자 액션을 기다립니다.</p>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg px-1 py-1">
            <Avatar name={adminName} size="sm" className="ring-2 ring-shell-elev" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-white">{adminName}</p>
              <p className="truncate text-[10.5px] uppercase tracking-[0.1em] text-shell-muted">
                {adminRole}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              aria-label="로그아웃"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-shell-muted transition hover:bg-shell-elev hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="ml-[272px] flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/72 px-10 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase text-ink-400">HSA Console</p>
              <h1 className="text-[17px] font-bold text-ink-900">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 text-xs font-semibold text-brand-800 shadow-xs">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand-500" />
                MSW Mock Mode
              </span>
              <span className="hidden h-8 items-center rounded-full border border-line bg-white/80 px-3 text-xs font-medium text-ink-600 shadow-xs lg:inline-flex">
                운영자: {adminName}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-10 py-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-shell-muted/70">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItemLink({ item, inquiries }: { item: NavItem; inquiries: Inquiry[] }) {
  const Icon = item.icon;
  const count = item.count?.(inquiries) ?? 0;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cx(
          'group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition',
          isActive
            ? 'bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/10'
            : 'text-shell-muted hover:bg-white/[0.055] hover:text-shell-text',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-x-4 -translate-y-1/2 rounded-r-full bg-brand-400 shadow-[0_0_12px_rgba(34,211,238,0.55)]" />
          )}
          <Icon className={cx('h-4 w-4', isActive ? 'text-brand-400' : 'text-shell-muted')} />
          <span className="flex-1 truncate">{item.label}</span>
          {count > 0 && (
            <span
              className={cx(
                'inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular',
                item.countTone === 'warn'
                  ? 'bg-warn-500/20 text-warn-100 ring-1 ring-warn-500/30'
                  : 'bg-shell-elev text-shell-text',
              )}
            >
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/inquiries/') && pathname !== '/inquiries') return '문의 상세 검토';
  if (pathname.startsWith('/inquiries')) return '문의 처리함';
  if (pathname.startsWith('/logs')) return '처리 기록';
  if (pathname.startsWith('/documents')) return '지식 문서';
  if (pathname.startsWith('/dev/intake')) return 'Mock 문의 주입';
  return '운영 대시보드';
}
