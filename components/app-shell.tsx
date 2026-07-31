'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SidebarNav from './sidebar-nav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const savedScroll = localStorage.getItem(`scroll-${pathname}`);
    if (savedScroll) {
      const main = document.querySelector('main');
      if (main) main.scrollTop = parseInt(savedScroll, 10);
    }
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <main className="flex-1 lg:pl-64 overflow-y-auto">
        <div className="px-6 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}