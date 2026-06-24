'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  Brain, 
  CheckSquare, 
  BarChart3, 
  Settings,
  LogOut,
  Target
} from 'lucide-react';

type AuthUser = { id: number; email: string; name?: string };

const authenticatedNavItems = [
  { label: 'Control Center', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Copilot', href: '/assistant', icon: MessageSquare },
  { label: 'Communication', href: '/responses', icon: MessageSquare },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Brain', href: '/knowledge', icon: Brain },
  { label: 'Leads', href: '/leads', icon: Target },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings }
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

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
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-8 overflow-y-auto bg-slate-950/90 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/" className="text-xl font-bold text-white">
              Estech AI
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-y-2">
            {authenticatedNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                  {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" />}
                </Link>
              );
            })}
          </nav>
          {user && (
            <div className="mt-auto border-t border-slate-800 pt-4">
              <div className="flex items-center gap-3 px-2 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-slate-950">
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-white truncate">{user.name || user.email}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-rose-400"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold text-white">
            Estech AI
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold text-slate-950">
                {user.name?.[0] || user.email[0].toUpperCase()}
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-lg p-1.5 text-slate-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}