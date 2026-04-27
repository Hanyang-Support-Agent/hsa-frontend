import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { ToastContext, type ToastTone } from './ToastContext';
import { cx } from '../lib/format';

interface ToastMessage {
  id: number;
  tone: ToastTone;
  message: string;
}

const toneStyles: Record<ToastTone, { icon: ReactNode; ring: string }> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 text-brand-600" />,
    ring: 'ring-brand-200',
  },
  error: {
    icon: <XCircle className="h-4 w-4 text-danger-600" />,
    ring: 'ring-danger-100',
  },
  info: {
    icon: <Info className="h-4 w-4 text-info-600" />,
    ring: 'ring-info-100',
  },
  warn: {
    icon: <AlertTriangle className="h-4 w-4 text-warn-600" />,
    ring: 'ring-warn-100',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random();
    setMessages((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setMessages((current) => current.filter((item) => item.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-6 top-6 z-50 flex flex-col gap-2">
        {messages.map((toast) => {
          const tone = toneStyles[toast.tone] ?? toneStyles.info;
          return (
            <div
              key={toast.id}
              className={cx(
                'pointer-events-auto flex min-w-[280px] max-w-md items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-3 text-sm font-medium text-ink-800 shadow-lg ring-1',
                tone.ring,
                'animate-slide-down',
              )}
            >
              {tone.icon}
              <span className="flex-1">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
