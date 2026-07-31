'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, MessageSquare, FileText, Brain, Megaphone, Bot, BarChart3, Settings, LogOut, CheckSquare, User } from 'lucide-react';

const navigationItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads', icon: Target, label: 'Lead Intelligence' },
  { href: '/responses', icon: MessageSquare, label: 'Communication Studio' },
  { href: '/documents', icon: FileText, label: 'Document Studio' },
  { href: '/knowledge', icon: Brain, label: 'Business Brain' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/content', icon: Megaphone, label: 'Content Studio' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/assistant', icon: Bot, label: 'AI Copilot' },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/profile', icon: User, label: 'Profile' },
];

function CheckSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M9 12l2 2l4-4" />
    </svg>
  );
}

export default function SidebarNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ ...payload });
      } catch {}
    }
  }, []);

  function handleSignOut() {
    window.localStorage.removeItem('authToken');
    window.location.href = '/';
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <aside 
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border/40 bg-background/80 backdrop-blur-xl transition-all duration-300 lg:flex ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 transition">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-text-heading">Estech AI</span>
            )}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigationItems.map((item) => (
            <div key={item.href} className="mb-1 last:mb-0">
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-muted hover:bg-surface/60 hover:text-text-heading'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {isActive(item.href) && !collapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            </div>
          ))}
        </nav>

        {user && (
          <div className="border-t border-border/40 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-sm font-medium text-primary shrink-0">
                {user.name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-text-heading">
                    {user.name || user.email}
                  </p>
                  <p className="truncate text-[0.7rem] text-text-muted">Workspace</p>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={handleSignOut}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-surface/60 hover:text-danger transition"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      <div className={`hidden lg:block ${collapsed ? 'w-20' : 'w-64'}`} />
    </>
  );
}