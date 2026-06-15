'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type User = { id: number; email: string; name?: string };

const authenticatedNavItems = [
  { label: 'Control Center', href: '/dashboard' },
  { label: 'Copilot', href: '/assistant' },
  { label: 'Communication', href: '/responses' },
  { label: 'Documents', href: '/documents' },
  { label: 'Brain', href: '/knowledge' },
  { label: 'Tasks', href: '/tasks' }
];

const publicNavItems = [
  { label: 'Home', href: '/' }
];

export default function SiteNav() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = window.localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.userId, email: payload.email, name: payload.name });
      } catch {
        setUser(null);
      }
    }
  }, []);

  function handleSignOut() {
    window.localStorage.removeItem('authToken');
    setUser(null);
    window.location.href = '/';
  }

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
      <div className="section-container flex items-center justify-between py-4">
        <Link href="/" className="font-semibold text-white">
          Estech AI Copilot
        </Link>

        <div className="flex items-center gap-6 text-sm text-slate-300">
          {publicNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-4">
              {authenticatedNavItems.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              ))}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-slate-950">
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-slate-400 transition hover:text-rose-400"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="transition hover:text-white">
                Sign In
              </Link>
              <Link href="/register" className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}