'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/15 mx-auto mb-6">
          <WifiOff className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-text-heading mb-3">Offline</h1>
        <p className="text-base text-text-muted mb-6 leading-7">
          You're offline. Connect to the internet to access live data. Cached pages are available for browsing.
        </p>
        <div className="flex gap-3 justify-center">
          <Link 
            href="/"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition"
          >
            Go Home
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-border/60 bg-surface/60 px-5 py-2.5 text-sm font-medium text-text-heading hover:bg-surface/80 transition"
          >
            <RefreshCw className="h-4 w-4 inline mr-1.5" />
            Retry
          </Link>
        </div>
      </div>
    </div>
  );
}