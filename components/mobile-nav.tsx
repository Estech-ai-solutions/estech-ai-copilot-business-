'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSupabaseContext } from '@/providers/supabase-provider';
import { 
  LayoutDashboard, Target, MessageSquare, FileText, Brain, Bot, 
  BarChart3, Settings, LogOut, Menu, X, CheckSquare, Megaphone, User 
} from 'lucide-react';

const navigationItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads', icon: Target, label: 'Leads' },
  { href: '/responses', icon: MessageSquare, label: 'Messages' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/knowledge', icon: Brain, label: 'Business Brain' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/content', icon: Megaphone, label: 'Content Studio' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/assistant', icon: Bot, label: 'AI Copilot' },
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, signOut } = useSupabaseContext();

  async function handleSignOut() {
    await signOut();
    window.location.href = '/';
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
              <Bot className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="text-base font-semibold text-text-heading">Estech AI</span>
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl p-2 text-text-muted hover:bg-surface/60 transition"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <nav 
            className="absolute left-0 top-0 h-full w-64 border-r border-border/40 bg-background/95 backdrop-blur-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between px-4 border-b border-border/40">
              <span className="text-sm font-semibold text-text-heading">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-1.5 text-text-muted hover:bg-surface/60 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="p-3 space-y-1">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive(item.href)
                        ? 'bg-primary/15 text-primary'
                        : 'text-text-muted hover:bg-surface/60 hover:text-text-heading'
                    }`}
                  >
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.label}</span>
                    {isActive(item.href) && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {user && (
              <div className="border-t border-border/40 p-3 mt-auto">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}