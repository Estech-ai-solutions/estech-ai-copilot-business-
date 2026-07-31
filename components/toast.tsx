'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Toast = {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
};

type ToastContextType = {
  toasts: Toast[];
  addToast: (message: string, variant?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 min-w-[280px]',
              toast.variant === 'success' && 'bg-success/10 border-success/30 text-success',
              toast.variant === 'error' && 'bg-danger/10 border-danger/30 text-danger',
              toast.variant === 'info' && 'bg-primary/10 border-primary/30 text-primary'
            )}
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
