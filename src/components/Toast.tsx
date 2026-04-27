import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ToastContext, type ToastTone } from './ToastContext';

interface ToastMessage {
  id: number;
  tone: ToastTone;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now();
    setMessages((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setMessages((current) => current.filter((item) => item.id !== id));
    }, 2600);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-6 top-6 z-50 space-y-3">
        {messages.map((toast) => (
          <div
            key={toast.id}
            className="flex min-w-72 items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-900 shadow-card"
          >
            {toast.tone === 'success' ? <CheckCircle2 className="h-5 w-5 text-brand-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
