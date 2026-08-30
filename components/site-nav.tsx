'use client';

import Link from 'next/link';
import { useSupabaseContext } from '@/providers/supabase-provider';
import { Bot, LogOut } from 'lucide-react';

const authenticatedNavItems = [
  { label: 'Control Center', href: '/dashboard' },
  { label: 'Copilot', href: '/assistant' },
  { label: 'Communication', href: '/responses' },
  { label: 'Documents', href: '/documents' },
  { label: 'Brain', href: '/knowledge' },
  { label: 'Tasks', href: '/tasks' }
];

export default function SiteNav() {
  const { user, signOut } = useSupabaseContext();

  async function handleSignOut() {
    await signOut();
    window.location.href = '/';
  }

  return (
    <nav className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
            <Bot className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="text-lg font-semibold text-text-heading">Estech AI</span>
        </Link>

        <div className="flex items-center gap-5 text-sm">
          {user ? (
            <div className="flex items-center gap-4">
              {authenticatedNavItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className="text-text-muted transition hover:text-text-heading"
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex items-center gap-3 pl-4 border-l border-border/40">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                  {(user as any)?.name?.[0] || user?.email?.[0]?.toUpperCase()}
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-text-muted transition hover:text-danger"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-text-muted transition hover:text-text-heading">
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}