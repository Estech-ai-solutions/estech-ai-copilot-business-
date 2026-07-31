'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (!isStandalone) {
        setDeferredPrompt(e);
        setShowPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-border/40 bg-surface/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-heading mb-1">Install Estech AI</p>
          <p className="text-xs text-text-muted">Install for quick access and offline support</p>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="rounded-lg p-1 text-text-muted hover:bg-surface/60 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="primary" size="sm" onClick={handleInstall}>
          <Download className="h-3.5 w-3.5" />
          Install
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowPrompt(false)}>
          Later
        </Button>
      </div>
    </div>
  );
}