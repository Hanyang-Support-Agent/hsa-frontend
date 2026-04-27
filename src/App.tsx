import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { api } from './lib/api';
import type { Session } from './types/domain';
import { ToastProvider } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InquiriesPage } from './pages/InquiriesPage';
import { InquiryDetailPage } from './pages/InquiryDetailPage';
import { LogsPage } from './pages/LogsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DevIntakePage } from './pages/DevIntakePage';

function ProtectedLayout({ session, onLogout }: { session: Session; onLogout: () => void }) {
  if (!session.isAuthenticated) return <Navigate to="/login" replace />;
  return <AppShell session={session} onLogout={onLogout} />;
}

export default function App() {
  const [session, setSession] = useState<Session>({ isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getSession()
      .then(setSession)
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogin = useCallback(async () => {
    const nextSession = await api.login();
    setSession(nextSession);
  }, []);

  const handleLogout = useCallback(async () => {
    const nextSession = await api.logout();
    setSession(nextSession);
  }, []);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-bold text-ink-500">콘솔을 불러오는 중입니다...</div>;
  }

  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage session={session} onLogin={handleLogin} />} />
        <Route element={<ProtectedLayout session={session} onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inquiries" element={<InquiriesPage />} />
          <Route path="/inquiries/:id" element={<InquiryDetailPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/dev/intake" element={<DevIntakePage />} />
        </Route>
        <Route path="*" element={<Navigate to={session.isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </ToastProvider>
  );
}
